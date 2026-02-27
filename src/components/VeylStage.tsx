import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import veylAvatar from "@/assets/veyl-avatar.png";

type VeylMode = "hidden" | "entering" | "hero" | "idle" | "cooldown" | "error" | "saved";

const VEYL_QUOTES = [
  "Scanning the grid…",
  "Neon pulses detected.",
  "All systems nominal.",
  "The matrix hums softly.",
  "Awaiting your command, operator.",
  "Circuits aligned. Ready.",
  "Data streams look clean.",
  "I see every byte.",
  "Runtime stable. For now.",
  "The code whispers back.",
  "Latency at zero. Nice.",
  "Night shift protocol active.",
  "Compiling dreams…",
  "Your firewall? Cute.",
];

const FILE_TYPE_QUOTES: Record<string, string[]> = {
  typescript: [
    "TypeScript… strong types, stronger vibes.",
    "Interfaces locked. Types aligned.",
    "Generics detected. Respect.",
    "Type safety is my love language.",
  ],
  css: [
    "Styling the matrix, pixel by pixel.",
    "CSS grid? More like neon grid.",
    "Flexbox flows like data streams.",
    "Making it pretty. My specialty.",
  ],
  json: [
    "Parsing config… keys validated.",
    "JSON structure looks clean.",
    "Key-value pairs in harmony.",
    "Data manifest loaded.",
  ],
  javascript: [
    "Plain JS? Old school. I dig it.",
    "Dynamic typing… living dangerously.",
    "Callbacks and promises… the usual chaos.",
  ],
  html: [
    "Markup incoming. DOM awakens.",
    "Semantic tags detected. Good practice.",
  ],
  markdown: [
    "Documentation mode. Nice discipline.",
    "README vibes. Tell the world.",
  ],
};

const getFileTypeQuotes = (filename: string | null): string[] => {
  if (!filename) return VEYL_QUOTES;
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': return FILE_TYPE_QUOTES.typescript;
    case 'css': case 'scss': return FILE_TYPE_QUOTES.css;
    case 'json': return FILE_TYPE_QUOTES.json;
    case 'js': case 'jsx': return FILE_TYPE_QUOTES.javascript;
    case 'html': return FILE_TYPE_QUOTES.html;
    case 'md': return FILE_TYPE_QUOTES.markdown;
    default: return VEYL_QUOTES;
  }
};

const SAVE_QUOTES = [
  "Changes locked in. 🔒",
  "Saved to the grid. ✅",
  "Data persisted. Clean.",
  "Committed to memory.",
  "Written to the matrix.",
];

// Typewriter hook
const useTypewriter = (text: string | null, speed = 35) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
};

interface VeylStageProps {
  enabled?: boolean;
  isActive: boolean;
  isBuilding: boolean;
  hasError: boolean;
  activeFile?: string | null;
  lastSaveTick?: number | null;
}

