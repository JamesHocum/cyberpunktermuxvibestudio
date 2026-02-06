import { Download, Trash2, ExternalLink, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadExtension } from '@/lib/extensionLoader';
import { toast } from 'sonner';

interface ExtensionCardProps {
  extension: {
    id: string;
    name: string;
    description: string | null;
    author: string | null;
    url: string;
    source?: 'community' | 'local';
    downloads?: number;
  };
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}

export function ExtensionCard({ 
  extension, 
  isInstalled, 
  onInstall, 
  onUninstall 
}: ExtensionCardProps) {
  const handleInstall = async () => {
    try {
      await loadExtension(extension.url);
      onInstall();
    } catch (err) {
      toast.error('Failed to load extension');
      console.error('Extension load error:', err);
    }
  };

  return (
    <div className="p-3 cyber-border rounded-md bg-studio-terminal/50 hover:bg-studio-terminal transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-terminal text-sm text-primary truncate">
              {extension.name}
            </h4>
            {extension.source === 'local' && (
              <Badge variant="outline" className="text-xs shrink-0">
                Built-in
              </Badge>
            )}
            {extension.source === 'community' && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Community
              </Badge>
            )}
          </div>
          
          {extension.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {extension.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {extension.author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {extension.author}
              </span>
            )}
            {extension.downloads !== undefined && extension.downloads > 0 && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {extension.downloads}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(extension.url, '_blank')}
            title="View source"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          
          {isInstalled ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onUninstall}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleInstall}
              className="h-8 neon-button"
            >
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
