import { Camera, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceSnapshots } from "@/hooks/useWorkspaceSnapshots";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  projectId?: string;
}

const reasonColor = (r: string) =>
  r === "manual"
    ? "bg-neon-green/20 text-neon-green border-neon-green/40"
    : r === "pre-build"
      ? "bg-neon-purple/20 text-neon-purple border-neon-purple/40"
      : "bg-muted text-muted-foreground border-border";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export const SnapshotsPanel = ({ projectId }: Props) => {
  const { snapshots, loading, busy, create, restore, remove } = useWorkspaceSnapshots(projectId);

  if (!projectId) {
    return <div className="p-4 text-xs text-muted-foreground font-terminal">Open a project to use snapshots.</div>;
  }

  const handleManual = async () => {
    const label = prompt("Snapshot label (optional):") || undefined;
    await create("manual", label);
  };

  const handleRestore = async (id: string, label: string | null, created_at: string) => {
    if (!confirm(`Restore snapshot${label ? ` "${label}"` : ""} from ${new Date(created_at).toLocaleString()}? A pre-restore snapshot will be created automatically.`)) return;
    await restore(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border/40">
        <div className="flex items-center gap-2 font-cyber neon-green text-sm">
          <Camera className="h-4 w-4" /> SNAPSHOTS
        </div>
        <Button size="sm" variant="ghost" className="neon-green" onClick={handleManual} disabled={busy === "create"}>
          {busy === "create" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Camera className="h-3 w-3 mr-1" />}
          New
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {loading && <div className="text-xs text-muted-foreground p-2">Loading…</div>}
          {!loading && snapshots.length === 0 && (
            <div className="text-xs text-muted-foreground p-2 font-terminal">
              No snapshots yet. Snapshots are created automatically before each build, and you can save one manually any time.
            </div>
          )}
          {snapshots.map((s) => (
            <div
              key={s.id}
              className="rounded border border-border/50 bg-card/40 p-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${reasonColor(s.reason)}`}>{s.reason}</Badge>
                    <span className="text-xs font-bold truncate">{s.label || "Untitled"}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-terminal">
                    {new Date(s.created_at).toLocaleString()} · {s.file_count} files · {fmtBytes(s.size_bytes)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-neon-green hover:bg-neon-green/10"
                    onClick={() => handleRestore(s.id, s.label, s.created_at)}
                    disabled={busy === s.id}
                    title="Restore"
                  >
                    {busy === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => remove(s.id)}
                    disabled={busy === s.id}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
