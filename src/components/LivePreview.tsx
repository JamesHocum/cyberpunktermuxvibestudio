import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertTriangle,
  Code2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Sandpack, SandpackProvider, SandpackPreview, SandpackThemeProvider } from "@codesandbox/sandpack-react";

interface LivePreviewProps {
  content: string;
  filename: string;
  cssContent?: string;
  onClose?: () => void;
  projectFiles?: string[];
}

type ViewportSize = "mobile" | "tablet" | "desktop" | "full";
type PreviewMode = "iframe" | "sandpack";

const viewportSizes: Record<ViewportSize, { width: string; height: string; label: string }> = {
  mobile: { width: "375px", height: "667px", label: "Mobile" },
  tablet: { width: "768px", height: "1024px", label: "Tablet" },
  desktop: { width: "1280px", height: "800px", label: "Desktop" },
  full: { width: "100%", height: "100%", label: "Full" },
};

// Custom cyberpunk theme for Sandpack
const cyberpunkTheme = {
  colors: {
    surface1: "#0d1117",
    surface2: "#1a1a2e",
    surface3: "#252539",
    clickable: "#00ff88",
    base: "#e6e6e6",
    disabled: "#4a5568",
    hover: "#b300ff",
    accent: "#00ff88",
    error: "#ff006e",
    errorSurface: "#1a0a1f",
  },
  syntax: {
    plain: "#e6e6e6",
    comment: { color: "#4a5568", fontStyle: "italic" as const },
    keyword: "#b300ff",
    tag: "#00d4ff",
    punctuation: "#4a5568",
    definition: "#00ff88",
    property: "#00d4ff",
    static: "#ffbe0b",
    string: "#ff006e",
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    size: "13px",
    lineHeight: "1.5",
  },
};

// Detect if project uses a non-standard-React framework
function detectFrameworkProject(files: string[]): string | null {
  const hasFile = (pattern: string) => files.some(f => f === pattern || f.endsWith('/' + pattern));
  const hasMatch = (re: RegExp) => files.some(f => re.test(f));

  if (hasFile('app/layout.tsx') || hasFile('app/layout.jsx') || hasFile('pages/_app.tsx') || hasFile('pages/_app.jsx') || hasMatch(/next\.config\./)) return 'Next.js';
  if (hasMatch(/nuxt\.config\./) || hasFile('app.vue')) return 'Nuxt/Vue';
  if (hasMatch(/svelte\.config\./) || hasFile('src/routes/+page.svelte')) return 'SvelteKit';
  if (hasFile('angular.json')) return 'Angular';
  return null;
}

