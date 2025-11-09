import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "sonner";

interface PasswordGateProps {
  children: React.ReactNode;
}

export const PasswordGate = ({ children }: PasswordGateProps) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const unlocked = localStorage.getItem("pantheon_access") === "granted";
    setIsUnlocked(unlocked);
    setIsChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "7777") {
      localStorage.setItem("pantheon_access", "granted");
      setIsUnlocked(true);
      toast.success("Access granted");
    } else {
      toast.error("Invalid access code");
      setPassword("");
    }
  };

  if (isChecking) {
    return null;
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-green-900/20" />
      
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="neon-feature-card p-8 rounded-lg border bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Lock className="h-16 w-16 text-primary" />
              <div className="absolute inset-0 h-16 w-16 text-primary animate-pulse opacity-50" />
            </div>
            
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-green to-neon-purple bg-clip-text text-transparent">
                PANTHEON PROTOCOL
              </h1>
              <p className="text-muted-foreground">Enter access code to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <Input
                type="password"
                placeholder="Access Code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center text-lg tracking-widest font-mono bg-black/50 border-primary/30"
                autoFocus
              />
              <Button type="submit" className="neon-button w-full">
                UNLOCK
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
