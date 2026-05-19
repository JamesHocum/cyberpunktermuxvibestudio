# Cyberpunk Termux Codex IDE — Live Demo Script
**Runtime:** 5–10 minutes  •  **Audience:** Investors, accelerators, dev-tool buyers
**Goal:** Show a complete loop — Generate → Preview → Export — in under 10 minutes.

---

## 0:00–0:30 — The Hook (30s)
> "Most AI IDEs give you snippets. Ours gives you a **running app** — generated, previewed, and shipped to a real target in under five minutes. No installs, no setup. Watch."

- Open `https://cyberpunk-termux.spell-weaver-studio.com`
- Pause on the cyberpunk landing animation. One line:
  *"This is a zero-install, AI-native, browser-first IDE. It runs as a PWA, or ships as a signed desktop binary."*

## 0:30–1:15 — Sign In & Project Dashboard (45s)
- Sign in (email/password). Land on `/projects`.
- Point out:
  - **Project cards with live file-tree previews** (real files, not stock gradients).
  - **Stack Profiles** (React, Vue, Static, Node, etc.).
  - **Productivity timers** ("Thought For" / "Worked For") already tracking.
- Click **"+ New Project"** → pick **React + TS + Tailwind** profile → name it **`Neon Notes`**.

## 1:15–3:00 — Generate (the money shot, 1m45s)
- Open the **AI Chat Panel**. Confirm the model selector shows **gpt-5.2** (Lady Violet, default).
- Hit **Generate** mode on the action bar. Prompt:
  > *"Build a neon-themed sticky notes app. Add a board with draggable notes, color picker, local persistence, and a header with a 'Clear All' button. Make it feel cyberpunk."*
- While it streams, narrate the **Complete Runnable Build Contract**:
  - *"Every file is generated complete. Entry points wired. Dependencies declared. No 'you need to install X.' No placeholder comments."*
- When generation finishes, point to the file tree: `App.tsx`, `Board.tsx`, `Note.tsx`, `useNotes.ts`, `index.css` — all populated.

## 3:00–4:00 — Live Preview (60s)
- Switch to the **Preview pane**. Sandpack boots the app live in-browser.
- Drag a note. Change a color. Refresh — notes persist (localStorage).
- *"This is the same build that will ship. No 'export and pray.'"*
- Briefly toggle **Source View** to show the raw running bundle.

## 4:00–5:30 — Refactor (90s)
- Open `Note.tsx`. Switch action bar to **Refactor**.
- Prompt:
  > *"Add keyboard shortcuts: Cmd+N for new note, Cmd+Backspace to delete the focused note. Add ARIA labels for accessibility."*
- Refactor streams a clean diff. Accept.
- Test Cmd+N in preview — new note appears. *"Refactor is a build-finisher too — it doesn't hand you fragments."*

## 5:30–7:00 — Matrix Tools Tour (90s) *(optional — skip if tight on time)*
- Open the sidebar **Matrix Tools**:
  - **Git Panel** — real `git status`, commit, push via edge function.
  - **Codebase Analyzer** — instant project map.
  - **Voice Mode** — wave at the live WebRTC voice indicator.
  - **Extensions** — show the community extension marketplace.
- *"Every one of these is a real backend call, not a mock."*

## 7:00–8:30 — Export to a Target (90s)
- Click **Publish / Export** (top-right).
- Show the 10 targets: PWA, Web (Vercel/Netlify), ZIP, Windows .exe, Linux AppImage, macOS DMG, Android APK, iOS IPA, Chrome Extension, IDE Extension.
- Pick **PWA Package**. Download the ZIP. Unzip in a side terminal:
  ```
  unzip neon-notes-pwa.zip && cd neon-notes-pwa && python3 -m http.server 8080
  ```
- Open `localhost:8080` in a new tab — the app runs **offline-capable with a service worker and manifest**, installable as a PWA.

## 8:30–9:30 — The Close (60s)
- Back to the IDE. Show **Settings → Plan**:
  - Free / Pro / Premium / BYOK tiers.
  - Per-user API key overrides (`user_api_keys` table).
  - Usage gating UI (lock icons on Premium features for free users).
- *"Monetization rails are already wired. Stripe activation is a flip of a switch."*
- Recap in one breath:
  > *"Generate gave us a running app. Preview proved it. Refactor extended it. Export shipped it. Five minutes. Zero installs. That's the loop no other IDE delivers end-to-end."*

## 9:30–10:00 — Q&A Bridge (30s)
- *"Happy to drill into the build contract, the tiered AI architecture, the Electron packaging, or the extension SDK — what's most useful?"*

---

## Demo Safety Checklist (run 10 min before going live)
- [ ] Logged in on the demo account, **lady-violet/gpt-5.2** selected
- [ ] Test prompt warmed up once (avoid first-token latency)
- [ ] Network tab clean, no 402 quota errors
- [ ] Custom domain resolves, cert green
- [ ] Backup recording loaded in a second tab in case of live failure
- [ ] Volume on for voice mode demo (or skip)
