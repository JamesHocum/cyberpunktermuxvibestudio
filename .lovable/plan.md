

# Flexible AI Access Architecture — Refined Implementation Plan

## Overview

Implement a 5-phase tiered AI system (free, pro, premium, BYOK) across database, edge function, client hook, settings UI, and chat panel feature gating. Each phase is independently deployable and preserves existing IDE stability.

## Design Adjustments from Original Proposal

1. **Preview sandbox**: Per memory `constraints/preview-sandbox-connectivity`, this is a confirmed Lovable platform limitation with the Sandpack bundler proxy. No app-side or config-side fix exists — the published URL works correctly. I will add a contextual error detection banner in `LivePreview.tsx` only as a UX improvement, not as a fix.

2. **BYOK routing**: The existing `save-api-key` edge function and `user_api_keys` table already support storing per-user keys for `openai`, `huggingface`, `elevenlabs`. BYOK will reuse this infrastructure — no new tables needed for key storage. The `codex-chat` function will check `user_api_keys` for a matching provider key when the user's plan has `byok_enabled`.

3. **Model list**: The `AVAILABLE_MODELS` array in `SettingsPanel.tsx` and `SUPPORTED_MODELS` in `codex-chat` will be kept in sync. Premium-only models will be tagged in a shared constant.

4. **Plan enum**: Using a text column with CHECK constraint instead of a custom enum, to avoid migration complexity. Values: `free`, `pro`, `premium`.

---

## Phase 1: Database Schema

**Migration SQL** — creates two tables:

### `user_plans`
| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid (unique, NOT NULL) | — |
| plan | text NOT NULL | 'free' |
| daily_limit | integer | 15 |
| monthly_limit | integer | 100 |
| allowed_models | text[] | {'google/gemini-3-flash-preview','google/gemini-2.5-flash-lite'} |
| byok_enabled | boolean | false |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

### `ai_usage_log`
| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid NOT NULL | — |
| created_at | timestamptz | now() |
| model_used | text | — |
| tokens_used | integer | 0 |
| source | text | 'managed' |

**RLS policies:**
- `user_plans`: authenticated users SELECT own row only
- `ai_usage_log`: authenticated users SELECT own rows; INSERT via service role in edge function

**Key behavior**: If no `user_plans` row exists for a user, the edge function treats them as `free` with default limits. No existing user is broken.

---

## Phase 2: Edge Function — Plan-Aware Routing

**File**: `supabase/functions/codex-chat/index.ts`

After authentication succeeds (line ~267), add:

1. Create a service-role client to query `user_plans` for the authenticated user
2. If no row, use free defaults: `{ plan: 'free', daily_limit: 15, monthly_limit: 100, allowed_models: ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash-lite'], byok_enabled: false }`
3. Query `ai_usage_log` COUNT for today and this month for the user
4. If daily or monthly limit exceeded, return 429 with `{ error: 'Daily/monthly AI usage limit reached', usageExhausted: true }`
5. Gate the requested model against `allowed_models` — fall back to default if not allowed
6. **BYOK path**: If `byok_enabled` is true, check `user_api_keys` for an `openai` key. If found, route directly to `https://api.openai.com/v1/chat/completions` with the user's key instead of Lovable AI gateway. Only OpenAI BYOK supported initially.
7. After successful streaming response starts, INSERT into `ai_usage_log` (using service role client)
8. Return `X-Plan`, `X-Daily-Remaining`, `X-Monthly-Remaining` headers

Existing rate limiter stays as a safety net. The plan-based limits are checked first.

---

## Phase 3: Client Hook — `useUserPlan`

**New file**: `src/hooks/useUserPlan.ts`

```text
Exports:
- plan: 'free' | 'pro' | 'premium'
- dailyRemaining: number
- monthlyRemaining: number
- dailyLimit: number
- monthlyLimit: number
- allowedModels: string[]
- byokEnabled: boolean
- isFree: boolean
- isPro: boolean
- isPremium: boolean
- refreshPlan(): void
```

