

# Fix: "Failed to Create New Project" - Missing user_id in Database Operations

## Root Cause

In `src/hooks/useProject.ts`, the `createProject` function (line 199) inserts a row into the `projects` table without including `user_id`:

```
.insert({ name, description })  // missing user_id!
```

The RLS policy on `projects` requires `user_id = auth.uid()` for INSERT. Without `user_id`, the insert is rejected. The same issue affects `file_tree` inserts and `saveProject` upserts that are also missing `user_id`.

Compare with `src/lib/projectManager.ts` which correctly includes `user_id: user.id` (line 28).

## Fix

Modify `src/hooks/useProject.ts` to fetch the current user and include `user_id` in all database operations:

### 1. `createProject` function (line 194-230)
- Get `auth.uid()` before inserting
- Add `user_id` to the `projects` insert
- Add `user_id` to the `file_tree` insert

### 2. `saveProject` function (line 148-191)
- Get `auth.uid()` before upserting
- Add `user_id` to `file_tree` upsert
- Add `user_id` to `project_files` upsert

### File to Modify

| File | Changes |
|------|---------|
| `src/hooks/useProject.ts` | Add `user_id` from `auth.getUser()` to `createProject`, `saveProject`, and `file_tree`/`project_files` upserts |

### Technical Detail

In `createProject`:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');

const { data: project, error } = await supabase
  .from('projects')
  .insert({ name, description, user_id: user.id })  // add user_id
  .select()
  .single();

await supabase.from('file_tree').insert({
  project_id: project.id,
  tree_structure: DEFAULT_PROJECT as any,
  user_id: user.id  // add user_id
});
```

In `saveProject`:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');

// file_tree upsert needs user_id
await supabase.from('file_tree').upsert({
  project_id: currentProject.id,
  tree_structure: fileTree as any,
  user_id: user.id
});

// project_files upsert needs user_id
await supabase.from('project_files').upsert({
  project_id: currentProject.id,
  path, content, file_type: extension,
  is_folder: false,
  user_id: user.id
});
```

This is the exact same pattern already used in `src/lib/projectManager.ts` (lines 23-28), which works correctly.
