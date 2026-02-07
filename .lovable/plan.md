
# Cyberpunk Termux: Mobile + Voice + Extension Enhancement Plan

## Executive Summary
This plan addresses four major enhancement areas for the Cyberpunk Termux IDE: mobile responsiveness, voice integration with ElevenLabs, chat history management, and extension system finalization. Each area includes specific implementation steps designed to integrate seamlessly with the existing cyberpunk-themed architecture.

---

## 1. Mobile UI Fixes

### Current Issues Identified
- The `StudioHeader` component has a fixed horizontal layout with 15+ buttons that overflow on mobile screens
- No horizontal scrolling or responsive behavior for the header toolbar
- The header uses `flex items-center space-x-2` without overflow handling
- Mobile users cannot access buttons like Terminal, Preview, Test, Integrations, etc.

### Implementation Approach

**A. Responsive Header Toolbar**
- Wrap the action buttons container in a horizontally scrollable area using `overflow-x-auto`
- Add CSS for smooth horizontal scroll with hidden scrollbar aesthetic
- Group buttons into priority categories (Primary: Run/Stop, Secondary: Panels, Tertiary: Settings)

**B. Mobile Hamburger Menu Alternative**
- Create a collapsible dropdown menu for mobile using the existing `DropdownMenu` component
- Show condensed icon-only buttons on mobile with full labels on hover/tap
- Use `useIsMobile()` hook to conditionally render mobile vs desktop layouts

**C. Button Visibility Rules**
- Primary actions (Run, Stop, Terminal, AI Chat) always visible
- Secondary actions (Preview, Test, Git, etc.) in overflow menu on mobile
- Settings and user menu remain accessible via dropdown

### Files to Modify
- `src/components/StudioHeader.tsx` - Add responsive layout
- `src/index.css` - Add horizontal scroll styles for mobile
- Consider creating `src/components/MobileHeaderMenu.tsx` for mobile-specific menu

---

## 2. Live Advanced Voice Integration (ElevenLabs)

### Current State
- No voice integration exists currently (search found 0 matches)
- The AI Chat Panel has text-only interaction
- ElevenLabs streaming is mentioned as "wired in" but not implemented

### Implementation Approach

**A. Voice Infrastructure Setup**
- Create `supabase/functions/elevenlabs-tts/index.ts` edge function for text-to-speech
- Create `supabase/functions/elevenlabs-conversation/index.ts` for streaming voice agents
- Store `ELEVENLABS_API_KEY` as a backend secret

**B. Voice Selector UI Component**
Create a new `VoiceSelector` component for the AI Chat Panel:
- Dropdown with preset voices (Roger, Sarah, Laura, Charlie, George, etc.)
- Custom "Sol" voice preset as default
- Voice settings (stability, similarity boost, speed controls)
- Toggle for voice output on/off

**C. Real-time Voice Playback**
- Implement streaming TTS using ElevenLabs `/v1/text-to-speech/{voice_id}/stream` endpoint
- Use Web Audio API for real-time playback
- Add visual audio indicator (waveform/speaking indicator) during playback
- Implement pause/stop controls

**D. Voice Response Toggle**
- Add a microphone/speaker toggle in the chat panel header
- When enabled, AI responses are both displayed as text AND spoken
- Store preference in localStorage for persistence

### Files to Create/Modify
- `supabase/functions/elevenlabs-tts/index.ts` (new)
- `supabase/functions/elevenlabs-conversation/index.ts` (new) 
- `src/components/VoiceSelector.tsx` (new)
- `src/components/VoicePlaybackControls.tsx` (new)
- `src/components/AIChatPanel.tsx` - Integrate voice controls
- `src/hooks/useVoicePlayback.ts` (new) - Audio playback logic

### Secrets Required
- `ELEVENLABS_API_KEY` - Required for API access

---

## 3. Chat History Management

### Current State
- Chat history is saved to `chat_messages` table per user and project
- Basic "Clear History" button exists
- No session/thread selection UI
- History loads on component mount but no way to browse past sessions

### Implementation Approach

**A. Chat Session/Thread System**
Add a `chat_sessions` table to group messages by conversation thread:
```text
- id (uuid)
- user_id (uuid)
- project_id (uuid, nullable)
- title (text) - Auto-generated from first message
- created_at (timestamp)
- updated_at (timestamp)
```

