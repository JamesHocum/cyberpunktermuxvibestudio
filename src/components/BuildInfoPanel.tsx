import React, { useState } from 'react';
import { 
  Monitor, Apple, Terminal, Copy, ExternalLink, Download,
  Github, Box, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface BuildCommand {
  label: string;
  command: string;
  description: string;
}

const BUILD_COMMANDS: BuildCommand[] = [
  { label: 'Install Dependencies', command: 'npm install', description: 'Install all required packages' },
  { label: 'Build Web Assets', command: 'npm run build', description: 'Compile Vite frontend for Electron' },
  { label: 'Windows Installer', command: 'npx electron-builder --win nsis', description: 'Creates NSIS installer (.exe)' },
  { label: 'Windows Portable', command: 'npx electron-builder --win portable', description: 'Creates portable executable' },
  { label: 'macOS DMG', command: 'npx electron-builder --mac', description: 'Creates macOS disk image' },
  { label: 'Linux AppImage', command: 'npx electron-builder --linux', description: 'Creates Linux AppImage' },
];

const OUTPUT_FILES = [
  { platform: 'Windows', file: 'Cyberpunk Termux Studio-{version}-win-x64.exe', type: 'Installer' },
  { platform: 'Windows', file: 'Cyberpunk Termux Studio-{version}-win-x64-portable.exe', type: 'Portable' },
  { platform: 'macOS', file: 'Cyberpunk Termux Studio-{version}-mac-x64.dmg', type: 'DMG' },
  { platform: 'Linux', file: 'Cyberpunk Termux Studio-{version}-linux-x64.AppImage', type: 'AppImage' },
];

interface BuildInfoPanelProps {
  onDownload?: () => void;
  githubUrl?: string;
}

export const BuildInfoPanel = ({ onDownload, githubUrl }: BuildInfoPanelProps) => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    toast.success('Command copied to clipboard');
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Box className="h-12 w-12 mx-auto neon-purple" />
          <h2 className="font-cyber text-lg neon-purple">ELECTRON_BUILDER.SYS</h2>
          <p className="text-sm text-muted-foreground font-terminal">
            Build desktop applications for Windows, macOS, and Linux
          </p>
        </div>

        <Separator className="bg-primary/20" />

        {/* Important Notice */}
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs font-terminal text-yellow-400">
            ⚠️ <strong>Note:</strong> Electron builds must be run locally or via GitHub Actions. 
            Clone the repository and run commands in your terminal.
          </p>
        </div>

        {/* GitHub Releases Download */}
        {githubUrl && (
          <>
            <div className="space-y-3">
              <h3 className="font-cyber text-sm neon-green flex items-center gap-2">
                <Download className="h-4 w-4" />
                DOWNLOAD PACKAGED BUILDS
              </h3>
              <div className="p-3 rounded-lg cyber-border bg-studio-terminal">
                <p className="text-xs font-terminal matrix-text mb-3">
                  Pre-built installers and portable executables are available from GitHub Releases.
                </p>
                <div className="space-y-2 mb-3">
                  {OUTPUT_FILES.map((output, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {output.platform === 'Windows' && <Monitor className="h-3 w-3 text-blue-400" />}
                      {output.platform === 'macOS' && <Apple className="h-3 w-3 text-gray-400" />}
                      {output.platform === 'Linux' && <Terminal className="h-3 w-3 text-orange-400" />}
                      <span className="font-terminal matrix-text">{output.type}</span>
                      <Badge variant="outline" className="text-[9px]">{output.platform}</Badge>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full neon-green"
                  onClick={() => window.open(`${githubUrl}/releases`, '_blank')}
                >
                  <Github className="h-4 w-4 mr-2" />
                  Download from GitHub Releases
                </Button>
              </div>
            </div>
            <Separator className="bg-primary/20" />
          </>
        )}

        {/* Build Commands */}
        <div className="space-y-3">
          <h3 className="font-cyber text-sm neon-green flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            BUILD COMMANDS
          </h3>
          <div className="space-y-2">
            {BUILD_COMMANDS.map((cmd) => (
              <div key={cmd.command} className="p-2 rounded-lg cyber-border bg-studio-terminal group hover:bg-primary/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-terminal neon-green">{cmd.label}</p>
                    <code className="text-[11px] text-muted-foreground">{cmd.command}</code>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyCommand(cmd.command)}>
                    {copiedCommand === cmd.command ? <CheckCircle2 className="h-3 w-3 neon-green" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{cmd.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-primary/20" />

        {/* Output Files */}
        <div className="space-y-3">
          <h3 className="font-cyber text-sm neon-purple flex items-center gap-2">
            <Download className="h-4 w-4" />
            OUTPUT FILES
          </h3>
          <div className="space-y-2">
            {OUTPUT_FILES.map((output, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg cyber-border bg-studio-terminal">
                <div className="flex items-center gap-2">
                  {output.platform === 'Windows' && <Monitor className="h-4 w-4 text-blue-400" />}
                  {output.platform === 'macOS' && <Apple className="h-4 w-4 text-gray-400" />}
                  {output.platform === 'Linux' && <Terminal className="h-4 w-4 text-orange-400" />}
                  <span className="text-xs font-terminal matrix-text">{output.file}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{output.type}</Badge>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground font-terminal">
            Output directory: <code className="neon-green">release/</code>
          </p>
        </div>

        <Separator className="bg-primary/20" />

        {/* GitHub Actions */}
        <div className="space-y-3">
          <h3 className="font-cyber text-sm neon-green flex items-center gap-2">
            <Github className="h-4 w-4" />
            AUTOMATED BUILDS
          </h3>
          <div className="p-3 rounded-lg cyber-border bg-studio-terminal">
            <p className="text-xs font-terminal matrix-text mb-2">
              This project includes a GitHub Actions workflow that automatically builds 
              for all platforms when you push a version tag.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <code className="px-2 py-1 rounded bg-primary/10 font-terminal neon-green">git tag v1.0.0</code>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <code className="px-2 py-1 rounded bg-primary/10 font-terminal neon-green">git push origin v1.0.0</code>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-terminal">
              Builds will appear in GitHub Releases after workflow completes.
            </p>
          </div>
        </div>

        <Separator className="bg-primary/20" />

        {/* Configuration Reference */}
        <div className="space-y-3">
          <h3 className="font-cyber text-sm neon-purple flex items-center gap-2">
            ⚙️ CONFIGURATION
          </h3>
          <div className="p-3 rounded-lg cyber-border bg-studio-terminal">
            <p className="text-[10px] text-muted-foreground font-terminal mb-2">electron-builder.config.js</p>
            <pre className="text-[10px] font-terminal matrix-text overflow-x-auto">
{`{
  appId: 'app.lovable.cyberpunk-termux',
  productName: 'Cyberpunk Termux Studio',
  directories: { output: 'release' },
  win: {
    target: ['nsis', 'portable']
  }
}`}
            </pre>
          </div>
        </div>

        {/* Download Project Files */}
        {onDownload && (
          <div className="space-y-3">
            <h3 className="font-cyber text-sm neon-green flex items-center gap-2">
              <Download className="h-4 w-4" />
              RETRIEVE PROJECT FILES
            </h3>
            <div className="p-3 rounded-lg cyber-border bg-studio-terminal">
              <p className="text-xs font-terminal matrix-text mb-3">
                Download your project files as a ZIP archive to build the Electron app locally.
              </p>
              <Button variant="outline" className="w-full neon-green" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Project Files (.zip)
              </Button>
            </div>
          </div>
        )}

        <Separator className="bg-primary/20" />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 neon-green text-xs" onClick={() => window.open('https://www.electron.build/', '_blank')}>
            <ExternalLink className="h-3 w-3 mr-1" />
            Docs
          </Button>
          <Button
            variant="outline"
            className="flex-1 neon-purple text-xs"
            onClick={() => {
              const allCommands = BUILD_COMMANDS.map(c => c.command).join('\n');
              navigator.clipboard.writeText(allCommands);
              toast.success('All commands copied');
            }}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy All
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};
