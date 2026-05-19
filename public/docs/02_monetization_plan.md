# Cyberpunk Termux Codex IDE — Monetization Roadmap
**Owner:** Platform team  •  **Horizon:** Next 2 quarters  •  **Status:** Draft v1

---

## North Star
Convert the existing 4-tier plan architecture (Free / Pro / Premium / BYOK) into recurring revenue, unlock paid distribution channels (signed native binaries, app stores), and become procurement-ready for mid-market and enterprise buyers (SSO + audit).

---

## Phase 1 — Stripe Activation (Weeks 1–3)
**Goal:** Charge real money for Pro and Premium.

### Milestones
1. **Provider decision** — run `recommend_payment_provider`. Default to **Lovable's built-in Stripe payments** (seamless, no BYOK key required). Tax handling: **option 2** (calculation only) initially; upgrade to **option 1** (full compliance) once monthly volume justifies the +3.5%.
2. **Catalog** — create three SKUs via `batch_create_product`:
   - **Pro** — $19/mo or $190/yr — managed AI quota, all Flash + Pro models, voice playback.
   - **Premium** — $49/mo or $490/yr — gpt-5.2, Lady Violet agentic mode, Live Voice, Build Mode, Codex autonomous tasks.
   - **BYOK** — $9/mo — unlocks per-user API key overrides for OpenAI/Anthropic/Gemini; no managed quota.
3. **Checkout** — Stripe Checkout session from `SettingsPanel` → "Upgrade" buttons already gated by `useUserPlan`. Webhook (`stripe-webhook` edge function) updates `user_plans` row.
4. **Billing portal** — Stripe customer portal link from Settings for self-serve cancel / payment-method swap.
5. **Free-tier guardrails** — already in place via `useUserPlan` lock icons. Add a soft paywall modal on first Premium-feature click.
6. **Trial** — 14-day Premium trial, no card required, auto-downgrade to Free at expiry.

### Success metrics
- ≥3% free → paid conversion in 30 days
- <2% involuntary churn (failed payments) via Stripe Smart Retries
- First $1k MRR within 60 days of launch

---

## Phase 2 — Signed Native Builds (Weeks 3–6)
**Goal:** Make the desktop apps installable without "unidentified developer" warnings, unlock paid distribution.

### Windows
- **Authenticode cert** — purchase EV code-signing cert (DigiCert or Sectigo, ~$400/yr).
- Update `.github/workflows/build-electron.yml` to sign NSIS installer + portable .exe via `electron-builder` `win.certificateFile` + GitHub Actions secret.
- Submit to **Microsoft Store** (optional, $19 one-time dev fee) for additional discovery.

### macOS
- **Apple Developer Program** — $99/yr.
- Add `mac.identity` + notarization step (`notarize: true` in electron-builder config). Requires `APPLE_ID` + app-specific password as GH secrets.
- Distribute via DMG (already configured) + optional **Mac App Store** (sandbox entitlements required).

### Linux
- Already unsigned (AppImage / deb / rpm) — no cert needed. Add **Snap Store** + **Flathub** submissions for discovery (free).

### Android
- **Google Play Developer** — $25 one-time.
- Capacitor build (already scaffolded in export). Add `keystore` signing config + Play Console listing.
- Internal track first, then closed beta, then production.

### iOS
- **Apple Developer Program** (same as macOS).
- Requires Mac + Xcode in CI. Use **GitHub Actions macOS runner** + `fastlane match` for cert management.
- TestFlight beta → App Store review.

### Success metrics
- All five platforms shipping signed installers from CI on every tag
- Zero SmartScreen/Gatekeeper warnings on download
- ≥1,000 desktop installs in first 90 days

---

## Phase 3 — Enterprise SSO & Procurement Readiness (Weeks 6–10)
**Goal:** Unlock $500–$5k/seat/yr enterprise deals.

### SAML SSO
- Call `configure_saml_sso` (Lovable Cloud handles ACS URL + Entity ID).
- Test with Okta, Azure AD/Entra, Google Workspace as IdPs.
- Add **"SSO required"** toggle per workspace (premium tier add-on).

### SCIM provisioning (Phase 3b)
- Auto-provision/deprovision users from IdP. Implement SCIM 2.0 endpoint as an edge function.

### Audit & compliance
- **Audit log table** — already exists for RPC events; extend to all auth + billing + project mutations.
- **Data residency** — document Lovable Cloud regions; offer EU-only for GDPR-sensitive buyers.
- **SOC 2 Type I** — engage Vanta or Drata; target 90-day readiness window.
- **DPA template** — boilerplate Data Processing Agreement ready to send on request.

### Pricing
- **Team** — $99/seat/mo, 5-seat minimum, includes Premium + shared projects.
- **Enterprise** — custom (typically $40k–$150k/yr), includes SSO, SCIM, audit log export, dedicated support, SLA, on-prem proxy option.

### Sales motion
- Add **"Talk to Sales"** CTA on `/pricing` for teams >10 seats.
- Calendly + HubSpot for inbound; outbound to YC + Techstars accelerator portfolio companies as design partners.

### Success metrics
- 3 paid Team accounts within 30 days of launch
- 1 signed Enterprise LOI within 90 days
- SOC 2 Type I report in hand by end of quarter

---

## Phase 4 — Adjacent Revenue (Stretch, Weeks 10+)
- **Marketplace revenue share** — 80/20 split on paid community extensions (`extensions.json` already centralized).
- **Template store** — sell premium project templates ($5–$50). Stripe one-time charges.
- **Usage-based AI overage** — when managed-tier users blow their quota, charge per-1k-tokens at a markup over Lovable AI Gateway cost.
- **White-label** — let agencies rebrand the IDE for their clients. $999/mo per brand.

---

## Risk Register
| Risk | Likelihood | Mitigation |
|---|---|---|
| Apple notarization delays | Med | Submit early; have unsigned fallback download |
| Stripe account hold (new merchant) | Low | Pre-verify business docs; keep Paddle as backup |
| SOC 2 timeline slip | High | Start audit prep in parallel with Phase 1 |
| Free-tier abuse (cost spike) | Med | Rate-limit + per-user daily token cap already enforced |
| BYOK key leakage | Low | Keys encrypted at rest in `user_api_keys`; never logged |

---

## Sequenced Quick Wins (do this week)
1. Run `recommend_payment_provider` and post result in #product.
2. Buy `cyberpunk-termux.com` if not already owned (currently on `spell-weaver-studio.com` subdomain — own brand domain before charging money).
3. Draft `/pricing` page with the 4 tiers.
4. Open Apple Developer + Google Play accounts (multi-day approval lead time).
5. Engage Vanta for SOC 2 scoping call.
