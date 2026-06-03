import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, SkipForward, X, Sparkles, Zap, Eye, Upload, MessageSquare,
} from "lucide-react";

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  /** Optional CSS selector to spotlight on the page. */
  target?: string;
  /** Optional prompt to inject into the AI chat panel (auto-sends). */
  prompt?: string;
  /** Optional toolbar button to click (by data-demo attr or selector). */
  click?: string;
  /** Milliseconds to wait before advancing automatically. */
  hold?: number;
  icon?: React.ComponentType<{ className?: string }>;
  pipelineStage?: string;
}

const DEFAULT_STEPS: DemoStep[] = [
  {
    id: "intro",
    title: "Welcome to Cyberpunk Termux",
    description: "This walkthrough will auto-run a complete build pipeline — prompt → generate → preview → publish — while spotlighting each stage. Sit back and watch.",
    icon: Sparkles,
    hold: 4500,
    pipelineStage: "INTRO",
  },
  {
    id: "open-chat",
    title: "Open the AI Copilot",
    description: "The AI Copilot is the conductor of the build pipeline. Every prompt becomes a stage in the autonomous loop.",
    click: '[data-demo="toggle-chat"]',
    target: '[data-demo="toggle-chat"]',
    icon: MessageSquare,
    hold: 3500,
    pipelineStage: "CONTEXT",
  },
  {
    id: "prompt",
    title: "Stage 1 — Prompt → Plan",
    description: "Injecting a sample build prompt. The Copilot detects build intent and switches to autonomous generation.",
    prompt: "Build me a neon-themed sticky notes app with draggable notes, a color picker, and local persistence. Make it feel cyberpunk.",
    target: "textarea",
    icon: Zap,
    hold: 6000,
    pipelineStage: "PLAN",
  },
  {
    id: "generate",
    title: "Stage 2 — Generate → Install → Build",
    description: "Codex generates complete files with dependencies wired. Watch the file tree populate as the build pipeline advances.",
    icon: Sparkles,
    hold: 5500,
    pipelineStage: "BUILD",
  },
  {
    id: "preview",
    title: "Stage 3 — Preview & Verify",
    description: "The Sandpack preview boots the running app inline — no separate server, no exporting.",
    click: '[data-demo="toggle-preview"]',
    target: '[data-demo="toggle-preview"]',
    icon: Eye,
    hold: 5000,
    pipelineStage: "PREVIEW",
  },
  {
    id: "publish",
    title: "Stage 4 — One-Click Publish",
    description: "Smart Publish detects your project type and routes to the fastest deployment target. Click and receive a live URL.",
    target: '[data-demo="publish"]',
    icon: Upload,
    hold: 5000,
    pipelineStage: "PUBLISH",
  },
  {
    id: "done",
    title: "Pipeline Complete",
    description: "Prompt → Plan → Build → Preview → Publish. That's the entire loop. Try it yourself with your own idea.",
    icon: Sparkles,
    hold: 4500,
    pipelineStage: "DONE",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  steps?: DemoStep[];
}

export const DemoModeOverlay = ({ open, onClose, steps = DEFAULT_STEPS }: Props) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = steps[idx];

  // Spotlight + actions per step
  useEffect(() => {
    if (!open || !step) return;
    setRect(null);

    if (step.click) {
      const el = document.querySelector<HTMLElement>(step.click);
      el?.click();
    }
    if (step.prompt) {
      // Dispatch to AIChatPanel listener
      window.dispatchEvent(
        new CustomEvent("cyberpunk:demo-prompt", { detail: { prompt: step.prompt } })
      );
    }
    if (step.target) {
      // Allow the click/toggle to render before measuring
      const tid = setTimeout(() => {
        const el = document.querySelector<HTMLElement>(step.target!);
        if (el) setRect(el.getBoundingClientRect());
      }, 250);
      return () => clearTimeout(tid);
    }
  }, [idx, open, step]);

  // Auto-advance
  useEffect(() => {
    if (!open || paused || !step) return;
    const hold = step.hold ?? 4000;
    const tid = setTimeout(() => {
      if (idx < steps.length - 1) setIdx((i) => i + 1);
    }, hold);
    return () => clearTimeout(tid);
  }, [idx, open, paused, step, steps.length]);

  const close = useCallback(() => {
    setIdx(0);
    setPaused(false);
    onClose();
  }, [onClose]);

  if (!open || !step) return null;

  const Icon = step.icon ?? Sparkles;
  const progress = ((idx + 1) / steps.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dim layer with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={() => setPaused((p) => !p)}>
        <defs>
          <mask id="demo-spot">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                rx={10}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(5,5,10,0.72)" mask="url(#demo-spot)" />
        {rect && (
          <rect
            x={rect.left - 8}
            y={rect.top - 8}
            width={rect.width + 16}
            height={rect.height + 16}
            rx={10}
            fill="none"
            stroke="hsl(140, 100%, 55%)"
            strokeWidth={2}
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Step card */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[min(560px,90vw)] pointer-events-auto">
        <div className="rounded-xl border border-[hsl(var(--neon-green)/0.5)] bg-[hsl(var(--studio-terminal))]/95 backdrop-blur-md shadow-[0_0_40px_hsl(var(--neon-green)/0.35)] p-5">
          {/* progress */}
          <div className="h-1 w-full bg-border/40 rounded overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-[hsl(var(--neon-green))] to-[hsl(var(--neon-cyan))] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-lg p-2 bg-[hsl(var(--neon-green)/0.12)] text-[hsl(var(--neon-green))]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] border-[hsl(var(--neon-purple)/0.6)] text-[hsl(var(--neon-purple))]">
                  STEP {idx + 1} / {steps.length}
                </Badge>
                {step.pipelineStage && (
                  <Badge variant="outline" className="text-[10px] border-[hsl(var(--neon-cyan)/0.6)] text-[hsl(var(--neon-cyan))]">
                    {step.pipelineStage}
                  </Badge>
                )}
                {paused && <Badge variant="secondary" className="text-[10px]">PAUSED</Badge>}
              </div>
              <h3 className="text-base font-cyber font-bold text-[hsl(var(--neon-green))] mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground font-terminal leading-relaxed">{step.description}</p>
              {step.prompt && (
                <div className="mt-3 rounded border border-[hsl(var(--neon-purple)/0.4)] bg-[hsl(var(--neon-purple)/0.08)] p-2 text-[11px] font-terminal text-foreground/90 break-words">
                  &gt; {step.prompt}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => setPaused((p) => !p)} className="neon-purple">
                {paused ? <Play className="h-3.5 w-3.5 mr-1" /> : <Pause className="h-3.5 w-3.5 mr-1" />}
                {paused ? "Resume" : "Pause"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => idx < steps.length - 1 ? setIdx(idx + 1) : close()}
                className="neon-green"
              >
                <SkipForward className="h-3.5 w-3.5 mr-1" />
                {idx < steps.length - 1 ? "Next" : "Finish"}
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={close} className="text-muted-foreground">
              <X className="h-3.5 w-3.5 mr-1" /> Exit
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DemoModeOverlay;
