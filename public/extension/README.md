# Cyberpunk Termux Bridge — Browser Extension (v0.1)

Phase 1 of the **Browser Extension Interoperability Layer**.

The bridge lets you push selections, prompts, and page context from any AI chat
(ChatGPT, Claude, Gemini) — or any web page — directly into the Cyberpunk
Termux IDE so the conversation continues where the build happens.

## Install (unpacked)

1. Download this folder or the packaged `.zip` from the IDE's Docs page.
2. Open `chrome://extensions` (works in Chrome, Edge, Brave, Arc, Opera).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped folder.

## Configure

1. Open the extension popup.
2. Endpoint defaults to the published IDE. Override if you self-host.
3. Paste your access token from **IDE → Settings → Bridge Token** (a Supabase
   session token — never your password).

## Use

- Highlight text on any AI chat page → a floating **⚡ Send to Cyberpunk
  Termux** button appears → one click drops it into the IDE inbox.
- Or right-click anywhere → **⚡ Send to Cyberpunk Termux**.
- Or open the popup, paste a custom prompt + selection, hit Send.

Drops appear in the IDE chat panel as **Bridge Inbox** items. Open one to load
its prompt + selection straight into the composer.

## Design principles

- **User-owned context.** Nothing leaves your browser unless you click Send.
- **Explicit consent.** No background scraping, no telemetry.
- **Authenticated.** Every drop is scoped to your Supabase user via RLS.
- **Minimal surface.** Manifest V3, no remote code, no external dependencies.

## Roadmap (Phase 2+)

- OAuth handshake instead of pasted tokens
- Two-way sync: IDE → extension for "Continue this in ChatGPT"
- Per-tab session memory snapshots
- Auto-detect ChatGPT/Claude message boundaries for clean conversation imports
- One-click "Apply to repo" from drop
