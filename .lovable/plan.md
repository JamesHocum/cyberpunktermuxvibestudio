

# Fix Editor Loading & Preview Errors for Cloned Projects

## Problems Identified

1. **"Loading neural interface..." stuck in editor**: Monaco Editor's loading placeholder is showing indefinitely. This happens because the Monaco Editor component from `@monaco-editor/react` needs to download the Monaco library from a CDN. If the network is slow or the CDN is blocked (common in Electron or restricted environments), it stays stuck on the loading state forever.

2. **Sandpack "Couldn't connect to server"**: The Live Preview automatically switches to Sandpack mode for `.tsx`/`.jsx` files, but Sandpack can't run Next.js code (which uses `next/navigation`, `next/link`, server components, etc.) since its `react-ts` template only supports vanilla React.

## Solution

### 1. Add timeout + fallback for Monaco loading
- Show the "Loading neural interface..." message for up to 10 seconds
- After that, show a helpful message with a retry button instead of an infinite spinner
- This prevents users from thinking the editor is broken

### 2. Fix Sandpack for non-React projects
- Detect when a project is a Next.js, Vue, or Svelte project (by checking if files like `next.config.*`, `app/layout.tsx`, `nuxt.config.*` exist in the file tree)
- For non-standard-React projects, fall back to **iframe mode** (static code display) instead of Sandpack, since Sandpack can't run these frameworks
- Show a clear badge/message like "Static Preview (Next.js projects require a dev server)" instead of a confusing error

### 3. Add a "Source View" fallback in LivePreview
- When Sandpack fails or the project isn't compatible, render the code with syntax highlighting in an iframe instead of showing an error
- This gives users something useful to see rather than "Couldn't connect to server"

## Technical Details

### File: `src/components/MonacoEditor.tsx`
- Add a `loadingTimeout` state that triggers after 10 seconds
- Replace the loading placeholder with a component that shows a retry button after timeout
- Add an `onError` style fallback using a simple `<textarea>` if Monaco completely fails

### File: `src/components/LivePreview.tsx`
- Update the `useEffect` that sets `previewMode` to check the project context
- Add detection logic: if file paths contain `app/layout.tsx`, `next.config.*`, or `pages/_app.tsx`, mark as Next.js project
- For Next.js/non-React projects, force `previewMode = "iframe"` and render a styled source code view
- Show an informational badge: "Source View -- framework projects need a local dev server for full preview"

### File: `src/components/StudioLayout.tsx`
- Pass the full `fileContents` keys (file paths) to `LivePreview` as a new `projectFiles` prop so it can detect the project type

## What Users Will See After Fix
- **Editor**: Loads normally, or shows a retry/fallback after 10 seconds instead of spinning forever
- **Preview for React files**: Sandpack works as before
- **Preview for Next.js/framework files**: Shows a clean source code view with a message explaining that full preview requires a dev server, instead of a confusing "Couldn't connect" error
