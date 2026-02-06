import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExtensionSandboxProps {
  url: string;
  name?: string;
  onClose?: () => void;
}

export function ExtensionSandbox({ url, name, onClose }: ExtensionSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const reload = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      iframeRef.current.src = url;
    }
  };

  useEffect(() => {
    // Reset state when URL changes
    setIsLoading(true);
    setHasError(false);
  }, [url]);

  return (
    <div className="relative h-full w-full cyber-border rounded-md overflow-hidden bg-studio-terminal">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20 bg-studio-sidebar">
        <span className="font-terminal text-xs text-primary truncate">
          {name || 'Extension Sandbox'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={reload}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative h-[calc(100%-36px)]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-studio-terminal">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-studio-terminal text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2 text-destructive" />
            <p className="text-sm">Failed to load extension</p>
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={url}
          title={name || 'Extension Sandbox'}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    </div>
  );
}
