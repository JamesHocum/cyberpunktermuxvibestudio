import { useState, useEffect } from "react";

interface TypingEffectProps {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
}

export default function TypingEffect({ 
  text, 
  speed = 80, 
  className = "",
  showCursor = true 
}: TypingEffectProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text, speed]);

  return (
    <p className={className}>
      {displayedText}
      {showCursor && !isComplete && (
        <span className="inline-block w-2 h-5 ml-1 bg-neon-cyan animate-pulse" />
      )}
    </p>
  );
}
