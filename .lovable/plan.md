

# Quick Fix: TypeScript Type Error in AIChatPanel

## The Problem

Line 195-199 in `src/components/AIChatPanel.tsx` has a type casting issue:

```typescript
await supabase.from('chat_messages').insert({
  user_id: user.id,
  project_id: currentProjectId || null,
  role: message.role,
  content: message.content,
  attachments: (message.attachments || []) as unknown as Record<string, unknown>[]  // ❌ Wrong cast
});
```

The `attachments` field expects `Json | null` (from Supabase types), but we're casting to `Record<string, unknown>[]` which doesn't match.

## The Fix

**File: `src/components/AIChatPanel.tsx`** - Line 199

Change the type cast from:
```typescript
attachments: (message.attachments || []) as unknown as Record<string, unknown>[]
```

To:
```typescript
attachments: message.attachments ? JSON.parse(JSON.stringify(message.attachments)) : null
```

Or simpler using the Json type:
```typescript
attachments: (message.attachments || null) as Json
```

## Changes Summary

| File | Line | Change |
|------|------|--------|
| `src/components/AIChatPanel.tsx` | 199 | Fix type cast for attachments to use `Json` type |

This is a one-line fix that will resolve the build error.

