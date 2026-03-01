import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Globe, Smartphone, Download, Monitor, ExternalLink, Loader2, Terminal as TerminalIcon, Laptop } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  generatePWAPackage, generateWindowsPackage, generateLinuxPackage,
  generateMacPackage, downloadBlob,
} from "@/lib/exportGenerators";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  fileContents: Record<string, string>;
  onShowDownloader?: () => void;
  projectId?: string;
}

export const PublishDialog = ({
  open, onOpenChange, projectName, fileContents, onShowDownloader, projectId,
}: PublishDialogProps) => {
  const [generating, setGenerating] = useState<string | null>(null);

  const recordExport = async (exportType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !projectId) return;
      await supabase.from("project_exports").insert({
        project_id: projectId,
        user_id: user.id,
        export_type: exportType,
        project_name: projectName,
        file_count: Object.keys(fileContents).length,
      });
    } catch { /* silent */ }
  };

  const handle = async (id: string, gen: () => Promise<Blob>, filename: string, msg: string) => {
    setGenerating(id);
    try {
      const blob = await gen();
      downloadBlob(blob, filename);
      toast.success(msg);
      await recordExport(id);
      onOpenChange(false);
    } catch { toast.error("Failed to generate package"); }
    finally { setGenerating(null); }
  };

  const options = [
    {
      id: "pwa", icon: <Smartphone className="h-6 w-6" />, title: "PWA Package",
      desc: "Download as Progressive Web App with manifest & service worker",
      action: () => handle("pwa", () => generatePWAPackage(projectName, fileContents), `${projectName}-pwa.zip`, "PWA package downloaded!"),
      badge: "OFFLINE READY",
    },
    {
      id: "web", icon: <Globe className="h-6 w-6" />, title: "Web Deploy",
      desc: "Deploy to Vercel or Netlify (connect GitHub first)",
      action: () => { window.open("https://vercel.com/new", "_blank"); toast.info("Push code to GitHub, then import on Vercel"); },
      badge: "CLOUD",
    },
    {
      id: "zip", icon: <Download className="h-6 w-6" />, title: "ZIP Download",
      desc: "Download all project files as a ZIP archive",
      action: () => { onOpenChange(false); onShowDownloader?.(); },
      badge: "LOCAL",
    },
    {
      id: "windows", icon: <Monitor className="h-6 w-6" />, title: "Windows .exe",
      desc: "Electron config — run npm run package:win locally",
      action: () => handle("windows", () => generateWindowsPackage(projectName, fileContents), `${projectName}-windows.zip`, "Windows package downloaded!"),
      badge: "DESKTOP",
    },
    {
      id: "linux", icon: <TerminalIcon className="h-6 w-6" />, title: "Linux AppImage",
      desc: "Electron config — run npm run package:linux locally",
      action: () => handle("linux", () => generateLinuxPackage(projectName, fileContents), `${projectName}-linux.zip`, "Linux package downloaded!"),
      badge: "LINUX",
    },
    {
      id: "mac", icon: <Laptop className="h-6 w-6" />, title: "macOS DMG",
      desc: "Electron config — run npm run package:mac locally",
      action: () => handle("mac", () => generateMacPackage(projectName, fileContents), `${projectName}-macos.zip`, "macOS package downloaded!"),
      badge: "MACOS",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[hsl(var(--studio-terminal))] border-[hsl(var(--neon-green)/0.3)]">
        <DialogHeader>
          <DialogTitle className="text-primary font-cyber">Publish / Export</DialogTitle>
          <DialogDescription className="font-terminal text-xs">
            Choose a deployment target for <span className="text-primary">{projectName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={opt.action}
              disabled={generating === opt.id}
              className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-card/40 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-60"
            >
              <div className="text-primary group-hover:scale-110 transition-transform mt-0.5">
                {generating === opt.id ? <Loader2 className="h-6 w-6 animate-spin" /> : opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{opt.title}</span>
                  <Badge variant="secondary" className="text-[10px] font-terminal">{opt.badge}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
