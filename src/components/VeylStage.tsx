import React, { useEffect, useState, useCallback } from "react";
import veylBg from "@/assets/veyl-stage-bg.jpg";
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
  isActive: boolean;
  isBuilding: boolean;
  hasError: boolean;
  activeFile?: string | null;
  lastSaveTick?: number | null;
}

export const VeylStage: React.FC<VeylStageProps> = ({
  isActive,
  isBuilding,
  hasError,
  activeFile = null,
  lastSaveTick = null,
}) => {
  const [mode, setMode] = useState<VeylMode>("hidden");
  const [showOverlays, setShowOverlays] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [idleQuote, setIdleQuote] = useState<string | null>(null);
  const [saveQuote, setSaveQuote] = useState<string | null>(null);
  const typedQuote = useTypewriter(idleQuote);
  const typedSaveQuote = useTypewriter(saveQuote, 25);

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

  // save reaction → saved mode, then back to idle (triggered by lastSaveTick)
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

  if (mode === "hidden") return null;

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

  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-black">
      {/* Alley background */}
      <img
        src={veylBg}
        alt="Veyl Stage background"
        className="absolute inset-0 w-full h-full object-contain saturate-[1.2]"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Overlays that fade out after idle (paw placeholder + idle label) */}
      <div
        className="transition-opacity duration-1000"
        style={{ opacity: showOverlays ? 1 : 0 }}
      >
        {/* Idle label (only while overlays visible) */}
        {mode === "idle" && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center">
            <div className="inline-flex rounded-full bg-black/60 px-4 py-1 text-xs font-semibold text-purple-200 border border-purple-500/60 shadow-[0_0_16px_rgba(168,85,247,0.6)]">
              Veyl Stage Active
            </div>
          </div>
        )}
      </div>

      {/* Avatar + bubble container at bottom center */}
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: showAvatar ? 1 : 0, transition: 'opacity 0.5s ease-out, transform 0.5s ease-out', transform: showAvatar ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(16px)' }}
      >
        {/* Veyl hero panel — tall comic-style rectangle */}
        <div
          className={[
            "relative h-64 w-32 md:h-80 md:w-40",
            "rounded-xl border-2 border-neon-green/80 bg-transparent overflow-hidden",
            "shadow-[0_0_30px_rgba(74,222,128,0.9)]",
            animClass,
            showAvatar && mode === "idle" ? "animate-veyl-avatar-glow animate-veyl-breathe" :
            showAvatar && mode === "saved" ? "animate-veyl-save-flash animate-veyl-breathe" : "",
          ].join(" ")}
        >
          <img
            src={veylAvatar}
            alt="Veyl hero form"
            className="absolute inset-0 h-full w-full object-contain"
          />

          {/* subtle top glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-purple-500/15" />
        </div>

        {/* Comic-style speech bubbles with diamond tail */}
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
      </div>
    </div>
  );
};
