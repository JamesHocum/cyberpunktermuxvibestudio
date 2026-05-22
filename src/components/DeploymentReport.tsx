import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";

export interface DeploymentReportData {
  ok: boolean;
  url?: string;
  framework: string;
  method: string;
  warnings?: string[];
  nextSteps?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data?: DeploymentReportData;
}

export const DeploymentReport = ({ open, onOpenChange, data }: Props) => {
  if (!data) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--studio-terminal))] border-[hsl(var(--neon-green)/0.3)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-cyber">
            {data.ok ? (
              <CheckCircle2 className="h-5 w-5 text-neon-green" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            )}
            {data.ok ? "Published Successfully" : "Publish Completed with Warnings"}
          </DialogTitle>
          <DialogDescription className="font-terminal text-xs">
            Deployment summary and recommended next steps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {data.url && (
            <div className="rounded border border-neon-green/30 bg-neon-green/5 p-3">
              <div className="text-[10px] text-muted-foreground font-terminal">URL</div>
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="text-neon-green text-sm break-all hover:underline flex items-center gap-1"
              >
                {data.url} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-border/40 p-2">
              <div className="text-[10px] text-muted-foreground font-terminal">Framework</div>
              <div className="text-sm">{data.framework}</div>
            </div>
            <div className="rounded border border-border/40 p-2">
              <div className="text-[10px] text-muted-foreground font-terminal">Method</div>
              <div className="text-sm">{data.method}</div>
            </div>
          </div>

          {data.warnings && data.warnings.length > 0 && (
            <div className="rounded border border-yellow-400/40 bg-yellow-400/5 p-3">
              <div className="text-xs font-bold text-yellow-400 mb-1">Warnings</div>
              <ul className="list-disc list-inside text-xs space-y-1">
                {data.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded border border-neon-purple/30 bg-neon-purple/5 p-3">
            <div className="text-xs font-bold text-neon-purple mb-1">Next Steps</div>
            <ul className="list-disc list-inside text-xs space-y-1">
              {(data.nextSteps && data.nextSteps.length > 0
                ? data.nextSteps
                : ["Connect a custom domain", "Enable Stripe for payments", "Configure analytics"]
              ).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <Button onClick={() => onOpenChange(false)} className="neon-green">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
