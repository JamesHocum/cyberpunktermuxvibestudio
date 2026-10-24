import { beforeEach, expect, mock, test } from 'bun:test';

const calls: string[] = [];
let writeError: Error | null = null;
let snapshotError: Error | null = null;
let readback: { path: string }[] = [];
let rows: unknown;
let conflict: unknown;
mock.module('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } }, error: null }) },
    from: (table: string) => ({
      upsert: (value: unknown, options: unknown) => {
        calls.push(`upsert:${table}`);
        rows = value;
        conflict = options;
        return { select: async () => ({ data: readback, error: writeError }) };
      },
      delete: () => { throw new Error('Destructive delete must never be used'); },
    }),
  },
}));
mock.module('./snapshotEngine', () => ({
  createSnapshot: async () => {
    calls.push('snapshot');
    if (snapshotError) throw snapshotError;
  },
}));
const { applyPatch } = await import('./bridgeActions');
beforeEach(() => {
  calls.length = 0;
  writeError = null;
  snapshotError = null;
  readback = [{ path: 'a.ts' }, { path: 'b.ts' }];
});
const patch = { projectId: 'project', files: [
  { path: 'a.ts', content: 'export const a = 1;' },
  { path: 'b.ts', content: 'export const b = 2;' },
] };
test('writes all patch files in one atomic upsert after the safety snapshot', async () => {
  expect(await applyPatch(patch)).toEqual({ written: 2 });
  expect(calls).toEqual(['snapshot', 'upsert:project_files']);
  expect(conflict).toEqual({ onConflict: 'project_id,path' });
  expect(rows).toEqual(patch.files.map(file => ({ ...file, project_id: 'project', user_id: 'owner', file_type: 'code', is_folder: false })));
});
test('database write failure cannot return success', async () => {
  writeError = new Error('Denied');
  await expect(applyPatch(patch)).rejects.toThrow('Denied');
});
test('failed safety snapshot prevents any file write', async () => {
  snapshotError = new Error('Snapshot failed');
  await expect(applyPatch(patch)).rejects.toThrow('Snapshot failed');
  expect(calls).toEqual(['snapshot']);
});
test('unconfirmed write count cannot return success', async () => {
  readback = [];
  await expect(applyPatch(patch)).rejects.toThrow('Patch write could not be confirmed');
});