- Fetches from `user_plans` table on auth change
- Falls back to free defaults if no row exists
- Queries `ai_usage_log` count for today/month
- Re-fetches after each chat message send (called from AIChatPanel)

---

## Phase 4: Settings Panel — "AI & Usage" Tab

**File**: `src/components/SettingsPanel.tsx`

Add a 7th tab "AI" (using `Cpu` icon) to the existing 6-tab grid (change to `grid-cols-7`):

- **Plan badge**: Shows current tier (FREE / PRO / PREMIUM) with color coding
- **Usage bars**: Daily usage (X/Y) and Monthly usage (X/Y) as progress bars
- **API Key Mode**: Toggle between "Managed AI" and "Bring Your Own Key"
  - BYOK section: OpenAI API key input, saved via existing `save-api-key` function
  - Only visible if plan has `byok_enabled` (pro/premium)
- **Model selector**: Shows allowed models; premium models greyed out with lock icon for free users
- **Upgrade prompt**: "Upgrade to Pro" / "Upgrade to Premium" CTA (links to future Stripe page, for now shows toast)

---

## Phase 5: Chat Panel Feature Gating

**File**: `src/components/AIChatPanel.tsx`

- Import `useUserPlan` hook
- Before `sendMessage`: check `dailyRemaining > 0` — if exhausted, show toast "Daily AI limit reached — upgrade your plan" and block send
- In the chat header area: show a small usage badge "12/15 today" with color (green > yellow > red)
- Gate premium features:
  - **Build Mode** (autonomous copilot): requires `isPro || isPremium`
  - **Image analysis**: requires `isPro || isPremium` (free gets 0)
  - **Voice TTS**: requires `isPro || isPremium`
  - **Live Voice mode**: requires `isPremium`
- For locked features: show lock icon overlay on the relevant buttons with tooltip "Upgrade to [tier] to unlock"
- After each successful message, call `refreshPlan()` to update remaining counts

---

## Phase 6: Preview Sandbox UX (Minor)

**File**: `src/components/LivePreview.tsx`

Add error detection in the Sandpack error handler — if the error message contains "Could not connect" or "bundler", show a contextual amber banner: "Preview sandbox may be temporarily unavailable — your app works normally at the published URL" instead of a raw red error. This is a UX improvement only, not a fix for the platform limitation.

---

## Feature Gating Matrix

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Chat messages/day | 15 | 100 | Unlimited (9999) |
| Chat messages/month | 100 | 3000 | Unlimited (99999) |
| Models | Flash, Flash Lite | + Pro, GPT-5-mini | All models |
| Build Mode | Locked | Yes | Yes |
| Image analysis | Locked | Yes | Yes |
| Voice TTS | Locked | Yes | Yes |
| Live Voice | Locked | Locked | Yes |
| BYOK | Locked | Yes | Yes |

---

## Files Summary

| Phase | Action | File |
|-------|--------|------|
| 1 | Migration | `user_plans` + `ai_usage_log` tables + RLS |
| 2 | Modify | `supabase/functions/codex-chat/index.ts` |
| 3 | Create | `src/hooks/useUserPlan.ts` |
| 4 | Modify | `src/components/SettingsPanel.tsx` |
| 5 | Modify | `src/components/AIChatPanel.tsx` |
| 6 | Modify | `src/components/LivePreview.tsx` |

## Testing Plan

After implementation:
1. **Free user**: verify 15/day limit enforced, premium buttons locked, Flash models only
2. **Managed AI path**: send a message, confirm usage logged, remaining count decrements
3. **BYOK path**: save an OpenAI key, enable BYOK in plan, verify routing to OpenAI
4. **Premium gating**: verify Build Mode, Voice, Live Voice show lock icons for free
5. **Preview sandbox**: trigger the Sandpack error, confirm friendly banner appears
6. **Published URL**: confirm app works normally at cyberpunk-termux-ide.lovable.app

