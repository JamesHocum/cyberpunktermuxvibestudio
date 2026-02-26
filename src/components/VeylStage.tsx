import React, { useEffect, useState } from "react";
import veylBg from "@/assets/veyl-stage-bg.jpg";

type VeylMode = "hidden" | "entering" | "hero" | "idle" | "cooldown";

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

  // activation / entrance
  useEffect(() => {
    if (!isActive) {
      if (mode !== "hidden") {
        setMode("cooldown");
        const t = setTimeout(() => setMode("hidden"), 600);
        return () => clearTimeout(t);
      }
      return;
    }
    if (mode === "hidden" || mode === "cooldown") {
      setShowOverlays(true);
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

  // fade out overlays 2s after entering idle
  useEffect(() => {
    if (mode !== "idle") return;
    const t = setTimeout(() => setShowOverlays(false), 2000);
    return () => clearTimeout(t);
  }, [mode]);

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

      {/* Overlays that fade out after idle */}
      <div
        className="transition-opacity duration-1000"
        style={{ opacity: showOverlays ? 1 : 0 }}
      >
        {/* Veyl avatar sprite placeholder */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full border-2 border-neon-purple bg-black/50 shadow-neon-purple flex items-center justify-center">
            <span className="text-2xl">🐾</span>
          </div>
        </div>

        {/* Speech bubbles container */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center">
          {mode === "hero" && (
            <div className="px-4 py-2 rounded-lg bg-black/60 border border-neon-purple text-sm font-terminal text-neon-purple animate-veyl-enter">
              ⚡ Building...
            </div>
          )}
          {mode === "idle" && (
            <div className="px-4 py-2 rounded-lg bg-black/60 border border-neon-purple/50 text-xs font-terminal text-muted-foreground animate-veyl-enter">
              Veyl Stage Active
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
