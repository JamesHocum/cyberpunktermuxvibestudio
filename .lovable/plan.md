

# Fix TTS Quota Error Misreporting

## Problem
The ElevenLabs TTS edge function receives a `quota_exceeded` error from ElevenLabs but passes the raw HTTP status back to the client. The client maps this to "Authentication expired — please sign in again", which is incorrect and confusing. The real issue is the ElevenLabs account has exhausted its monthly voice credits.

## The React Sandbox "Couldn't connect to server"
This is a known Lovable preview platform issue with the Sandpack bundler proxy. No code fix needed — works on the published URL. Not actionable from the codebase.

## Changes

### 1. Edge Function: Parse ElevenLabs quota errors
**File**: `supabase/functions/elevenlabs-tts/index.ts`

In the `!response.ok` handler (lines 109-116), parse the ElevenLabs error body and detect `quota_exceeded`. Return a user-friendly 402 status with message "Voice credit quota exceeded — please upgrade your ElevenLabs plan or wait for reset" instead of passing through the raw ElevenLabs status code.

### 2. Client: Add quota-exceeded handling
**File**: `src/hooks/useVoicePlayback.ts`

In the error status switch (lines 148-160), add a `status === 402` case that shows "Voice credits exhausted — contact admin or upgrade ElevenLabs plan" instead of the generic auth error. This prevents the misleading "sign in again" message.

## Files Summary

| Action | File | What |
|--------|------|------|
| Modify | `supabase/functions/elevenlabs-tts/index.ts` | Detect quota_exceeded, return 402 with clear message |
| Modify | `src/hooks/useVoicePlayback.ts` | Handle 402 status with quota-specific user message |

## Notes
- Your ElevenLabs account currently has only 104 credits remaining. You'll need to wait for your quota to reset or upgrade your ElevenLabs plan to use TTS again.
- The auth flow itself is working correctly — the session JWT is valid and the edge function authenticates successfully. The error only occurs *after* auth succeeds, when ElevenLabs rejects the request due to quota.