**B. Chat History Selector UI**
- Add a dropdown/sidebar in the chat panel showing recent sessions
- Display session title, date, and message count
- "New Chat" button to start fresh thread
- Session title editable (auto-generated initially)

**C. History Features**
- Search within chat history
- Filter by project or "all projects"
- Delete individual sessions
- Export chat history as JSON/Markdown

### Files to Create/Modify
- Database migration for `chat_sessions` table
- `src/components/ChatSessionSelector.tsx` (new)
- `src/components/AIChatPanel.tsx` - Integrate session selector
- `src/hooks/useChatSessions.ts` (new) - Session management logic

---

## 4. Extension System Finalization

### Current State
- `extensions` table exists with RLS policies
- `ExtensionManager`, `ExtensionCard`, `ExtensionSubmitForm`, `ExtensionSandbox` components created
- `submit-extension` edge function deployed
- No extensions in database currently (empty table)
- No admin approval UI
- Extension loader uses dynamic imports

### Implementation Approach

**A. Validate Database & RLS**
- Verify `extensions` table RLS policies work correctly
- Test insert via submit-extension function
- Ensure `is_approved` and `is_enabled` flags work

**B. Admin Extension Approval UI**
Create admin-only interface for reviewing submissions:
- List pending extensions (`is_approved = false`)
- Preview extension details and source URL
- Approve/Reject buttons
- Uses existing `has_role(auth.uid(), 'admin')` function

**C. Sample Extensions Bundle**
Create 2-3 sample extensions hosted in the project:
1. **Matrix Rain Controller** - Adjust background animation intensity
2. **Terminal Clock Widget** - Display time in terminal header
3. **Quick Snippet Inserter** - Code snippet shortcuts

**D. Extension Sync to Cloud**
- Save installed extension IDs to user's profile or dedicated table
- Sync across devices on login
- Add `user_extensions` table if needed

### Files to Create/Modify
- `src/components/extensions/AdminExtensionPanel.tsx` (new)
- `public/sample-extensions/matrixRain.js` (new)
- `public/sample-extensions/terminalClock.js` (new)
- `public/extensions.json` - Update with sample extensions
- Database migration for `user_extensions` table (if needed)
- `src/components/extensions/ExtensionManager.tsx` - Add admin section for admins

---

## Technical Details

### Database Changes Required

1. **Chat Sessions Table** (optional enhancement):
```sql
CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ADD COLUMN session_id uuid REFERENCES chat_sessions(id);
```

2. **User Extensions Table** (for cross-device sync):
```sql
CREATE TABLE user_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  extension_id uuid REFERENCES extensions(id),
  installed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, extension_id)
);
```

### Edge Functions Required

1. `elevenlabs-tts/index.ts` - Text-to-speech streaming
2. `elevenlabs-conversation/index.ts` - Real-time voice agent (optional)

### Component Hierarchy

```text
AIChatPanel
├── ChatSessionSelector (new)
├── VoiceSelector (new)
├── VoicePlaybackControls (new)
├── CodexActionBar (existing)
└── MessageList (existing)

StudioHeader
├── DesktopToolbar (existing, refactored)
└── MobileHeaderMenu (new, conditional)

ExtensionManager
├── ExtensionCard (existing)
├── ExtensionSubmitForm (existing)
└── AdminExtensionPanel (new, role-gated)
```

---

## Implementation Priority Order

| Priority | Task | Complexity |
|----------|------|------------|
| 1 | Mobile header responsive fix | Low |
| 2 | Extension system validation & samples | Medium |
| 3 | Chat session selector UI | Medium |
| 4 | Voice integration infrastructure | High |
| 5 | Admin extension approval panel | Medium |
| 6 | Cross-device extension sync | Medium |

---

## Testing Checklist

- [ ] Mobile: All header buttons accessible on 375px width
- [ ] Mobile: Horizontal scroll works smoothly
- [ ] Extensions: Submit form creates database entry
- [ ] Extensions: RLS allows viewing approved extensions
- [ ] Extensions: Admin can approve/reject submissions
- [ ] Extensions: Sample extensions load and execute
- [ ] Chat: Session selector shows previous conversations
- [ ] Chat: New chat starts fresh thread
- [ ] Voice: TTS edge function returns audio stream
- [ ] Voice: Voice selector persists preference
- [ ] Voice: Audio plays through browser speakers
