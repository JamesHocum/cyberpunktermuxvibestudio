import React, { useEffect, useState, useCallback } from "react";
import veylBg from "@/assets/veyl-stage-bg.jpg";
import veylAvatar from "@/assets/veyl-avatar.png";

type VeylMode = "hidden" | "entering" | "hero" | "idle" | "cooldown" | "error";

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

interface VeylStageProps {
  isActive: boolean;
  isBuilding: boolean;
  hasError: boolean;
}

export const VeylStage: React.FC<VeylStageProps> = ({
  isActive,
  isBuilding,
  hasError,
}) => {
  const [mode, setMode] = useState<VeylMode>("hidden");
  const [showOverlays, setShowOverlays] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [idleQuote, setIdleQuote] = useState<string | null>(null);

  // Pick a random quote, avoiding repeats
  const pickQuote = useCallback(() => {
    setIdleQuote((prev) => {
      let next: string;
      do {
        next = VEYL_QUOTES[Math.floor(Math.random() * VEYL_QUOTES.length)];
      } while (next === prev && VEYL_QUOTES.length > 1);
      return next;
    });
  }, []);

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
      case "entering":
        return "animate-veyl-enter";
      case "hero":
        return "animate-veyl-hero";
      case "idle":
        return "animate-veyl-idle";
      case "cooldown":
        return "animate-veyl-exit";
      case "error":
        return "animate-veyl-error";
      default:
        return "";
    }
  })();

  return (
    <div className={`absolute inset-0 z-10 overflow-hidden bg-black ${animClass}`}>
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
        {/* Placeholder avatar (fades out) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full border-2 border-neon-purple bg-black/50 shadow-neon-purple flex items-center justify-center">
            <span className="text-2xl">🐾</span>
          </div>
        </div>

        {/* Idle label (only while overlays visible) */}
        {mode === "idle" && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center">
            <div className="inline-flex rounded-full bg-black/60 px-4 py-1 text-xs font-semibold text-purple-200 border border-purple-500/60 shadow-[0_0_16px_rgba(168,85,247,0.6)]">
              Veyl Stage Active
            </div>
          </div>
        )}
      </div>

      {/* Avatar sprite (enters after overlays fade) */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-700"
        style={{ opacity: showAvatar ? 1 : 0, transform: showAvatar ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(40px)' }}
      >
        <div
          className={`relative h-28 w-28 rounded-full border-2 border-neon-green overflow-hidden ${
            showAvatar && mode === "idle" ? "animate-veyl-avatar-glow" : "shadow-[0_0_20px_rgba(74,222,128,0.9)]"
          }`}
        >
          <img
            src={veylAvatar}
            alt="Veyl avatar"
            className="w-full h-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-purple-500/10" />
        </div>
      </div>

      {/* Speech bubbles (above avatar, always positioned) */}
      <div className="absolute bottom-36 left-1/2 -translate-x-1/2 space-y-2 text-center">
        {mode === "hero" && (
          <div className="inline-flex rounded-full bg-black/70 px-4 py-1 text-xs font-semibold text-neon-cyan border border-neon-cyan/60 shadow-[0_0_18px_rgba(45,212,191,0.7)] animate-veyl-enter">
            ⚡ Building...
          </div>
        )}
        {mode === "error" && (
          <div className="inline-flex rounded-full bg-red-900/80 px-4 py-1 text-xs font-semibold text-red-100 border border-red-400/80 shadow-[0_0_20px_rgba(248,113,113,0.9)] animate-veyl-enter">
            ❌ Build glitch detected
          </div>
        )}
        {showAvatar && mode === "idle" && idleQuote && (
          <div className="inline-flex rounded-full bg-black/70 px-4 py-1 text-xs font-semibold text-purple-200 border border-purple-500/50 shadow-[0_0_14px_rgba(168,85,247,0.5)] animate-fade-in" key={idleQuote}>
            💬 {idleQuote}
          </div>
        )}
      </div>
    </div>
  );
};
