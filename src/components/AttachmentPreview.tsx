import React from 'react';
import { X, FileCode, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatAttachment } from '@/hooks/useChatAttachments';
import { formatFileSize, getFileExtension, getLanguageFromExtension } from '@/lib/fileProcessing';
import { cn } from '@/lib/utils';

interface AttachmentPreviewProps {
  attachments: ChatAttachment[];
  onRemove?: (id: string) => void;
  isEditable?: boolean;
  compact?: boolean;
}

const getFileIcon = (attachment: ChatAttachment) => {
  if (attachment.type === 'image') return Image;
  if (attachment.type === 'code') return FileCode;
  return FileText;
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  onRemove,
  isEditable = false,
  compact = false,
}) => {
  if (attachments.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-wrap gap-2",
      compact ? "max-w-full" : ""
    )}>
      {attachments.map((attachment) => {
        const Icon = getFileIcon(attachment);
        
        if (attachment.type === 'image' && attachment.base64) {
          return (
            <div
              key={attachment.id}
              className="relative group"
            >
              <img
                src={attachment.base64}
                alt={attachment.name}
                className={cn(
                  "rounded-lg object-cover cyber-border",
                  compact ? "h-16 w-16" : "h-24 w-24"
                )}
              />
              {isEditable && onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(attachment.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-matrix-green px-1 py-0.5 rounded-b-lg truncate">
                {attachment.name}
              </div>
            </div>
          );
        }

        // Code or text file preview
        return (
          <div
            key={attachment.id}
            className={cn(
              "relative group flex items-center gap-2 px-3 py-2 rounded-lg cyber-border bg-studio-terminal",
              compact ? "max-w-[150px]" : "max-w-[200px]"
            )}
          >
            <Icon className="h-4 w-4 neon-green flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-matrix-green truncate">{attachment.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(attachment.size)}
                {attachment.type === 'code' && (
                  <span className="ml-1">
                    • {getLanguageFromExtension(getFileExtension(attachment.name))}
                  </span>
                )}
              </p>
            </div>
            {isEditable && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onRemove(attachment.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Inline attachment display for messages
export const MessageAttachments: React.FC<{ attachments: ChatAttachment[] }> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => {
        if (attachment.type === 'image' && attachment.base64) {
          return (
            <div key={attachment.id} className="relative">
              <img
                src={attachment.base64}
                alt={attachment.name}
                className="rounded-lg max-h-64 object-contain cyber-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(attachment.base64, '_blank')}
              />
            </div>
          );
        }

        if (attachment.type === 'code' && attachment.content) {
          return (
            <div key={attachment.id} className="rounded-lg cyber-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-studio-terminal border-b cyber-border">
                <FileCode className="h-3 w-3 neon-green" />
                <span className="text-xs text-matrix-green">{attachment.name}</span>
              </div>
              <pre className="p-3 text-xs overflow-x-auto bg-black/50 max-h-48">
                <code className="text-matrix-green/80">{attachment.content}</code>
              </pre>
            </div>
          );
        }

        return (
          <div key={attachment.id} className="flex items-center gap-2 px-3 py-2 rounded-lg cyber-border bg-studio-terminal">
            <FileText className="h-4 w-4 neon-green" />
            <span className="text-xs text-matrix-green">{attachment.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {formatFileSize(attachment.size)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
