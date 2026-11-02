# Cyberpunk Termux IDE — Current-State Assessment and Next Milestone

Read-only assessment. "Verified" = confirmed by a file/schema read this turn. "Reported" = claimed in earlier turns, not re-checked now.

## 1. Genuinely working (verified in code)
- Core IDE shell: Landing, Auth (email/password), Projects, Index (IDE), Docs, GitHub/OAuth callbacks, Link Extension pages exist.
- Database: projects, project_files, file_tree, chat_messages, profiles, user_roles, user_plans, ai_usage_log, user_api_keys, project_exports, extensions, extension_context, extension_link_codes, agent_memory_snapshots, workspace_snapshots, admin_audit_log (22 migrations).
- Backend functions present: codex-chat, codex-agent, lady-violet-chat, git-sync, github-clone, github-oauth, analyze-project, project-watcher, extension-bridge, extension-link, ElevenLabs voice (tts/clone/conversation), HuggingFace, API-key saving, roles.
- Bridge patch writes now use a single upsert on (project_id, path) with checked results (repaired last turn).
- Memory timeline, workspace snapshots, Publish Wizard, Demo Mode, Verification PDF components exist.

## 2. Partial, mocked or demo-only
- Verification PDF: scores are deterministic heuristics, not real consensus/hallucination detection.
- Demo Mode: scripted walkthrough, not a real pipeline run.
- Tiered plans/BYOK: tables and gating exist; no Stripe/payment wiring.
- Extension link flow: hands the user's current session token to the extension rather than a scoped, revocable token (security caveat).
- Voice foundation (speechToText/textToSpeech/voiceRouter modules) and "GPT-5.5" provider profiles: not confirmed this turn; treat as unverified.

## 3. Most important broken/unfinished workflows
- Preview has a typecheck error: `src/lib/bridgeActions.test.ts` imports `bun:test` with no type declarations, and package.json has no test script. This blocks a clean build signal.
- vNext items not in the database: no `agent_sessions`, `agent_messages`, `build_reports`, or activity-timeline tables. Build History / persistent Activity Timeline are therefore not persisted.
- Founder Mode (bypass plans/quotas/gates, persistent StudioShell layout) was planned but no implementation found.
- Autonomous build loop (plan → generate → build → fix → preview) and expanded model dropdown with fallback were planned, not confirmed implemented.
- Roadmap reliability items are still unchecked; end-to-end memory restore and bridge apply have not been browser-tested.

## 4. Architecture and dependency risks
- `AIChatPanel.tsx` is 1,324 lines doing chat, gating, memory, attachments, verification — high regression risk for any edit.
- Overlapping gating paths (`useUserPlan`, `useEffectivePlan`, `useUserRole`) — future Founder Mode must toggle one place.
- Session-token sharing to extension (see above).
- Many edge functions with external providers (ElevenLabs, HuggingFace, GitHub) depend on secrets; failures are silent unless surfaced.
- Single backend instance serves preview and published app — schema changes affect live users immediately.

## 5. Smallest high-value next milestone
"Green baseline": make the build clean and prove core flows work.
1. Fix the `bun:test` typecheck error (exclude test files from the app typecheck or add bun types already shipped; no new paid deps) and add a `test` script.
2. Run the existing bridge test.
3. Browser-check: landing loads, sign in, open project, send one chat message, memory snapshot save/restore, bridge apply.
4. Tick roadmap items and report results.

## 6. Credit-conscious sequence
1. Green baseline (above) — small, unblocks everything.
2. Founder Mode flag: one central bypass in `useEffectivePlan` + server check in codex-chat. Reversible, no schema change.
3. Build reports + activity timeline: one migration (build_reports, agent_activity) and a read-only Build History panel; write a report at the end of each Generate.
4. Persistent agent sessions (agent_sessions/agent_messages) or reuse chat_messages — decide after step 3 to avoid duplicate storage.
5. Model dropdown + cheap-model fallback in codex-chat.
6. Replace extension token sharing with scoped token.
7. Later: split AIChatPanel, Stripe, signed Android builds.

Each step is independently shippable and verified in the preview before the next.
