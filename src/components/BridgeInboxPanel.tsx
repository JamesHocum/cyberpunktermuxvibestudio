import { useEffect, useState } from "react";
import { useExtensionInbox, BridgeInboxItem } from "@/hooks/useExtensionInbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Inbox,
  ExternalLink,
  Zap,
  X,
  RefreshCw,
  FileCode,
  Play,
  Bug,
  Eye,
  TerminalSquare,
  GitMerge,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyPatch,
  triggerPipeline,
  broadcastCommand,
  BridgeMetadata,
} from "@/lib/bridgeActions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BridgeInboxPanelProps {
  onLoadIntoChat?: (text: string) => void;
  projectId?: string | null;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
};

const composeText = (item: BridgeInboxItem) => {
  const parts: string[] = [];
  if (item.prompt) parts.push(item.prompt);
  if (item.selection) {
    parts.push(
      `\n\n[Captured from ${item.page_title || item.origin_url || "browser"}]\n\`\`\`\n${item.selection}\n\`\`\``,
    );
  }
  return parts.join("").trim();
};

const pipelineIcon = (p: string) => {
  if (p === "preview") return <Eye className="h-3 w-3 mr-1" />;
  if (p === "test") return <TerminalSquare className="h-3 w-3 mr-1" />;
  if (p === "debug") return <Bug className="h-3 w-3 mr-1" />;
  return <Play className="h-3 w-3 mr-1" />;
};

export const BridgeInboxPanel: React.FC<BridgeInboxPanelProps> = ({
  onLoadIntoChat,
  projectId,
}) => {
  const { items, loading, refresh, consume } = useExtensionInbox();
  const { user } = useAuth();
  const [threads, setThreads] = useState<Record<string, BridgeInboxItem[]>>({});

  // Fetch outbound siblings (IDE responses) for any item with replies.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id || items.length === 0) return;
      const parentIds = items.map((i) => i.id);
      const { data } = await supabase
        .from("extension_context")
        .select("*")
        .eq("user_id", user.id)
        .in("parent_id", parentIds);
      if (cancelled || !data) return;
      const grouped: Record<string, BridgeInboxItem[]> = {};
      for (const row of data as BridgeInboxItem[]) {
        if (!row.parent_id) continue;
        (grouped[row.parent_id] ||= []).push(row);
      }
      setThreads(grouped);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, items]);

  const handleApply = async (item: BridgeInboxItem) => {
    const meta = (item.metadata || {}) as BridgeMetadata;
    if (!projectId) {
      toast.error("Open a project first");
      return;
    }
    if (!meta.files?.length) {
      toast.error("This item has no file patch attached");
      return;
    }
    try {
      const res = await applyPatch({ projectId, files: meta.files });
      toast.success(`Applied ${res.written} file${res.written === 1 ? "" : "s"}`);
      await consume(item.id);
    } catch (e: any) {
      toast.error(e?.message || "Apply failed");
    }
  };

  const handleRun = (item: BridgeInboxItem) => {
    const meta = (item.metadata || {}) as BridgeMetadata;
    if (meta.command) {
      broadcastCommand(meta.command);
      toast.success("Command queued in terminal");
      return;
    }
    if (meta.pipeline) {
      triggerPipeline(meta.pipeline, { source: "bridge", itemId: item.id });
      toast.success(`Triggered ${meta.pipeline}`);
      return;
    }
    toast.message("No command or pipeline on this item");
  };

  return (
    <div className="flex flex-col h-full bg-studio-terminal/40">
      <div className="flex items-center justify-between p-3 border-b border-matrix-green/20">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 neon-green" />
          <h3 className="text-sm font-semibold text-matrix-green tracking-wide">
            BRIDGE INBOX
          </h3>
          {items.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-matrix-green/20 text-matrix-green">
              {items.length}
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
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        {items.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground font-mono space-y-2">
            <Zap className="h-8 w-8 mx-auto opacity-30" />
            <p>No bridged context yet.</p>
            <p className="opacity-60">
              Install the browser extension and send selections from ChatGPT,
              Claude, or any web page directly here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const meta = (item.metadata || {}) as BridgeMetadata;
              const hasPatch = !!meta.files?.length;
              const hasRunnable = !!meta.command || !!meta.pipeline;
              const replies = threads[item.id] || [];
              return (
                <div
                  key={item.id}
                  className="cyber-border bg-background/40 rounded p-3 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ExternalLink className="h-3 w-3 text-violet-400 shrink-0" />
                      <span
                        className="truncate text-violet-300"
                        title={item.origin_url || ""}
                      >
                        {item.page_title || item.origin_url || item.source}
                      </span>
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {formatTime(item.created_at)}
                    </span>
                  </div>

                  {item.prompt && (
                    <p className="text-foreground/90 line-clamp-2 italic">
                      {item.prompt}
                    </p>
                  )}
                  {item.selection && (
                    <pre className="bg-black/40 rounded p-2 overflow-hidden max-h-24 text-[10px] text-matrix-green/80 whitespace-pre-wrap line-clamp-5">
                      {item.selection.slice(0, 400)}
                      {item.selection.length > 400 ? "…" : ""}
                    </pre>
                  )}

                  {replies.length > 0 && (
                    <div className="border-l-2 border-matrix-green/40 pl-2 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-matrix-green/80">
                        <GitMerge className="h-3 w-3" /> IDE response
                      </div>
                      {replies.map((r) => (
                        <pre
                          key={r.id}
                          className="bg-black/40 rounded p-2 max-h-32 overflow-hidden text-[10px] text-foreground/80 whitespace-pre-wrap"
                        >
                          {(r.response || "").slice(0, 600)}
                          {(r.response || "").length > 600 ? "…" : ""}
                        </pre>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button
                      size="sm"
                      className="h-7 px-2 bg-matrix-green/20 hover:bg-matrix-green/30 text-matrix-green border border-matrix-green/40 text-[11px]"
                      onClick={() => {
                        const text = composeText(item);
                        if (text && onLoadIntoChat) onLoadIntoChat(text);
                        consume(item.id);
                        toast.success("Loaded into chat");
                      }}
                    >
                      <Zap className="h-3 w-3 mr-1" /> Chat
                    </Button>
                    {hasPatch && (
                      <Button
                        size="sm"
                        className="h-7 px-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 text-[11px]"
                        onClick={() => handleApply(item)}
                      >
                        <FileCode className="h-3 w-3 mr-1" /> Apply
                        {meta.files ? ` (${meta.files.length})` : ""}
                      </Button>
                    )}
                    {hasRunnable && (
                      <Button
                        size="sm"
                        className="h-7 px-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px]"
                        onClick={() => handleRun(item)}
                      >
                        {pipelineIcon(String(meta.pipeline || "run"))}
                        {meta.pipeline ? meta.pipeline : "Run"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-muted-foreground hover:text-destructive ml-auto"
                      onClick={() => consume(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default BridgeInboxPanel;
