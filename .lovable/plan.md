

# Add HuggingFace Token Input to Integration Panel

## Problem
The HuggingFace integration section has a "Get Token" link and a "Test Connection" button, but no input field for the user to enter/update their token.

## Solution
Add a token input field with show/hide toggle and a "Save Token" button to the HuggingFace section. When the user saves, it will call a new edge function that securely stores the token as a backend secret (via Vault).

## Changes

### 1. New Edge Function: `supabase/functions/save-hf-token/index.ts`
- Accepts POST with `{ token: string }`
- Requires authentication (admin only via `has_role` check)
- Stores the token in Vault using `vault.create_secret` or updates the `HUGGING_FACE_ACCESS_TOKEN` environment variable via the `supabase_functions.update_secret` approach
- Since we cannot directly update Deno env secrets from an edge function, the function will store the token in a `integration_secrets` table that the `huggingface-inference` function reads as a fallback

### Revised approach (simpler):
Instead of a new edge function, add a `user_api_keys` table to store per-user API keys. The `huggingface-inference` edge function already has the server-level secret; this UI field lets users provide their own key as an override.

**Actually, the simplest approach**: The `HUGGING_FACE_ACCESS_TOKEN` secret is already configured in the backend. The UI just needs to clearly communicate this. But since the user wants to input a token from the UI, we will:

### Final Approach
1. **Add a token input field** to the HuggingFace section in `IntegrationPanel.tsx`
2. **Create a new edge function** `save-hf-token` that accepts the token and stores it in a `user_api_keys` table
3. **Update `huggingface-inference`** to check for a user-specific token in `user_api_keys` before falling back to the server-level secret
4. **Create the `user_api_keys` table** with RLS so users can only manage their own keys

### File: `src/components/IntegrationPanel.tsx` (lines 234-263)
- Add an `Input` field (type password) for the HuggingFace token
- Add a show/hide toggle button (Eye/EyeOff icons, already imported)
- Add a "Save Token" button that calls the `save-hf-token` edge function
- Keep the existing "Test Connection" and "Get Token" elements

### Database Migration: `user_api_keys` table
```text
+------------------+
| user_api_keys    |
+------------------+
| id (uuid, PK)   |
| user_id (uuid)   |
| service (text)   |  -- e.g. 'huggingface'
| api_key (text)   |
| created_at       |
| updated_at       |
+------------------+
```
- RLS: Users can only SELECT, INSERT, UPDATE, DELETE their own rows
- Unique constraint on (user_id, service)

### New Edge Function: `supabase/functions/save-hf-token/index.ts`
- POST endpoint requiring auth
- Upserts the token into `user_api_keys` for service='huggingface'
- Returns success/failure

### Updated: `supabase/functions/huggingface-inference/index.ts`
- After authenticating the user, check `user_api_keys` for a user-specific HuggingFace token
- If found, use it; otherwise fall back to the server-level `HUGGING_FACE_ACCESS_TOKEN` secret

## UI Result
When HuggingFace is enabled, the user sees:
1. A password input field to paste their token
2. A show/hide toggle for the token
3. A "Save Token" button
4. The existing "Test Connection" button
5. The existing "Get Token" link

