import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, FileDown, FileCode, Rocket, Globe, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { parseMessageContent, ParsedSegment, ParsedCodeBlock } from "@/lib/parseCodeBlocks";
import { highlightCode } from "@/lib/neonSyntaxHighlighter";

interface MessageContentProps {
  content: string;
  onApplyCode?: (filename: string, code: string) => void;
  onDeploy?: (target: 'vercel' | 'netlify' | 'zip') => void;
}

const CodeBlockWithApply: React.FC<{
  block: ParsedCodeBlock;
  onApply?: (filename: string, code: string) => void;
}> = ({ block, onApply }) => {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const handleApply = () => {
    if (onApply) {
      onApply(block.filename, block.code);
      setApplied(true);
      toast.success(`Applied to ${block.filename}`);
    }
  };

  const highlighted = highlightCode(block.code, 'matrix');

  return (
    <div className="my-3 rounded-lg overflow-hidden cyber-border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-studio-header border-b border-border/30">
        <div className="flex items-center gap-2">
          <FileCode className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-terminal text-muted-foreground">{block.filename}</span>
          {block.language && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">
              {block.language}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] font-terminal text-muted-foreground hover:text-foreground" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          {onApply && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-5 px-2 text-[10px] font-terminal gap-1 ${applied ? 'text-green-400' : 'text-primary hover:text-primary hover:bg-primary/10'}`}
              onClick={handleApply}
              disabled={applied}
            >
              {applied ? (<><Check className="h-3 w-3" />Applied</>) : (<><FileDown className="h-3 w-3" />Apply</>)}
            </Button>
          )}
        </div>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-terminal bg-studio-terminal/80">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
};

const DeploymentOptions: React.FC<{ onDeploy?: (target: 'vercel' | 'netlify' | 'zip') => void }> = ({ onDeploy }) => {
  if (!onDeploy) return null;

  return (
    <div className="mt-4 p-3 rounded-lg cyber-border bg-studio-header/50">
      <p className="text-xs font-terminal text-muted-foreground mb-2">
        <Rocket className="h-3 w-3 inline mr-1" />
        Deploy your project:
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-terminal gap-1.5 cyber-border text-foreground hover:bg-primary/10"
          onClick={() => onDeploy('vercel')}
        >
          <Globe className="h-3 w-3" />
          Vercel
          <ExternalLink className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-terminal gap-1.5 cyber-border text-foreground hover:bg-primary/10"
          onClick={() => onDeploy('netlify')}
        >
          <Globe className="h-3 w-3" />
          Netlify
          <ExternalLink className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-terminal gap-1.5 cyber-border text-foreground hover:bg-primary/10"
          onClick={() => onDeploy('zip')}
        >
          <Download className="h-3 w-3" />
          Download ZIP
        </Button>
      </div>
    </div>
  );
};

export const MessageContent: React.FC<MessageContentProps> = ({ content, onApplyCode, onDeploy }) => {
  const segments = parseMessageContent(content);
  const codeBlocks = segments.filter(s => s.type === 'code' && s.codeBlock);
  const [allApplied, setAllApplied] = useState(false);

  const handleApplyAll = () => {
    if (!onApplyCode) return;
    codeBlocks.forEach(s => {
      if (s.codeBlock) {
        onApplyCode(s.codeBlock.filename, s.codeBlock.code);
      }
    });
    setAllApplied(true);
    toast.success(`Applied ${codeBlocks.length} files to project`);
  };

  return (
    <div>
      {segments.map((segment, idx) => {
        if (segment.type === 'code' && segment.codeBlock) {
          return <CodeBlockWithApply key={idx} block={segment.codeBlock} onApply={onApplyCode} />;
        }
        return (
          <pre key={idx} className="whitespace-pre-wrap text-sm font-terminal text-muted-foreground">
            {segment.content}
          </pre>
        );
      })}

      {codeBlocks.length > 1 && onApplyCode && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className={`text-xs font-terminal gap-1.5 cyber-border ${allApplied ? 'text-green-400 border-green-500/30' : 'text-primary border-primary/30 hover:bg-primary/10'}`}
            onClick={handleApplyAll}
            disabled={allApplied}
          >
            {allApplied ? (<><Check className="h-3 w-3" />All Applied</>) : (<><Rocket className="h-3 w-3" />Apply All ({codeBlocks.length} files)</>)}
          </Button>
        </div>
      )}

      {/* Show deployment options after applying code */}
      {allApplied && <DeploymentOptions onDeploy={onDeploy} />}
    </div>
  );
};
