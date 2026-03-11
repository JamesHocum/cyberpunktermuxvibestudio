

# Cyberpunk Termux Codex — Full Feature Rundown

## What It Is
**Cyberpunk Termux Codex** is a zero-install, AI-native development environment that treats the AI as the build toolchain. Available as a web PWA, Electron desktop app (Windows/Mac/Linux), and mobile app (Android/iOS), it enables full deployment from idea to executable within the browser.

---

## Core Philosophy: Different from Traditional IDEs

| Traditional IDE | Cyberpunk Termux Codex |
|-----------------|------------------------|
| Local installation required | Zero-install web-first (PWA) |
| AI as optional plugin | AI as the **build toolchain** |
| Terminal commands for builds | AI generates production-ready artifacts |
| Local compilation | Cloud generation + local packaging |
| Generic themes | Cyberpunk/hacker/noir aesthetic |

---

## Feature Categories

### 1. AI-NATIVE DEVELOPMENT (Lady Violet's Codex)

**Lady Violet Agentic AI**
- Powered by OpenAI GPT-5.2 (ChatGPT 5.4-class) via unified integration
- Persona-driven architecture (Pantheon Protocol)
- **Build Mode**: Autonomous coding copilot triggered by keywords ("build", "scaffold", "export as")
- Auto-applies all generated code blocks with one-click "Apply All"
- Per-message apply history with undo system
- Multimodal analysis (screenshots, mockups)
- GitHub repo cloning via natural language

**Large Prompt Handling**
- Auto-expanding textarea (44px to 200px)
- Collapsible chat history for messages >2000 characters
- Full-screen "Paste Large Prompt" overlay for architecture docs
- Auto-chunking for prompts >50,000 characters
- Sequential context package delivery

---

### 2. UNIVERSAL DEPLOYMENT SYSTEM

**10 Export Targets** (via Publish Dialog)
1. **PWA Package** — Progressive Web App with manifest & service worker
2. **Web Deploy** — Direct to Vercel/Netlify
3. **ZIP Download** — Raw source archive
4. **Windows .exe** — Electron scaffold
5. **Linux AppImage** — Electron scaffold
6. **macOS DMG** — Electron scaffold
7. **Android APK** — Capacitor scaffold
8. **iOS IPA** — Capacitor scaffold (requires Mac/Xcode locally)
9. **Chrome Extension** — Manifest V3 with popup, content scripts, background worker
10. **IDE Extension** — Custom extension scaffold for the IDE itself

**Completed Builds Tracking**
- `project_exports` database table tracks all builds
- Re-download any previous build on-demand
- No storage of large binary blobs — regenerated from current project state

---

### 3. PRODUCTIVITY TIMERS ("Thought For" / "Worked For")

Unique to this IDE — tracks real development metrics:

| Timer | Purpose | Behavior |
|-------|---------|----------|
| **Thought For** | Brainstorming/ideation time | Runs continuously while tab is visible |
| **Worked For** | Active implementation time | Runs only during activity (typing, prompts, saves, builds) |
| | | Pauses after 75 seconds of inactivity |

**Session vs Lifetime Metrics**
- Hover tooltip shows breakdown: Session Thought/Worked + Lifetime totals
- Per-project persistence via localStorage
- Activity detection across editor, chat, terminal, file operations
- Cross-project switching maintains independent timer states

---

### 4. EXTENSION ECOSYSTEM

**28 Flagship Extensions** (registry in `public/extensions.json`)

**Developer Tools:**
- Git Lens (inline blame, commit history)
- Regex Lab (interactive regex builder)
- API Request Builder (Postman alternative)
- JSON Tree Visualizer
- File Diff Viewer
- Snippet Manager
- TODO/FIXME Scanner
- Code Statistics
- Dependency Graph
- Port Scanner Widget
- Base64 & Encoding Toolkit

**Cyberpunk Aesthetic Mods:**
- CRT Monitor Filter (scanlines, phosphor glow)
- Ambient Soundscapes (rain, synth drones)
- Hacker Typer Mode
- Terminal Themes
- ASCII Art Generator
- CSS Glitch Generator
- Neon Code Minimap
- Matrix Terminal Clock
- Rain Intensity Slider

**IDE Extensibility:**
- Browser Extension Scaffold generator
- IDE Extension Creator (for building extensions that extend the IDE itself)

---

### 5. THEME SYSTEM (8 Cyberpunk Variants)

| Theme | Description |
|-------|-------------|
| **Matrix** | Classic neon green on black |
| **Cyber** | Electric blue on dark |
| **Vaporwave** | Hot pink/purple on dark purple |
| **Noir** | Grayscale minimal |
| **Hacker Green** | Pure terminal green |
| **Synthwave** | Purple/pink/yellow on dark purple |
| **Blood Moon** | Red/orange on dark |
| **Ghost in Shell** | Cyan/teal on dark blue |

