# Phase 2 — Bridge Interop + Admin RBAC

Five coordinated upgrades to the Browser Extension Bridge, plus an Admin role that bypasses all plan gating.

## 1. One-Click Apply + Build/Debug Pipeline

Turn bridged inbox items into actionable patches.

- Extend `extension_context.metadata` to optionally carry `{ kind: "patch" | "command" | "context", files?: [{path, content}], command?: string, pipeline?: "build"|"preview"|"test"|"debug" }`.
- New `BridgeInboxPanel` actions on each item:
  - **Apply to Repo** — when `files[]` present, write through `snapshotEngine` (auto pre-snapshot for undo), then mark consumed.
  - **Run Pipeline** — dispatches to existing IDE handlers: build (PublishWizard detect), preview (LivePreview refresh), test (TestingSuite), debug (open Terminal + Codex with error context).
  - **Load into Chat** — current behavior, unchanged.
- New helper `src/lib/bridgeActions.ts` to route each `kind` → correct IDE subsystem.

## 2. Conversational Memory Snapshots (cross-device continuity)

Persist Codex thread state so linked sessions resume on restart and on a second device.

- New table `agent_memory_snapshots`:
  - `id, user_id, project_id, session_id, summary text, messages jsonb, model text, persona jsonb, device_label text, created_at`
  - RLS: user-scoped; GRANT to authenticated + service_role.
- Auto-snapshot triggers (debounced 30s) inside `AIChatPanel`: on send, on model switch, on tab close (`beforeunload`).
- On project open, fetch latest snapshot for `(user_id, project_id)` and hydrate messages if local store is empty or older.
- New `MemoryTimelinePanel` in StudioSidebar listing snapshots with device label + restore button.

## 3. OAuth Handshake for Extension Linking (no pasted tokens)

Replace the current "paste access token" popup flow with a short-lived device-code link.

- New table `extension_link_codes`: `code text pk, user_id uuid, scopes jsonb, claimed_at, expires_at` (5-min TTL).
- New edge function `extension-link`:
  - `POST /start` (extension, unauthenticated) → returns `{ code, verification_url }`.
  - `GET /poll?code=...` → returns `{ access_token, refresh_token }` once user approves in IDE.
  - `POST /approve` (IDE, authenticated) → mints a scoped Supabase session JWT bound to `extension:bridge` audience.
- New IDE page `/link-extension?code=XYZ` shows scopes + Approve/Deny.
- Extension `popup.js` rewrites: click "Link Account" → opens `verification_url` → polls until approved → stores token in `chrome.storage`. Tokens are auto-refreshable; no long-lived secret on disk.

## 4. Two-Way Context Sync (round-trip prompts + results)

Today the bridge is one-way (extension → IDE). Add IDE → extension echo.

- Add columns to `extension_context`: `direction text default 'inbound'`, `parent_id uuid`, `response text`, `response_at timestamptz`.
- After Codex answers a message that originated from a bridged item, edge function inserts a sibling row with `direction='outbound', parent_id=<original>, response=<assistant text>`.
- Extension `background.js` opens a `chrome.runtime.connect` long-poll (or Supabase Realtime via REST stream) and surfaces a desktop notification + injects the response next to the original selection on the source page (ChatGPT/Claude/etc.).
- `BridgeInboxPanel` shows threaded view: original prompt → IDE response, with copy-back button.

## 5. Admin RBAC Bypass (separate from plan tier)

Admin role unlocks every feature regardless of `user_plans.plan`.

- Reuse existing `app_role` enum + `user_roles` table + `has_role()` function — no schema change.
- New hook `useEffectivePlan()` wrapping `useUserPlan` + `useUserRole`:
  - If `isAdmin` → returns synthetic plan `{ plan: 'admin', allowed_models: ALL_MODELS, daily_limit: Infinity, monthly_limit: Infinity, byok_enabled: true }`.
- Replace direct `useUserPlan` calls in `AIChatPanel`, `SettingsPanel`, `LiveVoiceMode`, `VoiceManagementPanel`, `PublishWizard`, `StudioApiKeySelector` with `useEffectivePlan`.
- Server-side: in `codex-chat`, `elevenlabs-*`, and any model-gating edge functions, check `has_role(user_id, 'admin')` before applying `allowed_models` / daily-limit checks.
- New `AdminBadge` in `StudioHeader` (visible only to admins) — small "ADMIN" chip; clicking opens `/admin` (already gated by `ProtectedRoute requiredRole="admin"`).
- Add CLI/SQL note in Docs: how to grant admin via `insert into user_roles(user_id, role) values (..., 'admin')`.

---

## Technical Layout

```text
DB migrations
  + agent_memory_snapshots         (table + RLS + GRANTs)
  + extension_link_codes           (table + RLS + GRANTs)
  + extension_context              (ALTER: direction, parent_id, response, response_at)

Edge functions
  + extension-link/index.ts        (start / poll / approve)
  ~ extension-bridge/index.ts      (emit outbound rows + threaded GET)
  ~ codex-chat/index.ts            (admin bypass; outbound bridge echo when origin=bridge)

Frontend
  + src/hooks/useEffectivePlan.ts
  + src/hooks/useAgentMemory.ts
  + src/lib/bridgeActions.ts
  + src/components/MemoryTimelinePanel.tsx
  + src/components/AdminBadge.tsx
  + src/pages/LinkExtension.tsx     (/link-extension route)
  ~ src/components/BridgeInboxPanel.tsx   (Apply/Run/Threaded view)
  ~ src/components/AIChatPanel.tsx        (auto-snapshot + useEffectivePlan)
  ~ src/components/SettingsPanel.tsx, LiveVoiceMode.tsx, StudioApiKeySelector.tsx, PublishWizard.tsx
  ~ src/components/StudioHeader.tsx       (AdminBadge)
  ~ src/components/StudioSidebar.tsx      (MemoryTimelinePanel)
  ~ src/App.tsx                            (+ /link-extension)

Extension (public/extension/)
  ~ popup.html / popup.js          (Link Account flow, drop token paste)
  ~ background.js                  (poll loop + outbound response handler + notifications)
  ~ content.js                     (inject IDE response back into source page)
  ~ manifest.json                  (notifications permission)
```

## Build Order

1. DB migrations (3 changes) — single migration call.
2. Admin RBAC bypass (small, unblocks QA of everything else).
3. OAuth handshake (new edge function + `/link-extension` page + extension popup).
4. Two-way sync (bridge schema + edge function emit + extension listener).
5. Memory snapshots (table + hook + panel + autosnapshot hooks).
6. One-click apply/build actions (bridgeActions + panel buttons).
7. Smoke test each phase in preview, then publish.

## Out of Scope

- Stripe/Paddle plan changes.
- Mobile extension (Chrome MV3 desktop only for now).
- Multi-user shared sessions (memory snapshots are per-user).
- Encrypting snapshot payloads at rest (RLS-only for v1).
