

# Hotfixes: VeylStage Hardening, TTS Speaker Fix, and Build Copilot Polish

## Current State Analysis

After thorough code review, here is the actual status of each requested fix:

### HOTFIX 1 -- Portal Gate: ALREADY IMPLEMENTED
The portal is already strictly gated in `MonacoEditor.tsx` (line 422):
```text
{syntaxTheme === 'veyl-stage' && (
  <VeylStage isActive={syntaxTheme === 'veyl-stage'} ... />
)}
```
No portal call occurs when the theme is not `veyl-stage`. No leak exists.

### HOTFIX 2 -- Safety Gate Inside VeylStage: NEEDS MINOR HARDENING
The component uses `isActive` to control its state machine, but adding an explicit early-return `enabled` guard provides defense-in-depth if VeylStage is ever mounted from another location.

**Change:** Add `enabled` prop with default `false`, return `null` immediately if not enabled.

### HOTFIX 3 -- White Card/Wrapper: NOT PRESENT
The avatar renders as a transparent PNG with `object-contain` and a green `drop-shadow`. There is no `<Card>`, no `bg-white`, no border, no padding wrapper anywhere in VeylStage. No change needed.

### HOTFIX 4 -- CSS Fallback Background: ADD ATMOSPHERIC GRADIENTS
VeylStage is a portal-based floating overlay (not a scene container), so it has no "background" to fill. However, we can add subtle radial gradient atmosphere behind the avatar canvas for visual depth, using pure CSS so it never depends on missing image assets.

**Change:** Add layered radial gradients (green/purple haze) behind the particle canvas inside the portal wrapper.

### TTS FIX -- Speaker Button Silent: ROOT CAUSE FOUND
The speaker button (`Volume2` icon) at line 808 calls `voicePlayback.speak(text)`. However, `speak()` silently returns on line 74 if `voiceEnabled` is `false` (the default). This means clicking the speaker button does nothing unless the user has separately toggled voice ON via the VoiceSelector dropdown -- which is unintuitive. When a user explicitly clicks the speaker icon on a message, it should always attempt playback regardless of the global toggle.

**Change:** Add a `speakDirect(text)` function that bypasses the `voiceEnabled` check, used only for explicit speaker button clicks. The global toggle continues to control auto-read behavior.

### BUILD COPILOT -- Already Functional, Minor Polish
The build mode detection, auto-apply, and download ZIP button are all wired. One issue: the `autoApply` prop on `MessageContent` is set based on `applyHistory` state, which may not be populated for the initial render of build-mode messages since auto-apply happens in `AIChatPanel` after streaming. This can cause the "Download Project ZIP" button to not appear.

**Change:** Track build-mode messages by ID so `autoApply` is set correctly for messages generated in build mode.

---

## Implementation Plan

### 1. VeylStage.tsx -- Add `enabled` guard + atmospheric gradients

- Add `enabled?: boolean` to `VeylStageProps` (default `false`)
- Add early return: `if (!enabled) return null;` before the existing `if (mode === "hidden" || !mounted)` check
- Add atmospheric CSS gradient layers inside the portal wrapper div, behind the canvas:
  - Black base
  - Green radial glow at 50% 40% (opacity 0.14)
  - Purple radial glow at 60% 70% (opacity 0.12)
  - Vertical vignette gradient

### 2. MonacoEditor.tsx -- Pass `enabled` prop

- Update the VeylStage call to include `enabled={true}` (it's already theme-gated, this is defense-in-depth)

### 3. useVoicePlayback.ts -- Add `speakDirect` function

- Add a new `speakDirect(text: string)` method that runs the same TTS pipeline as `speak()` but skips the `voiceEnabled` check
- Export it in the return object

### 4. AIChatPanel.tsx -- Wire speaker button to `speakDirect`

- Change speaker button `onClick` from `voicePlayback.speak(message.content)` to `voicePlayback.speakDirect(message.content)`
- Track build-mode message IDs in a `Set` so `autoApply` is correctly set on `MessageContent` for those messages

### 5. Deploy edge function (no changes needed)

The `elevenlabs-tts` and `codex-chat` edge functions are already correctly configured. The `ELEVENLABS_API_KEY` secret is present. No backend changes required.

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/VeylStage.tsx` | Add `enabled` prop guard + atmospheric gradient layers |
| `src/components/MonacoEditor.tsx` | Pass `enabled={true}` to VeylStage |
| `src/hooks/useVoicePlayback.ts` | Add `speakDirect()` method bypassing voiceEnabled check |
| `src/components/AIChatPanel.tsx` | Use `speakDirect` for speaker button; track build-mode message IDs for autoApply |

No destructive changes. Existing architecture preserved. No files deleted.