export const VeylStage: React.FC<VeylStageProps> = ({
  enabled = false,
  isActive,
  isBuilding,
  hasError,
  activeFile = null,
  lastSaveTick = null,
}) => {
  // Defense-in-depth: if not explicitly enabled, render nothing
  if (!enabled) return null;
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<VeylMode>("hidden");
  const [showOverlays, setShowOverlays] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [idleQuote, setIdleQuote] = useState<string | null>(null);
  const [saveQuote, setSaveQuote] = useState<string | null>(null);
  const typedQuote = useTypewriter(idleQuote);
  const typedSaveQuote = useTypewriter(saveQuote, 25);

  // Idle drift state — gentle horizontal sway
  const [driftX, setDriftX] = useState(0);

  // Cursor proximity — avatar leans toward mouse
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  // SSR-safe portal mount guard
  useEffect(() => { setMounted(true); }, []);

  // Particle canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; speed: number; radius: number; color: [number, number, number]; phase: number }>>([]);
  const animFrameRef = useRef<number>(0);

  const showParticles = showAvatar && (mode === "idle" || mode === "saved");

  // Idle horizontal drift — slow sine sway ±12px over 8s
  useEffect(() => {
    if (!showAvatar || mode !== "idle") { setDriftX(0); return; }
    let raf: number;
    const sway = () => {
      const now = performance.now();
      setDriftX(Math.sin((now % 8000) / 8000 * Math.PI * 2) * 12);
      raf = requestAnimationFrame(sway);
    };
    raf = requestAnimationFrame(sway);
    return () => cancelAnimationFrame(raf);
  }, [showAvatar, mode]);

  // Cursor proximity — lean toward mouse within 300px radius
  useEffect(() => {
    if (!showAvatar || !mounted) return;
    const PROXIMITY = 300;
    const handleMouse = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PROXIMITY) {
        const strength = 1 - dist / PROXIMITY; // 1 at center, 0 at edge
        setCursorOffset({
          x: (dx / PROXIMITY) * 16 * strength, // max ±16px shift
          y: (dy / PROXIMITY) * 6 * strength,   // max ±6px vertical
        });
      } else {
        setCursorOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [showAvatar, mounted]);

  // Initialize particles — scoped to a fixed 320×400 region
  useEffect(() => {
    if (!showParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 320;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    const colors: [number, number, number][] = [
      [74, 222, 128],
      [168, 85, 247],
      [34, 211, 238],
    ];
    const particles: typeof particlesRef.current = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: W * (0.2 + Math.random() * 0.6),
        y: H * (0.5 + Math.random() * 0.5),
        speed: 0.3 + Math.random() * 0.7,
        radius: 1.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * 2000,
      });
    }
    particlesRef.current = particles;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const now = performance.now();
      const globalPulse = (Math.sin((now % 2000) / 2000 * Math.PI * 2) + 1) / 2;

      for (const p of particlesRef.current) {
        p.y -= p.speed;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = W * (0.2 + Math.random() * 0.6);
        }
        const localPulse = (Math.sin(((now + p.phase) % 2000) / 2000 * Math.PI * 2) + 1) / 2;
        const pulse = (globalPulse + localPulse) / 2;
        const opacity = 0.3 + pulse * 0.5;
        const r = p.radius + pulse * 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${opacity})`;
        ctx.shadowColor = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${opacity * 0.6})`;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      animFrameRef.current = requestAnimationFrame(draw);
    };
    animFrameRef.current = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(animFrameRef.current); };
  }, [showParticles]);

  // Pick a random quote, avoiding repeats, contextual to file type
  const pickQuote = useCallback(() => {
    const pool = getFileTypeQuotes(activeFile);
    setIdleQuote((prev) => {
      let next: string;
      do {
        next = pool[Math.floor(Math.random() * pool.length)];
      } while (next === prev && pool.length > 1);
      return next;
    });
  }, [activeFile]);

  // Cycle quotes every 6s while avatar is visible and idle
  useEffect(() => {
    if (!showAvatar || (mode !== "idle" && mode !== "error")) {
      setIdleQuote(null);
      return;
    }
    pickQuote();
    const interval = setInterval(pickQuote, 6000);
    return () => clearInterval(interval);
  }, [showAvatar, mode, pickQuote]);

  // activation / entrance
  useEffect(() => {
    if (!isActive) {
      if (mode !== "hidden") {
        setMode("cooldown");
        setShowAvatar(false);
        const t = setTimeout(() => setMode("hidden"), 600);
        return () => clearTimeout(t);
      }
      return;
    }
    if (mode === "hidden" || mode === "cooldown") {
      setShowOverlays(true);
      setShowAvatar(false);
      setMode("entering");
      const t = setTimeout(() => setMode("idle"), 1500);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  // build pulse → hero, then idle
  useEffect(() => {
    if (!isActive || !isBuilding) return;
    setShowOverlays(true);
    setMode("hero");
    const t = setTimeout(() => setMode("idle"), 1500);
    return () => clearTimeout(t);
  }, [isBuilding, isActive]);

  // error flash → error state, then back to idle
  useEffect(() => {
    if (!isActive || !hasError) return;
    setMode("error");
    const t = setTimeout(() => setMode("idle"), 1400);
    return () => clearTimeout(t);
  }, [hasError, isActive]);

  // save reaction
  useEffect(() => {
    if (!isActive || !lastSaveTick || !showAvatar) return;
    const quote = SAVE_QUOTES[Math.floor(Math.random() * SAVE_QUOTES.length)];
    setSaveQuote(quote);
    setMode("saved");
    const t = setTimeout(() => {
      setMode("idle");
      setSaveQuote(null);
    }, 2200);
    return () => clearTimeout(t);
  }, [lastSaveTick, isActive, showAvatar]);

  // fade out overlays 2s after entering idle
  useEffect(() => {
    if (mode !== "idle") return;
    const t = setTimeout(() => setShowOverlays(false), 2000);
    return () => clearTimeout(t);
  }, [mode]);

  // show avatar after overlays fade out
  useEffect(() => {
    if (!showOverlays && (mode === "idle" || mode === "error")) {
      const t = setTimeout(() => setShowAvatar(true), 300);
      return () => clearTimeout(t);
    }
  }, [showOverlays, mode]);

  if (mode === "hidden" || !mounted) return null;

  const animClass = (() => {
    switch (mode) {
      case "entering": return "animate-veyl-enter";
      case "hero": return "animate-veyl-hero";
      case "idle": return "animate-veyl-idle";
      case "cooldown": return "animate-veyl-exit";
      case "error": return "animate-veyl-error";
      case "saved": return "animate-veyl-idle";
      default: return "";
    }
  })();

  return createPortal(
    <div
      ref={wrapperRef}
      className="fixed bottom-6 left-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{
        zIndex: 9999,
        transform: `translateX(calc(-50% + ${driftX + cursorOffset.x}px))`,
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* Atmospheric CSS gradient layers — no asset dependency */}
      <div className="absolute inset-0 bg-black rounded-full opacity-40 blur-3xl scale-150" />
      <div className="absolute inset-0 opacity-70 rounded-full blur-2xl scale-125" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(0,255,170,0.14) 0%, rgba(0,0,0,0) 55%)' }} />
      <div className="absolute inset-0 opacity-60 rounded-full blur-2xl scale-125" style={{ background: 'radial-gradient(circle at 60% 70%, rgba(180,0,255,0.12) 0%, rgba(0,0,0,0) 55%)' }} />
      <div className="absolute inset-0 opacity-80" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.25), rgba(0,0,0,0.88))' }} />

      {/* Particle canvas — fixed-size region behind avatar */}
      <div className="relative flex flex-col items-center">
        <canvas
          ref={canvasRef}
          className="absolute transition-opacity duration-700 pointer-events-none"
          style={{
            width: 320,
            height: 400,
            opacity: showParticles ? 1 : 0,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Veyl avatar — no border, no box, transparent PNG floating freely */}
        <div
          className={[
            "relative h-64 w-32 md:h-80 md:w-40",
            animClass,
            showAvatar && mode === "idle" ? "animate-veyl-avatar-glow animate-veyl-breathe" :
            showAvatar && mode === "saved" ? "animate-veyl-save-flash animate-veyl-breathe" : "",
          ].join(" ")}
          style={{
            opacity: showAvatar ? 1 : 0,
            transition: 'opacity 0.5s ease-out, transform 0.15s ease-out',
            transform: showAvatar
              ? `translateY(${cursorOffset.y}px) rotate(${cursorOffset.x * 0.15}deg)`
              : 'translateY(16px)',
          }}
        >
          <img
            src={veylAvatar}
            alt="Veyl hero form"
            className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]"
          />
        </div>
      </div>

      {/* Speech bubbles — stacked below avatar */}
      {mode === "hero" && (
        <div className="relative max-w-xs">
          <div className="rounded-2xl bg-black/85 px-4 py-1.5 text-xs font-semibold text-cyan-300 border border-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.7)]">
            ⚡ Building…
          </div>
          <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-black/85 border-l border-t border-cyan-400/70" />
        </div>
      )}

      {mode === "error" && (
        <div className="relative max-w-xs">
          <div className="rounded-2xl bg-red-900/90 px-4 py-1.5 text-xs font-semibold text-red-100 border border-red-400/80 shadow-[0_0_22px_rgba(248,113,113,0.95)]">
            ❌ Build glitch detected
          </div>
          <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-red-900/90 border-l border-t border-red-400/80" />
        </div>
      )}

      {mode === "saved" && typedSaveQuote && (
        <div className="relative max-w-xs">
          <div className="rounded-2xl bg-emerald-900/80 px-4 py-1.5 text-xs font-semibold text-emerald-100 border border-emerald-400/80 shadow-[0_0_20px_rgba(74,222,128,0.9)]">
            💾 {typedSaveQuote}
          </div>
          <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-emerald-900/80 border-l border-t border-emerald-400/80" />
        </div>
      )}

      {showAvatar && mode === "idle" && typedQuote && (
        <div className="relative max-w-xs" key={idleQuote}>
          <div className="rounded-2xl bg-black/80 px-4 py-1.5 text-xs font-semibold text-purple-100 border border-purple-500/70 shadow-[0_0_18px_rgba(168,85,247,0.7)]">
            💬 {typedQuote}
          </div>
          <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-black/80 border-l border-t border-purple-500/70" />
        </div>
      )}
    </div>,
    document.body
  );
};
