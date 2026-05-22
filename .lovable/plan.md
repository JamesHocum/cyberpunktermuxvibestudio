# Phase 5.5 — Three Targeted Additions

The earlier AI-access architecture (user_plans, ai_usage_log, useUserPlan, plan-aware codex-chat with BYOK) is already shipped. This plan covers the three new pieces you just asked for. Each is independently shippable.

---

## 1. Smart Publish Wizard

Replace the immediate 10-target grid with a guided 3-step flow. Keep the existing `PublishDialog.tsx` reachable as "Advanced Options".

**New files**
- `src/lib/detectProjectType.ts` — inspects file map + `package.json` and returns `{ type: 'react-vite' | 'next' | 'pwa' | 'electron' | 'static', recommendedTarget, reason, etaSeconds }`.
- `src/components/PublishWizard.tsx` — three-step UI:
  1. Detection card ("Detected: React + Vite — Reason: …")
  2. Recommendation card with big **Publish Now** button + collapsible **Advanced Options** that mounts the existing `PublishDialog` content.
  3. Pre-publish summary (Type / Target / Status / ETA) then runs the chosen exporter.
- `src/components/DeploymentReport.tsx` — post-publish modal showing URL, framework, method used, warnings, and next-step suggestions (custom domain, Stripe, analytics). Persists a row to `project_exports` with `export_type` suffixed `:wizard`.

**Modified**
- `src/components/StudioHeader.tsx` (and any other Publish trigger) — opens `PublishWizard` instead of `PublishDialog`.
- `src/components/PublishDialog.tsx` — accepts a `embedded` prop so it can render inside the wizard's Advanced panel without its own dialog chrome.

Brand-aligned styling (neon green / violet, terminal font) reused from existing tokens.

---

## 2. Provider Fallback Chain

Centralize model calls behind a router that tries providers in order and falls through on `429`, `402`, `5xx`, or network error.

**New files**
- `src/lib/providers/index.ts` — `chat({ profile, messages, stream })` interface.
- `src/lib/providers/lovable.ts` — calls Lovable AI Gateway (current default).
- `src/lib/providers/openai.ts` — direct OpenAI when BYOK key present.
- `src/lib/modelRouter.ts` — profile → ordered provider chain:
  - `Economy` → [Lovable: gemini-2.5-flash-lite]
  - `Balanced` → [Lovable: gpt-5.5-mini → Lovable: gemini-3-flash-preview]
  - `Architect` → [OpenAI BYOK gpt-5.5 → Lovable: gpt-5.5 → Lovable: gemini-2.5-pro]

**Modified**
- `supabase/functions/codex-chat/index.ts` — replaces the inline single-provider fetch with a `tryChain(providers)` helper that returns the first 2xx streaming response. Logs each fallback hop to `ai_usage_log.source` (`managed`, `byok`, `fallback`). Honors plan's `allowed_models` at each hop.
- `supabase/functions/codex-agent/index.ts` and `lady-violet-chat/index.ts` — same helper, shared via `supabase/functions/_shared/providerChain.ts`.

Errors surface to client only after the full chain exhausts; partial-stream failures abort cleanly without double-sending tokens.

---

## 3. Workspace Snapshots

Point-in-time saves of a project's full file tree, restorable with one click.

**Database migration**
```text
workspace_snapshots
  id uuid pk
  project_id uuid not null
  user_id uuid not null
  label text
  reason text         -- 'manual' | 'pre-build' | 'pre-restore' | 'auto-daily'
  file_count int
  size_bytes int
  files jsonb         -- { path: { content, file_type } }
  created_at timestamptz default now()
```
RLS: user owns row AND owns the parent project (same pattern as `project_files`).

**New files**
- `src/hooks/useWorkspaceSnapshots.ts` — list, create, restore, delete.
- `src/components/SnapshotsPanel.tsx` — sidebar tab with timeline list, diff count badge, restore button (confirms first, takes a `pre-restore` snapshot, then writes files via existing `project_files` upsert), and delete.
- `src/lib/snapshotEngine.ts` — capture (reads project_files), restore (writes back), and prune (keep last 20 + all manual).

**Modified**
- `src/components/StudioSidebar.tsx` — add "Snapshots" tab (Camera icon).
- `src/components/AIChatPanel.tsx` (build flow) — auto-create a `pre-build` snapshot before any Generate/Refactor that will write multiple files.
- `src/components/StudioHeader.tsx` — quick "📸 Snapshot" button (creates a manual snapshot with optional label).

Storage strategy: files stored inline in `jsonb` for simplicity; prune keeps usage bounded. Future migration path to Storage bucket if rows grow large.

---

## Out of Scope (this batch)

- Persistent agent sessions, build reports, activity timeline, voice foundation, browser extension API — covered by the earlier vNext plan; will land in a follow-up.
- Stripe checkout for plan upgrades.
- Multi-region snapshot storage.

---

## Execution Order

1. Workspace Snapshots migration (requires your approval) → snapshot engine → UI panel → pre-build hook.
2. Provider fallback chain (shared helper + three edge functions).
3. Smart Publish Wizard (detect → wizard → completion report).
4. Final report listing files created/modified, migrations, and any remaining issues.

Approve to proceed; I'll start with the snapshots migration and pause for your sign-off there before touching code.
