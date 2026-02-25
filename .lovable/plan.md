

# Fix Integration Connection Failures

## Root Cause

The HuggingFace "Test Connection" fails because HuggingFace has **deprecated** their old API URL. The edge function currently calls `https://api-inference.huggingface.co/models/...` which returns a **410 Gone** error:

> "https://api-inference.huggingface.co is no longer supported. Please use https://router.huggingface.co instead."

The token **saving works fine** (confirmed by the "Token Saved" toast in screenshots). The issue is purely in the test/inference call.

For ElevenLabs, the test also likely fails because the `save-api-key` edge function clears the input after save, so when testing there's no immediate way to confirm the key was persisted -- but the underlying issue may also be that no ElevenLabs key exists yet (the toggle is off in the screenshots).

## Changes

### 1. Fix HuggingFace API URL (`supabase/functions/huggingface-inference/index.ts`)

Update the API endpoint from the deprecated URL to the new one:

```text
Old: https://api-inference.huggingface.co/models/{model}
New: https://router.huggingface.co/hf-inference/models/{model}
```

This is the only change needed to fix HuggingFace test connections.

### 2. Improve error handling in test connection

Update the `testHuggingFaceConnection` function in `IntegrationPanel.tsx` to surface more specific error messages from the edge function response (e.g., "API deprecated", "token invalid") instead of the generic "Connection Failed" message. This will use `supabase.functions.invoke` response data to check for error details.

### 3. Verify save-api-key works for all services

The `save-api-key` edge function already handles `huggingface`, `elevenlabs`, and `openai`. The save flow works (confirmed by screenshots showing success toasts). No changes needed there.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/huggingface-inference/index.ts` | Update API URL from `api-inference.huggingface.co` to `router.huggingface.co/hf-inference` |
| `src/components/IntegrationPanel.tsx` | Improve error messages in test handlers to surface backend error details |

