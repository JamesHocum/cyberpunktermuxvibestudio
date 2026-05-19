# Cyberpunk Termux Codex IDE

> **A zero-install, AI-native, browser-first IDE.** Generate complete runnable apps, preview them live, refactor with an agentic copilot, and export to 10 targets — PWA, web, Windows, macOS, Linux, Android, iOS, Chrome Extension, IDE Extension, or ZIP.

[![Live Demo](https://img.shields.io/badge/demo-cyberpunk--termux--ide.lovable.app-39ff14)](https://cyberpunk-termux-ide.lovable.app)
[![Built with Lovable Cloud](https://img.shields.io/badge/backend-Lovable_Cloud-9d4edd)](https://lovable.dev)

---

## Table of Contents
1. [What It Is](#what-it-is)
2. [Why It's Different](#why-its-different)
3. [Architecture](#architecture)
4. [Installation](#installation)
5. [Using the IDE](#using-the-ide)
   - [Generate Mode](#generate-mode)
   - [Refactor Mode](#refactor-mode)
   - [Other Action Modes](#other-action-modes)
6. [The Complete Runnable Build Contract](#the-complete-runnable-build-contract)
7. [Export Targets](#export-targets)
8. [Plans & AI Access](#plans--ai-access)
9. [Configuration](#configuration)
10. [Contributing Extensions](#contributing-extensions)
11. [License](#license)

---

## What It Is

Cyberpunk Termux Codex IDE is a PWA-first development studio that treats AI as the build toolchain — not a plugin. You describe what you want, the IDE produces a **complete, wired, runnable app**, and a live in-browser preview boots it instantly. Ship the same build to desktop, mobile, browser extension, or the web.

**Live URLs**
- Preview: https://id-preview--7634a365-1393-4f41-9212-27f505acceca.lovable.app
- Published: https://cyberpunk-termux-ide.lovable.app
- Custom domain: https://cyberpunk-termux.spell-weaver-studio.com

## Why It's Different

| Other AI IDEs | Cyberpunk Termux Codex |
|---|---|
| Hand you code snippets | Hands you a **running app** |
| Local install required | **Zero install** — PWA in any browser |
| One AI model, one tier | **4 tiers** (Free / Pro / Premium / BYOK), 8+ models |
| Export = "good luck" | **10 signed-ready export targets** wired into the UI |
| Chat = sidebar afterthought | Chat = **agentic build-finisher** with undo system |
| Generic VS Code clone aesthetic | **Cyberpunk identity** — neon green, deep purple, real brand |

---

## Architecture

```text
┌────────────────────────────────────────────────────────────────┐
│  Frontend (React 18 + Vite 5 + Tailwind v3 + TypeScript 5)     │
│  ┌──────────────┬──────────────┬───────────────┬────────────┐  │
│  │ Studio Layout│ AI Chat Panel│  Live Preview │ Matrix Tools│ │
│  │ (sidebar,    │ (Generate /  │  (Sandpack +  │ (Git, voice,│ │
│  │  editor,     │  Refactor /  │   Source View │  extensions,│ │
│  │  terminal)   │  Debug etc.) │   fallback)   │  analyzer)  │ │
│  └──────────────┴──────────────┴───────────────┴────────────┘  │
│                Monaco Editor • PWA (sw.js + manifest)          │
└──────────────────────────────┬─────────────────────────────────┘
                               │ supabase-js
┌──────────────────────────────▼─────────────────────────────────┐
│           Lovable Cloud (Supabase-powered backend)             │
│  ┌────────────┬───────────────┬──────────────┬──────────────┐ │
│  │  Postgres  │ Auth (email + │   Storage    │  Realtime    │ │
│  │  + RLS     │  Google OAuth)│  (projects,  │  (chat,      │ │
│  │            │               │   voices)    │   git sync)  │ │
│  └────────────┴───────────────┴──────────────┴──────────────┘ │
│                                                                 │
│  Edge Functions (Deno):                                         │
│   • codex-chat / codex-agent  — tiered AI routing + BYOK       │
│   • lady-violet-chat          — agentic copilot (gpt-5.2)      │
│   • git-sync / github-clone   — real Git ops via GitHub OAuth  │
│   • elevenlabs-* (clone / tts / conversation-token)            │
│   • analyze-project, project-watcher, submit-extension, …      │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
              Lovable AI Gateway → 8+ models
              (gpt-5.2 / gpt-5 / gemini-3-pro / gemini-2.5-flash …)
              + optional per-user BYOK overrides
```

**Key tables:** `projects`, `project_files`, `chat_messages`, `user_plans`, `user_api_keys`, `user_roles`, `project_exports`, `extensions`, `audit_logs`.

**Security model:** All tables use Row-Level Security. Roles live in a dedicated `user_roles` table behind a `has_role()` SECURITY DEFINER function (never on profiles). JWT verification on every edge function.

---

## Installation

### Option A — Use it instantly (recommended)
Just open https://cyberpunk-termux-ide.lovable.app — sign in, start building. There is nothing to install.

### Option B — Install as a PWA
1. Open the live URL in Chrome / Edge / Safari.
2. Click the install prompt (or **⋮ → Install App**).
3. Launches offline-capable, in its own window, with desktop icon.

### Option C — Run the source locally
Prerequisites: **Node 18+**, **npm** (or **bun**).

```bash
git clone <your-fork-url>
cd cyberpunk-termux
npm install
npm run dev          # http://localhost:5173
```

`.env` is auto-managed by Lovable Cloud. If running detached, supply:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
VITE_DEV_AUTH_BYPASS=true   # optional, local-only auth skip
```

### Option D — Build native desktop apps
```bash
npm run build
npm run package:win     # Windows NSIS + portable
npm run package:mac     # macOS DMG (requires macOS host)
npm run package:linux   # AppImage / deb / rpm
```
Tag a release (`git tag v1.0.0 && git push --tags`) and the GitHub Actions workflow (`.github/workflows/build-electron.yml`) builds all three platforms automatically.

---

## Using the IDE

### Generate Mode
The flagship loop. Click the **Generate** chip in the action bar, then describe the app you want.

**Example prompts that produce runnable builds:**
- *"Build a Pomodoro timer with sound, sessions log, and dark mode toggle."*
- *"Create a markdown notes app with folders, search, and localStorage persistence."*
- *"Scaffold a landing page for a privacy-first email service with hero, features, pricing, and FAQ."*

**What you get back:**
- All files created (entry, routing, components, hooks, styles)
- Imports resolved end-to-end
- `package.json` dependencies declared
- Visible, working UI with seed content
- Live preview boots automatically

You will **never** see "you need to install X," TODO placeholders, or pseudo-code. See [the build contract](#the-complete-runnable-build-contract) below.

### Refactor Mode
Select files (or a range), switch the action bar to **Refactor**, describe the change.

**Examples:**
- *"Extract the form logic into a custom hook and add zod validation."*
- *"Add keyboard shortcuts and ARIA labels throughout."*
- *"Convert this class component to a functional component with hooks."*

Refactor is held to the **same completeness contract** as Generate — it returns a wired, runnable diff, not fragments.

### Other Action Modes
| Mode | Purpose |
|---|---|
| **Chat** | General Q&A, planning, explanations |
| **Debug** | Paste an error or describe a bug; copilot proposes a verified fix |
| **Explain** | Step-by-step walkthrough of selected code |
| **Test** | Generate unit tests (Vitest) for selected code |

All modes respect your active plan (Free / Pro / Premium / BYOK) and gracefully degrade with lock icons on premium-only features.

---

## The Complete Runnable Build Contract

Every Generate or Refactor response must satisfy these rules before the copilot is allowed to finish:

1. **All required files exist** — entry, routing, components, hooks, styles.
2. **Entry points are wired** — `main.tsx` mounts `App.tsx`, routes resolve.
3. **Imports are resolved** — no missing modules, no dead references.
4. **Dependencies are declared** — `package.json` updated, no manual installs implied.
5. **Preview must boot** — Sandpack renders a visible, interactive UI.
6. **No placeholder comments** — no `// TODO: implement this`, no pseudo-code.
7. **No "you need to install X"** — the copilot does it or doesn't claim it.
8. **Desktop/native scaffolding included** — Electron/Capacitor configs in the first pass if requested.

If any rule fails, the copilot continues building rather than stopping. This is enforced in the system prompts of `codex-agent`, `codex-chat`, and `lady-violet-chat` edge functions.

---

## Export Targets

Click **Publish / Export** to ship the current project to any of:

| Target | What you get |
|---|---|
| **PWA** | ZIP with manifest + service worker, offline-ready |
| **Web Deploy** | Vercel / Netlify import link (push to GitHub first) |
| **ZIP** | Raw project files, ready to commit anywhere |
| **Windows .exe** | Electron NSIS installer + portable build config |
| **macOS DMG** | Electron DMG config (build on macOS host) |
| **Linux AppImage** | AppImage + deb + rpm configs |
| **Android APK** | Capacitor scaffold + Android Studio project |
| **iOS IPA** | Capacitor scaffold (requires macOS + Xcode) |
| **Chrome Extension** | Manifest V3 with popup, content, background worker |
| **IDE Extension** | Scaffold a Cyberpunk Termux extension (loads in sandbox iframe) |

Every export is logged to `project_exports` for audit and analytics.

---

## Plans & AI Access

| Plan | Models | Quotas | Premium features |
|---|---|---|---|
| **Free** | Flash models only (gemini-2.5-flash-lite, gpt-5-nano) | Daily token cap | Locked |
| **Pro** | + gemini-2.5-flash, gpt-5-mini, gpt-5 | Higher cap | Voice playback |
| **Premium** | + gpt-5.2, gemini-2.5-pro, gemini-3-pro | Highest cap | Lady Violet agentic mode, Live Voice, Build Mode |
| **BYOK** | Any model you have a key for | Your provider's quota | Bring OpenAI / Anthropic / Gemini keys |

BYOK keys live in `user_api_keys` (encrypted at rest, RLS-scoped). Switch active plan in **Settings → Plan**.

---

## Configuration

| File | Purpose |
|---|---|
| `pantheon.config.ts` | Personas, integrations, feature flags |
| `electron-builder.config.js` | Native desktop build targets |
| `capacitor.config.ts` | iOS / Android shell |
| `public/manifest.json` | PWA install metadata |
| `public/sw.js` | Versioned service worker |
| `public/extensions.json` | Community extension registry |
| `supabase/config.toml` | Edge function configuration |
| `tailwind.config.ts` + `src/index.css` | Cyberpunk design tokens (HSL only) |

---

## Contributing Extensions

The IDE has a sandboxed extension system. To submit one:

1. Export an **IDE Extension** package from the publish dialog (it scaffolds metadata + entry point).
2. Implement your extension in the generated `index.html` / `extension.js`.
3. Submit via **Settings → Extensions → Submit** (routes through the `submit-extension` edge function and lands in `extensions.json` after admin review).

Extensions run in iframe sandboxes with a controlled message bridge — no access to host DOM, host network, or other extensions.

---

## License

Proprietary — © Cyberpunk Termux. Built on [Lovable Cloud](https://lovable.dev).
For licensing or enterprise inquiries: contact the maintainer.
