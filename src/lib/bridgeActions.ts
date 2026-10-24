// Routes a bridged inbox item into the correct IDE subsystem.
// Items can carry a `metadata.kind` of "patch" | "command" | "context"
// plus an optional `metadata.pipeline` ("build" | "preview" | "test" | "debug").
import { supabase } from '@/integrations/supabase/client';
import { createSnapshot } from './snapshotEngine';

export type BridgePipeline = 'build' | 'preview' | 'test' | 'debug';
export type BridgeKind = 'patch' | 'command' | 'context';

export interface BridgeFilePatch {
  path: string;
  content: string;
  file_type?: string;
}

export interface BridgeMetadata {
  kind?: BridgeKind;
  files?: BridgeFilePatch[];
  command?: string;
  pipeline?: BridgePipeline;
  [k: string]: unknown;
}

/** Apply a set of file patches to a project, taking a pre-apply snapshot for undo. */
export async function applyPatch(opts: {
  projectId: string;
  files: BridgeFilePatch[];
  label?: string;
}): Promise<{ written: number }> {
  if (!opts.files?.length) return { written: 0 };
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await createSnapshot({
    projectId: opts.projectId,
    reason: 'pre-restore',
    label: opts.label || 'Pre-bridge-apply',
  });

  // Confirmed UNIQUE(project_id, path): one statement is atomic for the whole patch.
  const { data, error } = await supabase.from('project_files').upsert(
    opts.files.map((f) => ({
      project_id: opts.projectId,
      user_id: userId,
      path: f.path,
      content: f.content,
      file_type: f.file_type ?? guessFileType(f.path),
      is_folder: false,
    })),
    { onConflict: 'project_id,path' },
  ).select('path');
  if (error) throw error;
  if (data?.length !== opts.files.length) throw new Error('Patch write could not be confirmed');

  return { written: data.length };
}

function guessFileType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'code';
  if (['md', 'mdx'].includes(ext)) return 'markdown';
  if (['json', 'yml', 'yaml', 'toml'].includes(ext)) return 'config';
  if (['css', 'scss'].includes(ext)) return 'style';
  return 'text';
}

/**
 * Trigger a named IDE pipeline. The IDE layout listens for these
 * `cyberpunk:pipeline` events and dispatches to its existing handlers.
 */
export function triggerPipeline(pipeline: BridgePipeline, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('cyberpunk:pipeline', { detail: { pipeline, payload } }),
  );
}

/** Broadcast a captured terminal command for the IDE Terminal to consume. */
export function broadcastCommand(command: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('cyberpunk:terminal-command', { detail: { command } }),
  );
}
