import { supabase } from "@/integrations/supabase/client";

export type SnapshotReason = "manual" | "pre-build" | "pre-restore" | "auto-daily";

export interface SnapshotFiles {
  [path: string]: { content: string; file_type: string };
}

export interface Snapshot {
  id: string;
  project_id: string;
  user_id: string;
  label: string | null;
  reason: SnapshotReason;
  file_count: number;
  size_bytes: number;
  files: SnapshotFiles;
  created_at: string;
}

const MAX_AUTO_SNAPSHOTS = 20;

async function readProjectFiles(projectId: string, userId: string): Promise<SnapshotFiles> {
  const { data, error } = await supabase
    .from("project_files")
    .select("path, content, file_type, is_folder")
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw error;
  const map: SnapshotFiles = {};
  for (const row of data || []) {
    if (row.is_folder) continue;
    map[row.path] = { content: row.content ?? "", file_type: row.file_type ?? "text" };
  }
  return map;
}

function byteSize(files: SnapshotFiles): number {
  let n = 0;
  for (const p of Object.keys(files)) n += (files[p].content || "").length;
  return n;
}

export async function createSnapshot(opts: {
  projectId: string;
  reason: SnapshotReason;
  label?: string;
}): Promise<Snapshot> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const files = await readProjectFiles(opts.projectId, userId);
  const file_count = Object.keys(files).length;
  const size_bytes = byteSize(files);

  const { data, error } = await supabase
    .from("workspace_snapshots")
    .insert({
      project_id: opts.projectId,
      user_id: userId,
      label: opts.label ?? null,
      reason: opts.reason,
      file_count,
      size_bytes,
      files: files as any,
    })
    .select("*")
    .single();
  if (error) throw error;

  // prune: keep last MAX_AUTO_SNAPSHOTS non-manual snapshots
  pruneSnapshots(opts.projectId).catch(() => {});

  return data as unknown as Snapshot;
}

export async function listSnapshots(projectId: string): Promise<Snapshot[]> {
  const { data, error } = await supabase
    .from("workspace_snapshots")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Snapshot[];
}

export async function deleteSnapshot(id: string): Promise<void> {
  const { error } = await supabase.from("workspace_snapshots").delete().eq("id", id);
  if (error) throw error;
}

export async function restoreSnapshot(snapshotId: string, projectId: string): Promise<void> {
  // Take a pre-restore snapshot first
  await createSnapshot({ projectId, reason: "pre-restore", label: "Before restore" });

  const { data: snap, error: snapErr } = await supabase
    .from("workspace_snapshots")
    .select("files")
    .eq("id", snapshotId)
    .single();
  if (snapErr || !snap) throw snapErr ?? new Error("Snapshot not found");

  const files = (snap as any).files as SnapshotFiles;
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Not authenticated");

  // Wipe current files for this project (non-folder rows only)
  await supabase.from("project_files").delete().eq("project_id", projectId).eq("is_folder", false);

  // Re-insert
  const rows = Object.entries(files).map(([path, v]) => ({
    project_id: projectId,
    user_id: userId,
    path,
    content: v.content,
    file_type: v.file_type,
    is_folder: false,
  }));
  if (rows.length) {
    // Insert in chunks of 200
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from("project_files").insert(rows.slice(i, i + 200));
      if (error) throw error;
    }
  }
}

async function pruneSnapshots(projectId: string): Promise<void> {
  const { data } = await supabase
    .from("workspace_snapshots")
    .select("id, reason, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (!data) return;
  const auto = data.filter((s) => s.reason !== "manual");
  if (auto.length <= MAX_AUTO_SNAPSHOTS) return;
  const toDelete = auto.slice(MAX_AUTO_SNAPSHOTS).map((s) => s.id);
  if (toDelete.length) {
    await supabase.from("workspace_snapshots").delete().in("id", toDelete);
  }
}
