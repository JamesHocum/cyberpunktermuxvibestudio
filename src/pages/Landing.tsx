import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Code2, Sparkles, GitBranch, Terminal } from "lucide-react";
import cityGlow from "@/assets/city-glow.png";
import Particles from "@/components/Particles";
import TypingEffect from "@/components/TypingEffect";
import { PasswordGate } from "@/components/PasswordGate";

const Landing = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Parallax mouse movement effect
  useEffect(() => {
    const haze = document.getElementById('haze-overlay');
    const city = document.querySelector('.cityscape');
    if (!haze || !city) return;

    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5);
      const y = (e.clientY / window.innerHeight - 0.5);

      const hazeTiltX = y * 20;
      const hazeTiltY = x * 20;
      const cityShiftX = x * -15;
      const cityShiftY = y * -10;

      (haze as HTMLElement).style.transform = `rotateX(${hazeTiltX}deg) rotateY(${hazeTiltY}deg)`;
      (city as HTMLElement).style.transform = `translate(${cityShiftX}px, ${cityShiftY}px) scale(1.03)`;
    };

    const reset = () => {
      (haze as HTMLElement).style.transform = 'rotateX(0deg) rotateY(0deg)';
      (city as HTMLElement).style.transform = 'translate(0px, 0px) scale(1)';
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', reset);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', reset);
    };
  }, []);

  // Ambient audio with fade-in on user interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let hasStarted = false;

    const startAudio = () => {
      if (hasStarted) return;
      hasStarted = true;

      audio.volume = 0;
      audio.play().then(() => {
        let vol = 0;
        const fade = setInterval(() => {
          vol += 0.02;
          if (vol >= 0.25) {
            clearInterval(fade);
            audio.volume = 0.25;
          } else {
            audio.volume = vol;
          }
        }, 200);
      }).catch(() => {
        // Silent fail if autoplay is blocked
      });
    };

    const events = ['click', 'keydown', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, startAudio, { once: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, startAudio);
      });
    };
  }, []);

  // Optional: Volume pulse sync with neon glow
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const pulse = setInterval(() => {
      if (audio.volume > 0) {
        const t = Date.now() / 2000;
        const baseVolume = 0.2 + 0.05 * Math.sin(t);
        audio.volume = Math.max(0, Math.min(0.25, baseVolume));
      }
    }, 100);

    return () => clearInterval(pulse);
  }, []);

  if (session) return null;

  return (
    <PasswordGate>
    <div className="min-h-screen bg-black">
      {/* Ambient Audio */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/ambient-hum.mp3" type="audio/mpeg" />
      </audio>

      {/* Cyberpunk Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-center">
        {/* Background Layers */}
        <div className="absolute inset-0">
          <img 
            src={cityGlow} 
            alt="Cyberpunk Cityscape"
            className="cityscape w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
        <div className="absolute inset-0 animate-scanlines pointer-events-none" />
        <Particles />
        
        {/* Haze Overlay */}
        <div className="haze-overlay" id="haze-overlay" />
        
        {/* Main Content */}
        <div className="relative z-10 px-4">
          {/* Brand Logo */}
          <div className="flex justify-center mb-8 animate-fadeIn">
            <div className="logo-container">
              <img 
                src="/termux-logo.jpeg" 
                alt="Cyberpunk Termux Logo" 
                className="w-48 h-auto md:w-64 md:h-auto animate-pulseGlow drop-shadow-[0_0_15px_#00ff88]"
              />
            </div>
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
            <Button size="lg" onClick={() => navigate("/auth")} className="neon-button">
              Get Started
            </Button>
            <Button size="lg" onClick={() => navigate("/auth")} className="neon-button">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 bg-gradient-to-b from-black to-background">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          <div className="neon-feature-card p-6 rounded-lg border bg-card">
            <Code2 className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Code Editor</h3>
            <p className="text-sm text-muted-foreground">
              Full-featured code editor with syntax highlighting and intelligence
            </p>
          </div>

          <div className="neon-feature-card p-6 rounded-lg border bg-card">
            <Sparkles className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Lady Violet AI helps with code generation, debugging, and architecture
            </p>
          </div>

          <div className="neon-feature-card p-6 rounded-lg border bg-card">
            <GitBranch className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Git Integration</h3>
            <p className="text-sm text-muted-foreground">
              Seamless GitHub sync with automated commits and deployments
            </p>
          </div>

          <div className="neon-feature-card p-6 rounded-lg border bg-card">
            <Terminal className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Terminal & Testing</h3>
            <p className="text-sm text-muted-foreground">
              Built-in terminal and automated testing suite for rapid development
            </p>
          </div>
        </div>
      </div>
    </div>
    </PasswordGate>
  );
};

export default Landing;
