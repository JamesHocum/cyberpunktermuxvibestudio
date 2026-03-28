

# Voice Management Panel, Live Voice-to-Voice Mode, and Refinement Pass

## Overview

This is a refinement pass adding three major pieces:
1. A Voice Management Panel for previewing, renaming, and deleting custom cloned voices
2. A live voice-to-voice conversational mode using ElevenLabs Conversational AI SDK
3. Polish across chat controls, branding, persistence, and UX cohesion

Existing features (chat maximize/minimize, voice cloning dialog, TTS playback, session auth) are confirmed working and will not be rebuilt.

---

## 1. Voice Management Panel

**New file**: `src/components/VoiceManagementPanel.tsx`

A dialog/panel accessible from the VoiceSelector (gear icon next to the + button) that shows:
- **Preset voices section** (read-only, with preview/play button per voice)
- **Custom voices section** with per-voice actions:
  - Play/preview: calls ElevenLabs TTS with a short sample phrase using the voice
  - Rename: inline editable name field, updates localStorage
  - Delete: removes from localStorage, resets to default if currently selected
- Clear visual distinction: preset voices show a lock icon, custom voices show the ✦ marker
- Cyberpunk-styled dialog matching existing clone dialog aesthetic

**Modify**: `src/components/VoiceSelector.tsx`
- Add a settings/gear button next to the + button that opens the management panel
- Pass `currentVoice` and `onVoiceChange` to the management panel

**Modify**: `src/hooks/useVoicePlayback.ts`
- On init, also check localStorage `custom-voices` to restore custom voice selection (currently only checks preset voices by ID)

---

## 2. Live Voice-to-Voice Mode (ElevenLabs Conversational AI)

This is the flagship differentiator — hands-free agentic coding via real-time voice.

**Install**: `@elevenlabs/react` package

**New edge function**: `supabase/functions/elevenlabs-conversation-token/index.ts`
- Generates a single-use WebRTC conversation token from ElevenLabs API
- Uses existing `ELEVENLABS_API_KEY` secret (already configured)
- Requires an ElevenLabs Agent ID — will add as a secret (`ELEVENLABS_AGENT_ID`). If not yet configured, the UI shows a graceful "Live voice not configured" state with setup instructions

**New component**: `src/components/LiveVoiceMode.tsx`
- Uses `useConversation` hook from `@elevenlabs/react`
- Large microphone button with pulsing animation when active
- Shows speaking/listening state with visual feedback
- Integrates with existing chat: voice transcripts appear as user messages, AI responses play back as speech
- Supports interruption/barge-in natively (ElevenLabs handles this)
- Stop/disconnect button to exit voice mode
- Volume visualization using `getInputVolume()` / `getOutputVolume()`

**Modify**: `src/components/AIChatPanel.tsx`
- Add a "Live Voice" toggle button (microphone icon with radio waves) next to the existing voice selector
- When activated, renders `LiveVoiceMode` component overlay within the chat panel
- Chat history continues to accumulate — voice transcripts become chat messages
- Switching between text and voice preserves full session state

**Fallback layer**: If `ELEVENLABS_AGENT_ID` is not configured, the live voice button shows a tooltip explaining setup is needed. The abstraction allows swapping providers later without rewrites.

---

## 3. Chat Panel Controls QA & Polish

**Modify**: `src/components/AIChatPanel.tsx`
- Ensure maximize transitions are smooth (add CSS transition on panel)
- Verify minimize preserves chat history (already does via state in StudioLayout parent)
- No rebuilds needed — just minor transition CSS

---

## 4. Branding Polish

**Copy**: Upload the user's Termux logo image to `src/assets/termux-logo.png` for use in React components
- Update `src/components/StudioHeader.tsx` to import and use the new branded logo
- Landing page already has branding from prior pass

**Verify**: favicon files in `public/` already exist (`favicon.ico`, `favicon-192.png`, `favicon-512.png`, `termux-logo.jpeg`)

---

## 5. Voice Cloning Dialog Polish

**Modify**: `src/components/VoiceSelector.tsx`
- Add success animation on clone completion (brief green flash)
- Add error state styling (red border on failed upload)
- Reset file input ref on dialog close
- Verify cloned voices persist and appear after refresh (already uses localStorage — confirmed working)

---

## 6. Persistence Refinement

**Modify**: `src/hooks/useVoicePlayback.ts`
- On init, if stored `voice-id` starts with `custom-`, look up in localStorage `custom-voices` array instead of only checking preset voices
- This fixes the case where a user selects a custom voice, refreshes, and loses the selection

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/components/VoiceManagementPanel.tsx` | Preview, rename, delete custom voices |
| Create | `src/components/LiveVoiceMode.tsx` | Real-time voice-to-voice via ElevenLabs Conversational AI |
| Create | `supabase/functions/elevenlabs-conversation-token/index.ts` | WebRTC token generation |
| Modify | `src/components/VoiceSelector.tsx` | Add gear button for management panel, polish clone dialog |
| Modify | `src/components/AIChatPanel.tsx` | Add Live Voice button, minor transition polish |
| Modify | `src/hooks/useVoicePlayback.ts` | Fix custom voice restoration on refresh |
| Modify | `supabase/config.toml` | Register new edge function |
| Copy | Termux logo to `src/assets/` | Branding asset |
| Modify | `src/components/StudioHeader.tsx` | Use branded logo import |
| Modify | `package.json` | Add `@elevenlabs/react` dependency |

---

## Technical Notes

- The ElevenLabs Conversational AI Agent must be created in the ElevenLabs dashboard. The edge function only generates auth tokens. If no agent ID is configured, the UI degrades gracefully.
- Voice management uses localStorage only — no database table needed since custom voices are ElevenLabs-side resources identified by voiceId.
- The live voice WebRTC connection runs client-side via the SDK. The edge function is only called once to get a token.
- All existing flows (TTS playback, chat maximize/minimize, voice cloning, session auth) remain untouched.

