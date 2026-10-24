# Reliability conventions

- Apply bridge file patches with one upsert on the confirmed `(project_id, path)` unique constraint; this preserves existing rows and makes the patch statement atomic.
- Keep conversation snapshots in the existing memory table, with project/user-scoped reads and restores; flush queued saves on normal navigation but never promise browser-unload persistence.
- Guard asynchronous project/history loads against stale completions so changing workspaces cannot mix state.