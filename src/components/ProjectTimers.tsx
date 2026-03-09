import React from 'react';
import { Brain, Hammer } from 'lucide-react';
import { formatTimer } from '@/lib/projectTimers';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProjectTimersProps {
  thoughtSeconds: number;
  workedSeconds: number;
}

export const ProjectTimers = ({ thoughtSeconds, workedSeconds }: ProjectTimersProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-3 font-terminal text-xs select-none">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-default">
              <Brain className="h-3.5 w-3.5 text-neon-purple" />
              <span className="text-neon-purple/80 tracking-wider">{formatTimer(thoughtSeconds)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-studio-sidebar cyber-border font-terminal text-xs">
            <p className="text-neon-purple">Thought For — total session time</p>
            <p className="text-muted-foreground mt-1">Tracks elapsed time while the project is open</p>
          </TooltipContent>
        </Tooltip>

        <span className="text-muted-foreground/30">│</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-default">
              <Hammer className="h-3.5 w-3.5 text-neon-green" />
              <span className="text-neon-green/80 tracking-wider">{formatTimer(workedSeconds)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-studio-sidebar cyber-border font-terminal text-xs">
            <p className="text-neon-green">Worked For — active coding time</p>
            <p className="text-muted-foreground mt-1">Increments while typing, prompting, saving, or building</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
