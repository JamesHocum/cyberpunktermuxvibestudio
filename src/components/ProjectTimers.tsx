import React from 'react';
import { Brain, Hammer } from 'lucide-react';
import { formatTimer } from '@/lib/projectTimers';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface ProjectTimersProps {
  thoughtSeconds: number;
  workedSeconds: number;
  sessionThoughtSeconds?: number;
  sessionWorkedSeconds?: number;
}

export const ProjectTimers = ({
  thoughtSeconds,
  workedSeconds,
  sessionThoughtSeconds = 0,
  sessionWorkedSeconds = 0,
}: ProjectTimersProps) => {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-3 font-terminal text-xs select-none cursor-default">
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Brain className="h-3.5 w-3.5 text-neon-purple" />
            <span className="text-neon-purple/80 tracking-wider">{formatTimer(thoughtSeconds)}</span>
          </div>
          <span className="text-muted-foreground/30">│</span>
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Hammer className="h-3.5 w-3.5 text-neon-green" />
            <span className="text-neon-green/80 tracking-wider">{formatTimer(workedSeconds)}</span>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="w-64 bg-background/95 backdrop-blur-md border-primary/20 font-terminal text-xs p-3"
      >
        <div className="space-y-3">
          <div>
            <p className="text-neon-purple font-bold mb-1.5 flex items-center gap-1.5">
              <Brain className="h-3 w-3" /> Thought For
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground pl-4">
              <span>Session</span>
              <span className="text-neon-purple/80">{formatTimer(sessionThoughtSeconds)}</span>
              <span>Lifetime</span>
              <span className="text-neon-purple/80">{formatTimer(thoughtSeconds)}</span>
            </div>
          </div>
          <div className="border-t border-primary/10" />
          <div>
            <p className="text-neon-green font-bold mb-1.5 flex items-center gap-1.5">
              <Hammer className="h-3 w-3" /> Worked For
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground pl-4">
              <span>Session</span>
              <span className="text-neon-green/80">{formatTimer(sessionWorkedSeconds)}</span>
              <span>Lifetime</span>
              <span className="text-neon-green/80">{formatTimer(workedSeconds)}</span>
            </div>
          </div>
          <p className="text-muted-foreground/50 text-[10px] pt-1">
            Worked timer pauses after 75s inactivity
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
