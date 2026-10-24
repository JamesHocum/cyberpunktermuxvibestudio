# Cyberpunk Termux Bridge — Browser Extension (v0.2.0)

Authenticated browser-extension bridge with two-way context delivery.

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
2. Click **Link**, then sign in to the IDE tab and approve the displayed code.
3. Return to the popup to send context. Do not paste tokens or passwords.

The current link uses your existing, expiring IDE session, not an independently
scoped OAuth credential. Relink when it expires. Endpoints are fixed in the
extension source; the popup does not offer an endpoint override.

## Use

- Highlight text on ChatGPT, Claude, or Gemini → a floating **⚡ Send to Cyberpunk
  Termux** button appears → one click drops it into the IDE inbox.
- Or right-click anywhere → **⚡ Send to Cyberpunk Termux**.
- Or open the popup, paste a custom prompt + selection, hit Send.

Drops appear in the IDE sidebar's **Bridge Inbox**. File patches can be applied
to the selected project. Composer and pipeline integration remain dependent on
the host wiring; sending context does not automatically execute code.

## Design principles

- **User-owned context.** Nothing leaves your browser unless you click Send.
- **Explicit consent.** No background scraping, no telemetry.
- **Authenticated.** Every drop is scoped to your IDE user.
- **Minimal surface.** Manifest V3, no remote code, no external dependencies.

## Remaining integration work

- Scoped, independently revocable extension credentials
- Composer and execution-pipeline wiring
- Auto-detect ChatGPT/Claude message boundaries for clean conversation imports
