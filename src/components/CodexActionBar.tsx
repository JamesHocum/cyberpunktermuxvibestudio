import React from 'react';
import { Sparkles, RefreshCw, Bug, HelpCircle, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type CodexAction = 'chat' | 'generate' | 'refactor' | 'debug' | 'explain' | 'test';

interface CodexActionBarProps {
  currentAction: CodexAction;
  onAction: (action: CodexAction) => void;
  disabled?: boolean;
}

interface ActionButton {
  action: CodexAction;
  icon: React.ElementType;
  label: string;
  description: string;
}

const actions: ActionButton[] = [
  { 
    action: 'chat', 
    icon: Sparkles, 
    label: 'Chat', 
    description: 'General AI assistance' 
  },
  { 
    action: 'generate', 
    icon: Sparkles, 
    label: 'Generate', 
    description: 'Generate new code from description' 
  },
  { 
    action: 'refactor', 
    icon: RefreshCw, 
    label: 'Refactor', 
    description: 'Improve and optimize existing code' 
  },
  { 
    action: 'debug', 
    icon: Bug, 
    label: 'Debug', 
    description: 'Find and fix bugs in code' 
  },
  { 
    action: 'explain', 
    icon: HelpCircle, 
    label: 'Explain', 
    description: 'Explain code step by step' 
  },
  { 
    action: 'test', 
    icon: FlaskConical, 
    label: 'Test', 
    description: 'Generate unit tests' 
  },
];

export const CodexActionBar: React.FC<CodexActionBarProps> = ({
  currentAction,
  onAction,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-studio-terminal/50 cyber-border overflow-x-auto">
      {actions.map(({ action, icon: Icon, label, description }) => (
        <Tooltip key={action}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onAction(action)}
              className={cn(
                "h-7 px-2 text-xs gap-1 transition-all",
                currentAction === action
                  ? "bg-matrix-green/20 text-matrix-green neon-green"
                  : "text-muted-foreground hover:text-matrix-green hover:bg-matrix-green/10"
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-studio-terminal cyber-border">
            <p className="text-matrix-green text-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
