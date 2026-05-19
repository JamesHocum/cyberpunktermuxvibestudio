# CYBERPUNK TERMUX CODEX IDE
### The zero-install, AI-native IDE that ships running apps — not snippets.

---

## The Problem
Every "AI IDE" today hands developers **fragments**: a snippet here, a scaffold there, a "you'll need to install X" at the end. The result is hours of glue work before anything actually runs. Indie builders, agencies, and accelerator-stage founders waste their fastest asset — momentum — chasing missing pieces.

## The Solution
**Cyberpunk Termux Codex IDE** is a PWA-first development studio where AI is the build toolchain, not a plugin. One prompt produces a **complete, wired, runnable app**, live in the browser in seconds, exportable to 10 targets in one click.

> *"Generate → Preview → Refactor → Export. Under five minutes. Zero installs."*

---

## Flagship Features
- **Complete Runnable Build Contract** — every Generate/Refactor response must boot in the live preview. No TODO comments, no missing deps, no "install X."
- **10 Export Targets, Wired In** — PWA, Web (Vercel/Netlify), ZIP, Windows .exe, macOS DMG, Linux AppImage, Android APK, iOS IPA, Chrome Extension, IDE Extension. Every export logged for audit.
- **Lady Violet Agentic Copilot** — gpt-5.2-powered build-finisher with full undo history and agentic GitHub repo cloning.
- **4-Tier AI Access** — Free / Pro / Premium / **BYOK**. Users bring their own OpenAI, Anthropic, or Gemini key. Lock icons gate premium features cleanly.
- **Live In-Browser Preview** — Sandpack for React, Source View fallback for everything else. Same build that ships.
- **Cyberpunk Brand Identity** — Neon green, deep purple, 8 IDE themes. Memorable. Not another VS Code clone.
- **Matrix Tools Sidebar** — Real Git ops (clone/commit/push), live voice mode (WebRTC + ElevenLabs), codebase analyzer, community extension marketplace.
- **Productivity Timers** — Per-project "Thought For" / "Worked For" tracking, surfaced on the project dashboard.
- **Native Desktop Ready** — Electron NSIS + portable + DMG + AppImage configs ship in the repo. Capacitor for mobile.

## What Makes It Unique
| Other AI IDEs | Cyberpunk Termux Codex |
|---|---|
| Hand you snippets | Hands you a **running app** |
| Local install required | **Zero install** — runs in any browser as a PWA |
| One model, one tier | **4 tiers, 8+ models, BYOK** |
| "Export and pray" | **10 signed-ready export targets** |
| Generic IDE clone | **Distinct cyberpunk brand identity** |
| Chat = sidebar afterthought | Chat = **agentic build-finisher with undo** |

## Architecture (at a glance)
React 18 + Vite 5 + TypeScript 5 + Tailwind v3 on the front. **Lovable Cloud** (Supabase-powered Postgres + Auth + Storage + Realtime + Edge Functions) on the back. **Lovable AI Gateway** routes to 8+ frontier models with seamless BYOK fallback. RLS on every table. JWT on every function. SOC 2 readiness in motion.

## Ideal Customer
1. **Solo indie hackers & vibe-coders** — ship MVPs in an afternoon, not a weekend.
2. **Boutique dev shops & agencies** — white-label client projects with consistent quality.
3. **Accelerator-stage founders (YC, Techstars, etc.)** — go from idea to investor demo same-day.
4. **Educators & bootcamps** — zero-install means a classroom of 30 students starts coding in 60 seconds.
5. **Enterprise innovation teams** (Phase 3) — SSO-ready, SOC 2-ready, internal-tool factory.

## Status & Traction
- ✅ Live at **cyberpunk-termux-ide.lovable.app** + custom domain
- ✅ Full plan architecture (Free/Pro/Premium/BYOK) wired through DB → edge → UI
- ✅ 10 export targets shipping
- ✅ Native build CI pipeline (Windows / macOS / Linux) configured
- 🔜 Stripe activation (Phase 1 — 3 weeks)
- 🔜 Signed native binaries (Phase 2 — 6 weeks)
- 🔜 SAML SSO + SOC 2 Type I (Phase 3 — 10 weeks)

## Why Now
AI codegen quality crossed the runnable-app threshold in 2025 (gpt-5.2, gemini-3-pro). Browser PWAs reached desktop-app parity. Developers expect zero-install. The window to define the **post-VS-Code AI IDE** is open — and the incumbents are bolted-on, not built-in.

---

**Live:** https://cyberpunk-termux-ide.lovable.app
**Built on:** Lovable Cloud + Lovable AI Gateway
**Contact:** [maintainer email]
