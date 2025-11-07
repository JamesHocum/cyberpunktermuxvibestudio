import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Code2, Sparkles, GitBranch, Terminal } from "lucide-react";
import cityGlow from "@/assets/city-glow.png";
import Particles from "@/components/Particles";
import TypingEffect from "@/components/TypingEffect";

const Landing = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/studio");
      }
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/studio");
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (session) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Cyberpunk Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-center">
        {/* Background Layers */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${cityGlow})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
        <div className="absolute inset-0 animate-scanlines pointer-events-none" />
        <Particles />
        
        {/* Main Content */}
        <div className="relative z-10 px-4">
          {/* Brand Logo */}
          <div className="flex justify-center mb-8 animate-fadeIn">
            <img 
              src="/favicon.png" 
              alt="Cyberpunk Termux Logo" 
              className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_25px_rgba(139,92,246,0.8)] animate-pulse"
            />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-cyber font-extrabold tracking-wider mb-6" style={{
            color: '#7c3aed',
            textShadow: '0 0 10px #22c55e, 0 0 20px #22c55e, 0 0 30px #22c55e',
            WebkitTextStroke: '2px #22c55e'
          }}>
            CYBERPUNK TERMUX
          </h1>
          <TypingEffect 
            text="The Chill Spot for Code Rebels and Future Builders"
            speed={80}
            className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" 
            style={{
              color: '#22c55e',
              textShadow: '0 0 10px #22c55e, 0 0 20px #22c55e',
              WebkitTextStroke: '1px #22c55e'
            }}
          />
          <p className="text-sm md:text-base animate-fadeIn mb-10 max-w-xl mx-auto" style={{ 
            animationDelay: '0.2s',
            color: '#22c55e',
            textShadow: '0 0 10px #22c55e, 0 0 20px #22c55e, 0 0 30px #22c55e',
            fontWeight: '500'
          }}>
            AI-Powered Development Studio with Autonomous Workflow Intelligence
          </p>
          <div className="flex gap-4 justify-center animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" onClick={() => navigate("/auth")} className="bg-neon-purple hover:bg-neon-purple/80 text-white shadow-neon-purple">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 bg-gradient-to-b from-black to-background">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          <div className="p-6 rounded-lg border bg-card">
            <Code2 className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Code Editor</h3>
            <p className="text-sm text-muted-foreground">
              Full-featured code editor with syntax highlighting and intelligence
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <Sparkles className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Lady Violet AI helps with code generation, debugging, and architecture
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <GitBranch className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Git Integration</h3>
            <p className="text-sm text-muted-foreground">
              Seamless GitHub sync with automated commits and deployments
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <Terminal className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Terminal & Testing</h3>
            <p className="text-sm text-muted-foreground">
              Built-in terminal and automated testing suite for rapid development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
