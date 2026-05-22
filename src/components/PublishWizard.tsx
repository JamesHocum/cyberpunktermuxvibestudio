import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Settings2, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { detectProjectType } from "@/lib/detectProjectType";
import { PublishDialog } from "./PublishDialog";
import { DeploymentReport, DeploymentReportData } from "./DeploymentReport";
import {
  generatePWAPackage,
  generateWindowsPackage,
  generateLinuxPackage,
  generateMacPackage,
  generateAndroidPackage,
  generateIOSPackage,
  downloadBlob,
} from "@/lib/exportGenerators";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectName: string;
  fileContents: Record<string, string>;
  projectId?: string;
  onShowDownloader?: () => void;
}

const TARGET_GEN: Record<string, (name: string, files: Record<string, string>) => Promise<Blob>> = {
  pwa: generatePWAPackage,
  windows: generateWindowsPackage,
  linux: generateLinuxPackage,
  mac: generateMacPackage,
  android: generateAndroidPackage,
  ios: generateIOSPackage,
};

export const PublishWizard = ({ open, onOpenChange, projectName, fileContents, projectId, onShowDownloader }: Props) => {
  const detection = useMemo(() => detectProjectType(fileContents), [fileContents]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<DeploymentReportData | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const runRecommended = async () => {
    setRunning(true);
    try {
      const target = detection.recommendedTarget;
      const gen = TARGET_GEN[target];
      let warnings: string[] = [];

      if (gen) {
        const blob = await gen(projectName, fileContents);
        downloadBlob(blob, `${projectName}-${target}.zip`);
      } else if (target === "web") {
        window.open("https://vercel.com/new", "_blank");
        warnings.push("Vercel deploy opens in a new tab — push to GitHub first.");
      } else if (target === "zip") {
        onShowDownloader?.();
      }

      // Record export
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && projectId) {
          await supabase.from("project_exports").insert({
            project_id: projectId,
            user_id: user.id,
            export_type: `${target}:wizard`,
            project_name: projectName,
            file_count: Object.keys(fileContents).length,
          });
        }
      } catch { /* silent */ }

      toast.success("Publish complete");
      setReport({
        ok: true,
        framework: detection.label,
        method: `Standard Publish — ${detection.recommendedTargetLabel}`,
        warnings,
        nextSteps: ["Connect a custom domain", "Enable Stripe checkout", "Wire analytics (Plausible / GA4)"],
      });
      setReportOpen(true);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(`Publish failed: ${e.message}`);
      setReport({
        ok: false,
        framework: detection.label,
        method: `Standard Publish — ${detection.recommendedTargetLabel}`,
        warnings: [e.message],
        nextSteps: ["Try Advanced Options to pick a different target"],
      });
      setReportOpen(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-[hsl(var(--studio-terminal))] border-[hsl(var(--neon-green)/0.3)]">
          <DialogHeader>
            <DialogTitle className="font-cyber neon-green flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Smart Publish
            </DialogTitle>
            <DialogDescription className="font-terminal text-xs">
              We detected your project and picked the fastest deploy path.
            </DialogDescription>
          </DialogHeader>

          {/* Step 1 — Detection */}
          <div className="rounded border border-neon-purple/40 bg-neon-purple/5 p-3">
            <div className="text-[10px] font-terminal text-muted-foreground">DETECTED</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold neon-purple">{detection.label}</span>
              <Badge variant="outline" className="text-[10px]">{detection.type}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{detection.reason}</p>
          </div>

          {/* Step 2 — Recommendation */}
          <div className="rounded border border-neon-green/40 bg-neon-green/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-terminal text-muted-foreground">RECOMMENDED</div>
                <div className="text-base font-bold neon-green flex items-center gap-2">
                  <Zap className="h-4 w-4" /> {detection.recommendedTargetLabel}
                </div>
                <div className="text-[10px] text-muted-foreground font-terminal">ETA ~{detection.etaSeconds}s</div>
              </div>
              <Button onClick={runRecommended} disabled={running} className="bg-neon-green text-black hover:bg-neon-green/80">
                {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Publish Now
              </Button>
            </div>
          </div>

          {/* Step 3 — Advanced */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs neon-purple">
                <Settings2 className="h-3 w-3 mr-2" /> Advanced Options ({advancedOpen ? "hide" : "show"})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded border border-border/40 p-2">
                <PublishDialog
                  open={true}
                  onOpenChange={() => { /* embedded — controlled by wizard */ }}
                  projectName={projectName}
                  fileContents={fileContents}
                  projectId={projectId}
                  onShowDownloader={onShowDownloader}
                  embedded
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </DialogContent>
      </Dialog>

      <DeploymentReport open={reportOpen} onOpenChange={setReportOpen} data={report ?? undefined} />
    </>
  );
};
