import { useCallback, useEffect, useState } from "react";
import {
  createSnapshot,
  deleteSnapshot,
  listSnapshots,
  restoreSnapshot,
  Snapshot,
  SnapshotReason,
} from "@/lib/snapshotEngine";
import { toast } from "sonner";

export function useWorkspaceSnapshots(projectId?: string) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setSnapshots([]);
      return;
    }
    setLoading(true);
    try {
      setSnapshots(await listSnapshots(projectId));
    } catch (e: any) {
      console.error("[snapshots] list failed", e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (reason: SnapshotReason = "manual", label?: string) => {
      if (!projectId) return null;
      setBusy("create");
      try {
        const snap = await createSnapshot({ projectId, reason, label });
        toast.success(`Snapshot saved (${snap.file_count} files)`);
        await refresh();
        return snap;
      } catch (e: any) {
        toast.error(`Snapshot failed: ${e.message}`);
        return null;
      } finally {
        setBusy(null);
      }
    },
    [projectId, refresh],
  );

  const restore = useCallback(
    async (id: string) => {
      if (!projectId) return;
      setBusy(id);
      try {
        await restoreSnapshot(id, projectId);
        toast.success("Snapshot restored — reload to see all changes");
        await refresh();
      } catch (e: any) {
        toast.error(`Restore failed: ${e.message}`);
      } finally {
        setBusy(null);
      }
    },
    [projectId, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      setBusy(id);
      try {
        await deleteSnapshot(id);
        await refresh();
      } catch (e: any) {
        toast.error(`Delete failed: ${e.message}`);
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  return { snapshots, loading, busy, refresh, create, restore, remove };
}
