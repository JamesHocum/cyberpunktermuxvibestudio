import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Smartphone, Download, Monitor, ExternalLink, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  fileContents: Record<string, string>;
  onShowDownloader?: () => void;
}

export const PublishDialog = ({
  open,
  onOpenChange,
  projectName,
  fileContents,
  onShowDownloader,
}: PublishDialogProps) => {
  const [generating, setGenerating] = useState<string | null>(null);

  const handlePWADownload = async () => {
    setGenerating("pwa");
    try {
      const zip = new JSZip();
      // Add all project files
      Object.entries(fileContents).forEach(([path, content]) => {
        zip.file(path, content);
      });
      // Add PWA manifest
      zip.file("public/manifest.json", JSON.stringify({
        name: projectName,
        short_name: projectName,
        start_url: "/",
        display: "standalone",
        background_color: "#0d1117",
        theme_color: "#00ff88",
        icons: [
          { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
        ]
      }, null, 2));
      // Add service worker
      zip.file("public/sw.js", `const CACHE = 'pwa-v1';
const ASSETS = ['/'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));`);
      // Add README
      zip.file("README.md", `# ${projectName} (PWA)\n\nProgressive Web App ready for deployment.\n\n## Deploy\n\n1. \`npm install\`\n2. \`npm run build\`\n3. Deploy the \`dist/\` folder to any static host (Vercel, Netlify, etc.)\n`);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}-pwa.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PWA package downloaded!");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to generate PWA package");
    } finally {
      setGenerating(null);
    }
  };

  const handleWindowsPackage = async () => {
    setGenerating("windows");
    try {
      const zip = new JSZip();
      Object.entries(fileContents).forEach(([path, content]) => {
        zip.file(`src/${path}`, content);
      });
      // Add Electron main
      zip.file("electron/main.cjs", `const { app, BrowserWindow } = require('electron');
const path = require('path');
function createWindow() {
  const win = new BrowserWindow({ width: 1280, height: 800, webPreferences: { nodeIntegration: false, contextIsolation: true } });
  win.loadFile(path.join(__dirname, '../dist/index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });`);
      // Add package.json with build scripts
      zip.file("package.json", JSON.stringify({
        name: projectName.toLowerCase().replace(/\s+/g, "-"),
        version: "1.0.0",
        main: "electron/main.cjs",
        scripts: {
          dev: "vite",
          build: "vite build",
          "package:win": "vite build && electron-builder --win --config electron-builder.config.js"
        },
        devDependencies: {
          electron: "^28.0.0",
          "electron-builder": "^24.9.1",
          vite: "^5.0.0"
        }
      }, null, 2));
      // Add electron-builder config
      zip.file("electron-builder.config.js", `module.exports = {
  appId: 'com.${projectName.toLowerCase().replace(/\s+/g, "")}.app',
  productName: '${projectName}',
  directories: { output: 'release', buildResources: 'build' },
  files: ['dist/**/*', 'electron/**/*', 'package.json'],
  win: { target: ['nsis', 'portable'], artifactName: '\${productName}-\${version}-Setup.\${ext}' },
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true, createDesktopShortcut: true }
};`);
      zip.file("README.md", `# ${projectName} — Windows Installer Package\n\n## Build the .exe installer\n\n1. \`npm install\`\n2. \`npm run package:win\`\n3. Find your installer in the \`release/\` folder\n\nRequires Node.js 18+ and Windows (or Wine on Linux/macOS).\n`);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}-windows-package.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Windows package downloaded! Run `npm run package:win` to build the .exe");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to generate Windows package");
    } finally {
      setGenerating(null);
    }
  };

  const options = [
    {
      id: "pwa",
      icon: <Smartphone className="h-6 w-6" />,
      title: "PWA Package",
      desc: "Download as Progressive Web App with manifest & service worker",
      action: handlePWADownload,
      badge: "OFFLINE READY",
    },
    {
      id: "web",
      icon: <Globe className="h-6 w-6" />,
      title: "Web Deploy",
      desc: "Deploy to Vercel or Netlify (connect GitHub first)",
      action: () => {
        window.open("https://vercel.com/new", "_blank");
        toast.info("Push your code to GitHub, then import the repo on Vercel");
      },
      badge: "CLOUD",
    },
    {
      id: "zip",
      icon: <Download className="h-6 w-6" />,
      title: "ZIP Download",
      desc: "Download all project files as a ZIP archive",
      action: () => {
        onOpenChange(false);
        onShowDownloader?.();
      },
      badge: "LOCAL",
    },
    {
      id: "windows",
      icon: <Monitor className="h-6 w-6" />,
      title: "Windows .exe Package",
      desc: "Download with Electron config — run npm run package:win locally",
      action: handleWindowsPackage,
      badge: "DESKTOP",
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
        <div className="grid grid-cols-1 gap-3 mt-2">
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