All themes include Monaco Editor syntax highlighting + UI chrome styling.

---

### 6. FULLSTACK STACK PROFILES

**Project Creation Wizard** with stack selection:

1. **Supabase Fullstack** — Database + RLS, Auth + SSO, Edge Functions, Auto-wire All
2. **SQLite (Self-hosted)** — Local DB, JWT Auth, Offline-first, Self-hosted
3. **Frontend Only** — Static site, no backend, client-side only

**Auto-Wiring Features**
- When enabled, AI automatically generates:
  - DB schema, API routes, auth hooks/middleware
  - Environment config
  - For Supabase: edge functions, RLS policies, client usage
  - For SQLite: drizzle config, local schema

---

### 7. IDE LAYOUT & WORKSPACE

**Resizable Multi-Pane Layout**
- Monaco Editor (code editing)
- Live Preview (file rendering)
- AI Chat Panel (Lady Violet)
- Terminal (multi-shell with AI commands)
- All panes resizable via drag handles

**File Management**
- Project-scoped file tree
- Recent files tracking (Alt+1 through Alt+9 shortcuts)
- Auto-detect entry file on project load
- Create/delete files and folders

**Command Palette**
- Global shortcuts for all panels
- Quick file navigation
- Recent file access

---

### 8. TERMINAL WITH AI INTEGRATION

**Multi-Shell Support**
- Create/close multiple terminal instances
- Tab-based switching

**Built-in AI Commands**
- `ai code <description>` — Generate code
- `ai refactor <file>` — Refactor code
- `ai explain <file>` — Explain functionality
- `ai debug <error>` — Debug issues
- `ai complete <context>` — Complete snippet

**Standard Commands**
- `ls`, `cat`, `clear`
- `npm` commands
- `git` commands (integrated with GitHub via edge functions)

---

### 9. CODEBASE ANALYZER

**Quick Scan** (instant, local)
- README presence check
- Test file detection
- TypeScript configuration
- LICENSE file check
- Package.json validation
- .env.example recommendation
- File count by type

**Deep Analysis** (AI-powered)
- Calls `analyze-project` edge function
- Quality score (0-100)
- Findings and suggestions
- Actionable fixes

---

### 10. GIT INTEGRATION

**GitHub OAuth**
- Connect GitHub account
- Repo selector for linking projects
- Automatic commit/push via `git-sync` edge function

**Git Panel Features**
- Commit with message
- Branch switching
- Sync status indicators
- Recent commits list
- File status (modified/staged)

---

### 11. PUBLISHING & DEPLOYMENT METADATA

**Export Tracking**
- Every export recorded in `project_exports` table
- Metadata: project_id, export_type, file_count, timestamp
- Re-download capability from Projects dashboard

---

## Technical Architecture

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- Monaco Editor (VS Code's editor)
- TanStack Query for data fetching

**Backend**
- Supabase (database, auth, edge functions)
- Lovable AI Gateway for AI completions
- Rate limiting per user
- Row Level Security (RLS) policies

**Edge Functions** (14 total)
- `codex-chat` — Main AI chat proxy
- `codex-agent` — Code generation agent
- `analyze-project` — AI-powered codebase analysis
- `git-sync` — GitHub commit/push
- `github-clone` — Repository cloning
- `lady-violet-chat` — Fallback chat
- `elevenlabs-tts` — Voice synthesis
- `huggingface-inference` — Model inference
- `save-api-key`, `save-hf-token` — Token storage
- `assign-role`, `get-users` — Admin functions
- `submit-extension` — Extension registry
- `project-watcher` — File watching

---

## What Makes It Special

1. **AI as Build Toolchain** — Not just autocomplete; the AI generates complete deployable artifacts
2. **Universal Deployment** — 10 export targets from a single codebase
3. **Productivity Metrics** — Thought/Worked timers for workflow analysis
4. **Zero-Install Philosophy** — Full IDE in browser, works offline as PWA
5. **Cyberpunk Aesthetic** — Consistent thematic experience across all UI
6. **Self-Extending** — Can build extensions that extend the IDE itself
7. **Auto-Wiring Fullstack** — AI knows your stack and generates appropriate backend code automatically
8. **Completed Builds Dashboard** — Track and re-download any previous build

---

## Competitive Differentiation

| vs CodePen/JSFiddle | Full project management, AI assistant, multi-target exports |
| vs GitHub Codespaces | Zero cloud compute costs, runs in browser, AI-native |
| vs VS Code | No installation, AI-powered builds, cyberpunk aesthetic |
| vs Cursor/Windsurf | Web-first, timer metrics, extension ecosystem, theme variety |