export const LivePreview = ({ content, filename, cssContent = "", onClose, projectFiles = [] }: LivePreviewProps) => {
  const [viewport, setViewport] = useState<ViewportSize>("full");
  const [zoom, setZoom] = useState(100);
  const [isMaximized, setIsMaximized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [previewMode, setPreviewMode] = useState<PreviewMode>("iframe");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isHtmlFile = filename.endsWith(".html") || filename.endsWith(".htm");
  const isCssFile = filename.endsWith(".css");
  const isJsxFile = filename.endsWith(".tsx") || filename.endsWith(".jsx");
  const isJsonFile = filename.endsWith(".json");
  const isMarkdownFile = filename.endsWith(".md");

  const detectedFramework = detectFrameworkProject(projectFiles);

  // Switch to Sandpack mode for React files, but NOT for framework projects
  useEffect(() => {
    if (detectedFramework) {
      setPreviewMode("iframe");
    } else if (isJsxFile) {
      setPreviewMode("sandpack");
    } else {
      setPreviewMode("iframe");
    }
  }, [isJsxFile, detectedFramework]);

  const generatePreviewHtml = useCallback(() => {
    setError(null);

    // For HTML files, render directly
    if (isHtmlFile) {
      // Inject CSS if available
      const styleTag = cssContent ? `<style>${cssContent}</style>` : "";
      return content.includes("<head>")
        ? content.replace("</head>", `${styleTag}</head>`)
        : `<!DOCTYPE html><html><head>${styleTag}</head><body>${content}</body></html>`;
    }

    // For CSS files, show a demo
    if (isCssFile) {
      return `<!DOCTYPE html>
<html>
<head>
  <style>${content}</style>
</head>
<body style="background: #1a1a2e; padding: 20px; font-family: system-ui;">
  <div class="preview-container">
    <h1 style="color: #00ff88; margin-bottom: 20px;">CSS Preview</h1>
    <div class="container">
      <h2>Heading 2</h2>
      <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      <button>Button</button>
      <a href="#">Link</a>
    </div>
    <div style="margin-top: 20px; padding: 16px; border: 1px solid #333; border-radius: 8px;">
      <span>Sample elements to preview your CSS</span>
    </div>
  </div>
</body>
</html>`;
    }

    // For JSON files, pretty print
    if (isJsonFile) {
      try {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #0d1117;
      color: #00ff88;
      font-family: 'JetBrains Mono', monospace;
      padding: 20px;
      margin: 0;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
    }
    .key { color: #00d4ff; }
    .string { color: #ff006e; }
    .number { color: #ffbe0b; }
    .boolean { color: #8c00ff; }
    .null { color: #4a5568; }
  </style>
</head>
<body>
  <pre>${formatted
    .replace(/(".*?"):/g, '<span class="key">$1</span>:')
    .replace(/: (".*?")/g, ': <span class="string">$1</span>')
    .replace(/: (\d+)/g, ': <span class="number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="null">$1</span>')
  }</pre>
</body>
</html>`;
      } catch (e) {
        setError("Invalid JSON");
        return `<!DOCTYPE html>
<html>
<body style="background: #1a0a1f; color: #ff006e; padding: 20px; font-family: monospace;">
  <h2>⚠️ JSON Parse Error</h2>
  <p>The JSON content is invalid.</p>
</body>
</html>`;
      }
    }

    // For Markdown files
    if (isMarkdownFile) {
      // Basic markdown to HTML conversion
      const html = content
        .replace(/^### (.*$)/gm, '<h3 style="color: #00d4ff;">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 style="color: #b300ff;">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 style="color: #00ff88;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: #1a1a2e; padding: 2px 6px; border-radius: 4px;">$1</code>')
        .replace(/\n/g, '<br>');
      
      return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #0d1117;
      color: #e6e6e6;
      font-family: system-ui;
      padding: 20px;
      line-height: 1.6;
    }
  </style>
</head>
<body>${html}</body>
</html>`;
    }

    // Default: show as text
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #0d1117;
      color: #00ff88;
      font-family: 'JetBrains Mono', monospace;
      padding: 20px;
      margin: 0;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
</html>`;
  }, [content, cssContent, filename, isHtmlFile, isCssFile, isJsonFile, isMarkdownFile]);

  // Update preview with debounce (for iframe mode)
  useEffect(() => {
    if (previewMode !== "iframe") return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (iframeRef.current) {
        const html = generatePreviewHtml();
        iframeRef.current.srcdoc = html;
        setLastUpdate(new Date());
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [generatePreviewHtml, previewMode]);

  const handleRefresh = () => {
    if (previewMode === "iframe" && iframeRef.current) {
      const html = generatePreviewHtml();
      iframeRef.current.srcdoc = html;
      setLastUpdate(new Date());
      toast.success("Preview refreshed");
    } else {
      // For Sandpack, we can force a re-render
      setLastUpdate(new Date());
      toast.success("Preview refreshed");
    }
  };

  const handleOpenExternal = () => {
    const html = generatePreviewHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const togglePreviewMode = () => {
    setPreviewMode(prev => prev === "iframe" ? "sandpack" : "iframe");
  };

  const currentViewport = viewportSizes[viewport];

  // Generate Sandpack files for React preview
  const sandpackFiles = isJsxFile ? {
    "/App.tsx": content,
    "/styles.css": cssContent || `
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #0d1117 0%, #1a0a1f 100%);
  min-height: 100vh;
  color: #e6e6e6;
}
    `,
  } : {};

  return (
    <div
      className={`flex flex-col h-full bg-studio-terminal terminal-glow ${
        isMaximized ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-studio-header border-b cyber-border px-4 py-2">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="neon-green font-terminal text-xs">
            {detectedFramework ? `SOURCE VIEW` : previewMode === "sandpack" ? "REACT SANDBOX" : "LIVE PREVIEW"}
          </Badge>
          {detectedFramework && (
            <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-terminal">
              {detectedFramework} — needs dev server for full preview
            </Badge>
          )}
          <span className="text-xs text-muted-foreground font-terminal">
            {filename}
          </span>
          {error && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {error}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Toggle for JSX files */}
          {isJsxFile && (
            <Button
              variant={previewMode === "sandpack" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={togglePreviewMode}
              title={previewMode === "sandpack" ? "Using React Sandbox" : "Switch to React Sandbox"}
            >
              <Code2 className="h-3 w-3 mr-1" />
              <span className="text-xs">{previewMode === "sandpack" ? "Sandbox" : "Static"}</span>
            </Button>
          )}

          {/* Viewport Controls */}
          <div className="flex items-center border cyber-border rounded-md overflow-hidden">
            <Button
              variant={viewport === "mobile" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 rounded-none"
              onClick={() => setViewport("mobile")}
              title="Mobile"
            >
              <Smartphone className="h-3 w-3" />
            </Button>
            <Button
              variant={viewport === "tablet" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 rounded-none border-l cyber-border"
              onClick={() => setViewport("tablet")}
              title="Tablet"
            >
              <Tablet className="h-3 w-3" />
            </Button>
            <Button
              variant={viewport === "desktop" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 rounded-none border-l cyber-border"
              onClick={() => setViewport("desktop")}
              title="Desktop"
            >
              <Monitor className="h-3 w-3" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              disabled={zoom <= 25}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs font-terminal w-10 text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="neon-green hover:neon-glow"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="neon-purple hover:neon-glow"
            onClick={handleOpenExternal}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="neon-green hover:neon-glow"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Exit fullscreen" : "Fullscreen"}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={onClose}
              title="Close preview"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#1a1a2e]">
        {previewMode === "sandpack" && isJsxFile ? (
          <div
            style={{
              width: currentViewport.width,
              height: viewport === "full" ? "100%" : currentViewport.height,
              maxWidth: "100%",
              maxHeight: "100%",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
            }}
            className={`relative ${viewport !== "full" ? "shadow-2xl rounded-lg overflow-hidden border cyber-border" : ""}`}
          >
            <SandpackProvider
              template="react-ts"
              files={sandpackFiles}
              theme={cyberpunkTheme}
              options={{
                externalResources: ["https://cdn.tailwindcss.com"],
              }}
            >
              <SandpackPreview 
                showNavigator={false}
                showRefreshButton={false}
                style={{ height: "100%", width: "100%" }}
              />
            </SandpackProvider>
          </div>
        ) : (
          <div
            style={{
              width: currentViewport.width,
              height: viewport === "full" ? "100%" : currentViewport.height,
              maxWidth: "100%",
              maxHeight: "100%",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
            }}
            className={`relative ${viewport !== "full" ? "shadow-2xl rounded-lg overflow-hidden border cyber-border" : ""}`}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full bg-white"
              sandbox="allow-scripts"
              title="Live Preview"
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-studio-header border-t cyber-border flex items-center justify-between px-4 text-xs">
        <div className="flex items-center space-x-4">
          <span className="matrix-text font-terminal">
            {currentViewport.label}
            {viewport !== "full" && ` (${currentViewport.width} × ${currentViewport.height})`}
          </span>
          {previewMode === "sandpack" && (
            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
              React Runtime Active
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-muted-foreground font-terminal">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
