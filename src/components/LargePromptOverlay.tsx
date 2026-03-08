import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Send, Maximize2, FileText } from "lucide-react";

interface LargePromptOverlayProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

const LargePromptOverlay: React.FC<LargePromptOverlayProps> = ({
  open,
  onClose,
  onSubmit,
  disabled,
}) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setText("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[90vw] max-w-4xl h-[80vh] flex flex-col rounded-lg border cyber-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b cyber-border">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-primary" />
            <span className="font-cyber text-sm text-foreground">PASTE LARGE PROMPT</span>
            <Badge variant="secondary" className="text-[9px] h-4 font-terminal">
              <FileText className="h-3 w-3 mr-1" />
              Full-screen mode
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Textarea */}
        <div className="flex-1 p-4 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your architecture docs, build manifests, multi-part instructions, or full code files here..."
            className="w-full h-full resize-none rounded-md border cyber-border bg-muted/30 p-4 text-sm font-terminal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t cyber-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-terminal">
              {text.length > 0 ? `${text.length.toLocaleString()} chars` : "Paste or type your prompt"}
            </span>
            {text.length >= 50000 && (
              <Badge variant="destructive" className="text-[9px] h-4">Auto-chunking will activate</Badge>
            )}
            {text.length >= 20000 && text.length < 50000 && (
              <Badge variant="secondary" className="text-[9px] h-4">📝 Large prompt</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="neon-glow"
              onClick={handleSubmit}
              disabled={!text.trim() || disabled}
            >
              <Send className="h-4 w-4 mr-1" />
              Send Prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LargePromptOverlay;
