

# Cyberpunk Termux: Comprehensive Enhancement Plan

## Overview
This plan covers four major enhancements: momentum scrolling for drag-scroll, ElevenLabs voice integration, drag-scroll verification, and Electron build guidance. 

**Important Technical Note:** Lovable is a web-based platform that cannot run Node.js child processes or `electron-builder` commands server-side. The suggestion to create API routes with `exec()` to run npm scripts won't work because:
1. Lovable uses Vite, not Next.js (no `/pages/api/` routes)
2. Lovable cannot execute shell commands or Node.js processes
3. Electron builds must be done locally or via CI/CD (GitHub Actions)

However, I will implement a **Build Information Panel** that guides users on how to build locally and provides download links when builds are uploaded to external storage or GitHub Releases.

---

## 1. Momentum/Inertia Scrolling for Drag-Scroll Hook

### Current Implementation
The `useDragScroll` hook tracks mouse position and updates `scrollLeft` directly. When the user releases the mouse, scrolling stops immediately.

### Enhancement
Add momentum scrolling using velocity tracking and `requestAnimationFrame` for smooth deceleration after release.

### Technical Approach

**Velocity Tracking:**
- Track the last few mouse positions with timestamps
- Calculate velocity (pixels/ms) on mouse release
- Apply exponential decay animation using `requestAnimationFrame`

**Implementation Details:**
```text
New state to track:
- velocityX: number (pixels per millisecond)
- lastX: number (last cursor position)
- lastTime: number (timestamp of last move)
- animationRef: number (requestAnimationFrame ID)

On mouseUp:
1. Calculate final velocity from recent movement
2. Start momentum animation loop
3. Each frame: scroll by velocity, reduce velocity by friction factor
4. Stop when velocity near zero or scroll reaches edge

Friction factor: 0.95 (adjustable for feel)
Minimum velocity threshold: 0.1 px/ms
```

### Files to Modify
- `src/hooks/useDragScroll.ts` - Add velocity tracking and momentum animation

---

## 2. ElevenLabs Voice Integration

### Current State
- No voice integration exists
- No `ELEVENLABS_API_KEY` secret configured
- AI chat is text-only

### Implementation Plan

**A. Request API Key Secret**
The `ELEVENLABS_API_KEY` needs to be added to project secrets before voice features can work.

**B. Create Edge Function for TTS**
Create `supabase/functions/elevenlabs-tts/index.ts`:
- Accepts text and voiceId in request body
- Calls ElevenLabs streaming TTS API
- Returns audio stream with proper CORS headers
- Uses `eleven_turbo_v2_5` model for low latency

**C. Create Voice Playback Hook**
Create `src/hooks/useVoicePlayback.ts`:
- Manages audio playback state
- Handles streaming audio from edge function
- Provides play/stop/pause controls
- Tracks speaking state for UI indicators

**D. Create Voice Selector Component**
Create `src/components/VoiceSelector.tsx`:
- Dropdown with preset ElevenLabs voices
- "Sol" custom voice as default option
- Voice toggle (on/off) for AI responses
- Visual speaking indicator
- Persist preference to localStorage

**E. Integrate into AI Chat Panel**
Update `src/components/AIChatPanel.tsx`:
- Add voice toggle button in header area
- Speak AI responses when voice is enabled
- Show audio waveform/indicator during playback
- Add speaker icon button on each assistant message

### Preset Voices Configuration
```text
Voices to include:
- Sol (custom/default) - Uses "Charlie" voice ID: IKne3meq5aSn9XLyUdCD
- Roger - CwhRBWXzGAHq8TQ4Fs17
- Sarah - EXAVITQu4vr4xnSDxMaL
- Laura - FGY2WhTYpPnrIDTdsKH5
- Charlie - IKne3meq5aSn9XLyUdCD
- George - JBFqnCBsd6RMkjVDRZzb
- Callum - N2lVS1w4EtoT3dr4eOWO
- Lily - pFZP5JQG7iQjIQuC4Bku
```

### Files to Create
- `supabase/functions/elevenlabs-tts/index.ts`
- `src/hooks/useVoicePlayback.ts`
- `src/components/VoiceSelector.tsx`

