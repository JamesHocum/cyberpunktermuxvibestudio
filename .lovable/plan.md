# Cyberpunk Termux IDE — vNext Upgrade Plan

A large, multi-system upgrade. Grouped into phases so each can be approved/tested before moving on. Approve this overall plan and I'll execute phase 1 first, then proceed sequentially (pausing if any phase needs a decision).

---

## Phase 1 — Persistence Foundation (DB + Agent Sessions + Build Reports)

**Database migrations**
- `agent_sessions` (id, project_id, user_id, status, created_at, updated_at)
- `agent_messages` (id, session_id, role, content, metadata jsonb, created_at)
- `build_reports` (id, project_id, user_id, prompt, status, files_created jsonb, files_modified jsonb, tests_run jsonb, warnings jsonb, errors jsonb, started_at, completed_at)
- `agent_activity` (id, project_id, user_id, event_type, message, metadata, created_at) — powers timeline
- RLS: user_id scoped on all tables; project_id ownership joins enforced.

**App wiring**
- New `useAgentSession(projectId)` hook: auto-loads last `active` session, creates one if none, streams messages.
- Replace in-memory chat state in `AIChatPanel.tsx` with Supabase-backed session.
- Persist every Codex / Lady Violet exchange to `agent_messages`.
- Remove "reset to welcome on refresh" behavior.

## Phase 2 — Build Reports + Activity Timeline UI

- `useBuildReports(projectId)` + `BuildReportPanel.tsx` (Build History list, expandable detail card matching the spec example).
- Hook every Generate/Refactor call to create a `build_reports` row at start, update at completion with parsed file list, warnings, errors.
- `ActivityTimeline.tsx` sidebar tab fed from `agent_activity` with realtime subscription. Emits events from: git ops, builds, deploys, test runs, preview reloads.

## Phase 3 — Workspace Awareness Context Injection

- New `lib/workspaceContext.ts`: gathers `{ project, branch, openFiles, recentBuilds, gitStatus, terminalTail }`.
- Inject as a structured system message prelude on every `codex-agent` / `lady-violet-chat` / `codex-chat` call.
- Edge functions updated to accept `workspace_context` and prepend it to the system prompt.

## Phase 4 — Preview Routing Fix

- Update `LivePreview.tsx` / `detectEntryFile` priority order:
  1. `app/page.tsx` → 2. `src/App.tsx` → 3. `pages/index.tsx` → 4. `index.html`
- `README.md` removed from entry candidates entirely (only used if literally nothing else exists).
- Add a small "Detected entry: X" badge in the preview header.

## Phase 5 — Provider Abstraction + Multi-Model Router

- `src/lib/providers/openai.ts`, `providers/gemini.ts`, `providers/index.ts` exposing a uniform `chat(opts)` interface.
- Model profiles: `Economy` (gemini-2.5-flash-lite), `Balanced` (gpt-5.5 / 5.5-mini), `Architect` (gpt-5.5-pro).
- `lib/modelRouter.ts`: classifies prompt → profile (simple chat→Economy, docs/codegen→Balanced, multi-file/repo analysis→Architect).
- Profile selector in chat header (Fast / Smart / Agent) with manual override.
- Edge functions read `profile` from request and map to model.
- Note: `openai/gpt-5.5` / `gpt-5.5-pro` are available on the Lovable AI Gateway — no new API keys needed.

## Phase 6 — Voice System Foundation

- `src/lib/voice/speechToText.ts`, `textToSpeech.ts`, `voiceRouter.ts` — modular, provider-agnostic.
- Push-to-talk hook `useVoiceCapture` (already partially exists via LiveVoiceMode — refactor it into this module).
- Stub OpenAI Realtime adapter ready to plug in when key is enabled.

## Phase 7 — Browser Extension API Surface

- Edge functions: `extension-analyze-page`, `extension-import-repo`, `extension-save-page`, `extension-send-to-codex`.
- All JWT-verified, rate-limited.
- `public/extension/` scaffold (manifest v3) — popup posts to these endpoints.

## Phase 8 — Founder Welcome Screen

- Replace blank Codex welcome with a dashboard card showing: Recent Builds, Recent Conversations, Current Project Status, Deployment Status, Git Status. Pulled from the new tables + existing `projects` data.

## Phase 9 — Smart Publish Wizard

- New `PublishWizard.tsx` replaces current `PublishDialog.tsx` as the default flow (old dialog kept as "Advanced Options" expansion).
- Step 1: `detectProjectType()` reads `package.json` / file tree → returns `{ type, recommended }`.
- Step 2: Recommendation card with single **Publish Now** + collapsed **Advanced Options**.
- Step 3: Advanced panel = current 10-target grid.
- Step 4: Pre-publish summary (Type / Target / Build Status / ETA).
- After publish: **Deployment Completion Report** modal (URL, framework, method, warnings, next steps) + write a row to `build_reports` with type=`deploy`.

---

## Technical Details

**Edge function changes**
- `codex-agent`, `codex-chat`, `lady-violet-chat`: accept `{ session_id, profile, workspace_context }`, persist messages server-side after streaming completes, emit `agent_activity` events.
- New: `create-build-report`, `complete-build-report`, `extension-*` endpoints.

**Realtime**
- Enable realtime on `agent_messages`, `agent_activity`, `build_reports` for live UI updates.

**File map (new)**
```text
src/
  hooks/useAgentSession.ts
  hooks/useBuildReports.ts
  hooks/useActivityTimeline.ts
  hooks/useWorkspaceContext.ts
  lib/providers/{index,openai,gemini}.ts
  lib/modelRouter.ts
  lib/voice/{speechToText,textToSpeech,voiceRouter}.ts
  lib/workspaceContext.ts
  lib/detectProjectType.ts
  components/BuildReportPanel.tsx
  components/ActivityTimeline.tsx
  components/PublishWizard.tsx
  components/FounderDashboard.tsx
public/extension/{manifest.json,popup.html,popup.js,background.js}
supabase/functions/{create-build-report,complete-build-report,
  extension-analyze-page,extension-import-repo,
  extension-save-page,extension-send-to-codex}/index.ts
```

**Files modified**
- `AIChatPanel.tsx`, `StudioLayout.tsx`, `StudioSidebar.tsx`, `LivePreview.tsx`,
  `fileDetection.ts`, `PublishDialog.tsx` (becomes Advanced view),
  `codex-agent/index.ts`, `codex-chat/index.ts`, `lady-violet-chat/index.ts`.

**Out of scope (explicit)**
- Real OpenAI Realtime voice connection (foundation only — needs your go-ahead before wiring a Realtime key).
- Publishing the browser extension to Chrome Web Store (we ship the unpacked scaffold).
- Stripe / SSO (tracked separately in monetization plan).

---

## Suggested Execution Order

1. Approve plan
2. Phase 1 migration (I'll write the SQL via the migration tool and wait for approval)
3. Phases 1–4 in one build pass (persistence + reports + context + preview fix)
4. Phases 5–6 (router + voice foundation)
5. Phases 7–9 (extension + welcome + publish wizard)
6. Final implementation report

Approve to begin with Phase 1.
