import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center space-y-6">
        <img
          src="/termux-logo.jpg"
          alt="Cyberpunk Termux"
          className="logo-glow w-32 h-32 animate-pulse rounded-full"
        />
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-cyber font-bold neon-purple">
            CYBERPUNK TERMUX
          </h1>
          <p className="text-lg font-terminal neon-green flicker">
            &lt;INITIALIZING DEVSTUDIO_MATRIX.EXE /&gt;
          </p>
        </div>
        <div className="flex space-x-1 mt-4">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" style={{ animationDelay: "200ms" }}></div>
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" style={{ animationDelay: "400ms" }}></div>
        </div>
      </div>
    </div>
  );
};