### Files to Modify
- `src/components/AIChatPanel.tsx`

---

## 3. Electron Build Information Panel

### Limitation Explanation
Lovable cannot execute `electron-builder` or provide direct `.exe` downloads because:
1. No server-side Node.js process execution capability
2. No local file system access for build outputs
3. Web platform cannot run shell commands

### Alternative Implementation

**A. Create BuildInfoPanel Component**
Create `src/components/BuildInfoPanel.tsx`:
- Displays build instructions for local development
- Shows terminal commands for each platform
- Provides links to GitHub Releases (if configured)
- Shows electron-builder.config.js configuration

**B. Display Current Configuration**
Show the existing `electron-builder.config.js` settings:
- Product name: Cyberpunk Termux Studio
- Windows targets: NSIS installer + Portable
- Output directory: `release/`

**C. Build Instructions UI**
```text
Local Build Steps:
1. Clone repository from GitHub
2. Run: npm install
3. Run: npm run build (builds Vite frontend)
4. Run: npx electron-builder --win (Windows)
   Or: npx electron-builder --mac (macOS)
   Or: npx electron-builder --linux (Linux)
5. Find installers in /release folder

Outputs:
- Windows: CyberpunkTermux-Setup.exe (NSIS installer)
- Windows: CyberpunkTermux-Portable.exe (portable)
- macOS: CyberpunkTermux.dmg
- Linux: CyberpunkTermux.AppImage
```

**D. GitHub Actions Integration**
The project already has `.github/workflows/build-electron.yml` that:
- Triggers on version tags (v*)
- Builds for Windows, macOS, Linux
- Uploads to GitHub Releases

### Files to Create
- `src/components/BuildInfoPanel.tsx`

### Files to Modify
- `src/components/MatrixToolsPanel.tsx` - Add "Electron Builder" section

---

## 4. Verify Drag-Scroll Works

### Testing Strategy
After implementing momentum scrolling, verification should include:

1. **Basic Drag Test**
   - Click and drag on toolbar empty space
   - Verify horizontal scroll follows mouse movement
   - Verify buttons are still clickable

2. **Momentum Test**
   - Quick drag and release
   - Verify scroll continues with deceleration
   - Verify scroll stops at container edges

3. **Zoom Test**
   - Set browser zoom to 150%
   - Verify all buttons visible via scroll
   - Test drag-scroll at increased zoom

4. **Touch Prevention**
   - Verify touch devices use native scroll
   - Hook should not interfere with mobile

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/elevenlabs-tts/index.ts` | TTS edge function for voice synthesis |
| `src/hooks/useVoicePlayback.ts` | Audio playback state management |
| `src/components/VoiceSelector.tsx` | Voice selection dropdown with presets |
| `src/components/BuildInfoPanel.tsx` | Electron build instructions and info |

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useDragScroll.ts` | Add momentum/inertia scrolling |
| `src/components/AIChatPanel.tsx` | Integrate voice controls and playback |
| `src/components/MatrixToolsPanel.tsx` | Add Electron Builder section |

### Secrets Required
- `ELEVENLABS_API_KEY` - Required for voice synthesis API

---

## Implementation Order

| Step | Task | Dependencies |
|------|------|--------------|
| 1 | Add momentum to useDragScroll hook | None |
| 2 | Request ELEVENLABS_API_KEY secret | None |
| 3 | Create elevenlabs-tts edge function | API Key |
| 4 | Create useVoicePlayback hook | Edge function |
| 5 | Create VoiceSelector component | Playback hook |
| 6 | Integrate voice into AIChatPanel | All voice components |
| 7 | Create BuildInfoPanel | None |
| 8 | Add build info to MatrixToolsPanel | BuildInfoPanel |

---

## Credit Usage Note
I understand your concern about credits. Plan mode is designed for exploration and planning without executing code changes. The actual implementation will consume credits when you approve and I begin writing code.

Regarding daily credit refresh - credit management and refresh schedules are handled by the Lovable platform at the account level. I don't have control over credit timing, but you can check your credit status in the Lovable dashboard settings.

