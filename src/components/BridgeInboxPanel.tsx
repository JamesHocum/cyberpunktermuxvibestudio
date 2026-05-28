import { useExtensionInbox, BridgeInboxItem } from "@/hooks/useExtensionInbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, ExternalLink, Zap, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BridgeInboxPanelProps {
  onLoadIntoChat?: (text: string) => void;
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

export const BridgeInboxPanel: React.FC<BridgeInboxPanelProps> = ({ onLoadIntoChat }) => {
  const { items, loading, refresh, consume } = useExtensionInbox();

  return (
    <div className="flex flex-col h-full bg-studio-terminal/40">
      <div className="flex items-center justify-between p-3 border-b border-matrix-green/20">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 neon-green" />
          <h3 className="text-sm font-semibold text-matrix-green tracking-wide">BRIDGE INBOX</h3>
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
              Install the Cyberpunk Termux browser extension and send selections from
              ChatGPT, Claude, or any web page directly here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="cyber-border bg-background/40 rounded p-3 text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ExternalLink className="h-3 w-3 text-violet-400 shrink-0" />
                    <span className="truncate text-violet-300" title={item.origin_url || ""}>
                      {item.page_title || item.origin_url || item.source}
                    </span>
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {formatTime(item.created_at)}
                  </span>
                </div>

                {item.prompt && (
                  <p className="text-foreground/90 line-clamp-2 italic">{item.prompt}</p>
                )}
                {item.selection && (
                  <pre className="bg-black/40 rounded p-2 overflow-hidden max-h-24 text-[10px] text-matrix-green/80 whitespace-pre-wrap line-clamp-5">
                    {item.selection.slice(0, 400)}
                    {item.selection.length > 400 ? "…" : ""}
                  </pre>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-7 px-3 bg-matrix-green/20 hover:bg-matrix-green/30 text-matrix-green border border-matrix-green/40 text-xs"
                    onClick={() => {
                      const text = composeText(item);
                      if (text && onLoadIntoChat) onLoadIntoChat(text);
                      consume(item.id);
                      toast.success("Loaded into chat");
                    }}
                  >
                    <Zap className="h-3 w-3 mr-1" /> Load into Chat
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => consume(item.id)}
                  >
                    <X className="h-3 w-3" />
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

export default BridgeInboxPanel;
