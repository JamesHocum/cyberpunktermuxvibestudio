

# Add ElevenLabs & OpenAI API Key Inputs + Verify HF Token Flow

## Overview

Add per-user API key input sections for ElevenLabs and OpenAI (ChatGPT) in the Integration Panel, following the same pattern as the existing HuggingFace token input. Also update the `elevenlabs-tts` edge function to check for user-specific keys, and create a generic `save-api-key` edge function to replace the HF-specific one.

## Changes

### 1. New Edge Function: `supabase/functions/save-api-key/index.ts`

A generic version of `save-hf-token` that accepts `{ service, token }` so it works for any integration (huggingface, elevenlabs, openai). Requires authentication, validates input, upserts into `user_api_keys`.

### 2. Update `supabase/functions/elevenlabs-tts/index.ts`

Add a lookup for user-specific ElevenLabs API key from `user_api_keys` (service = 'elevenlabs') before falling back to the server-level `ELEVENLABS_API_KEY` secret -- same pattern already used in `huggingface-inference`.

### 3. Update `src/components/IntegrationPanel.tsx`

**New state variables:**
- `elTokenInput`, `showElToken`, `isSavingElToken` -- for ElevenLabs
- `openaiTokenInput`, `showOpenaiToken`, `isSavingOpenaiToken` -- for OpenAI
- `isTestingEl` -- for ElevenLabs test connection
- Add `elevenlabs` and `openai` to integrations state object

**New handler functions:**
- `saveApiKey(service, token, setLoading)` -- generic save function calling the new `save-api-key` edge function
- `testElevenLabsConnection()` -- sends a short TTS test via the `elevenlabs-tts` function
- `testOpenAIConnection()` -- sends a test prompt via `codex-chat` (which already uses Lovable AI gateway)

**New UI sections (inserted after HuggingFace, before GitHub):**

- **ElevenLabs** card with:
  - Toggle switch
  - Password input + show/hide toggle + Save button
  - Test Connection button
  - "Get Token" link to `https://elevenlabs.io/app/settings/api-keys`

- **OpenAI / ChatGPT** card with:
  - Toggle switch  
  - Password input + show/hide toggle + Save button
  - "Get API Key" link to `https://platform.openai.com/api-keys`
  - Description: "Connect your ChatGPT/OpenAI account for direct GPT model access"

**Also:** Update the existing `saveHuggingFaceToken` to use the new generic `save-api-key` function instead of `save-hf-token`.

### 4. Update `supabase/config.toml`

Add entry for the new `save-api-key` function with `verify_jwt = false` (auth handled in code).

## Technical Details

### Generic save-api-key edge function

```text
POST /save-api-key
Body: { service: "huggingface" | "elevenlabs" | "openai", token: string }
Auth: Required (Bearer token)
Action: Upserts into user_api_keys table
```

Validates `service` against an allowlist of known services. Validates token length (1-500 chars).

### ElevenLabs TTS user key lookup

Uses `SUPABASE_SERVICE_ROLE_KEY` to query `user_api_keys` for the authenticated user's ElevenLabs key, then falls back to the env secret.

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/save-api-key/index.ts` | New generic API key save function |
| `supabase/functions/elevenlabs-tts/index.ts` | Add user key lookup before env fallback |
| `src/components/IntegrationPanel.tsx` | Add ElevenLabs + OpenAI sections with token inputs |
| `supabase/config.toml` | Add `save-api-key` function config |

