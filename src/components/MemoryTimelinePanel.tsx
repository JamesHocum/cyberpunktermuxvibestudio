import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, RefreshCw, RotateCcw, Trash2, Monitor } from 'lucide-react';
import { useAgentMemory, MemorySnapshot } from '@/hooks/useAgentMemory';
import { toast } from 'sonner';

interface MemoryTimelinePanelProps {
  projectId: string | null;
  onRestore?: (snap: MemorySnapshot) => void;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString();
};

export const MemoryTimelinePanel: React.FC<MemoryTimelinePanelProps> = ({
  projectId,
  onRestore,
}) => {
  const { snapshots, loading, refresh, restoreSnapshot, deleteSnapshot } =
    useAgentMemory(projectId);

  return (
    <div className="flex flex-col h-full bg-studio-terminal/40">
      <div className="flex items-center justify-between p-3 border-b border-matrix-green/20">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 neon-green" />
          <h3 className="text-sm font-semibold text-matrix-green tracking-wide">
            MEMORY TIMELINE
          </h3>
          {snapshots.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-matrix-green/20 text-matrix-green">
              {snapshots.length}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-matrix-green hover:bg-matrix-green/10"
          onClick={() => refresh()}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        {snapshots.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground font-mono space-y-2">
            <Brain className="h-8 w-8 mx-auto opacity-30" />
            <p>No memory snapshots yet.</p>
            <p className="opacity-60">
              Your Codex conversations auto-save here every 30s so you can resume
              from any device.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {snapshots.map((s) => (
              <div
                key={s.id}
                className="cyber-border bg-background/40 rounded p-3 text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Monitor className="h-3 w-3 text-violet-400 shrink-0" />
                    <span className="truncate text-violet-300">
                      {s.device_label || 'Unknown device'}
                    </span>
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {formatTime(s.created_at)}
                  </span>
                </div>
                <p className="text-foreground/80 line-clamp-2">{s.summary}</p>
                {s.model && (
                  <p className="text-[10px] text-matrix-green/70 font-mono">
                    {s.model}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-7 px-3 bg-matrix-green/20 hover:bg-matrix-green/30 text-matrix-green border border-matrix-green/40 text-xs"
                    disabled={!onRestore}
                    onClick={async () => {
                      try {
                        const full = await restoreSnapshot(s.id);
                        if (!full || !onRestore) throw new Error('Conversation could not be restored');
                        onRestore(full);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Restore failed');
                      }
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteSnapshot(s.id).catch((error) => toast.error(error?.message || 'Delete failed'))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MemoryTimelinePanel;
