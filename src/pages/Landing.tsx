import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Terminal, Cpu, Zap, Package, Timer, Puzzle, Palette, GitBranch,
  Code2, Rocket, Shield, Globe, ChevronDown, ArrowRight, Sparkles,
  Monitor, Smartphone, Chrome, Layout, Brain, Layers
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Native Build Toolchain",
    desc: "Lady Violet (GPT-5.2) doesn't just autocomplete — she generates complete deployable artifacts. Build Mode autonomously scaffolds full-stack apps from natural language.",
    glow: "hsl(var(--neon-purple))",
  },
  {
    icon: Package,
    title: "10 Universal Export Targets",
    desc: "PWA, Windows .exe, Linux AppImage, macOS DMG, Android APK, iOS IPA, Chrome Extension, IDE Extension, Web Deploy, ZIP — all from one codebase.",
    glow: "hsl(var(--neon-cyan))",
  },
  {
    icon: Timer,
    title: "Productivity Metrics",
    desc: "Unique 'Thought For' and 'Worked For' timers track brainstorming vs active coding time. Session & lifetime stats with per-project persistence.",
    glow: "hsl(var(--neon-green))",
  },
  {
    icon: Puzzle,
    title: "28 Flagship Extensions",
    desc: "Git Lens, Regex Lab, API Builder, CRT Filter, Ambient Soundscapes, Hacker Typer, ASCII Art Generator — and the IDE can build extensions for itself.",
    glow: "hsl(var(--neon-purple))",
  },
  {
    icon: Palette,
    title: "8 Cyberpunk Themes",
    desc: "Matrix, Cyber, Vaporwave, Noir, Hacker Green, Synthwave, Blood Moon, Ghost in Shell — each with full Monaco syntax highlighting.",
    glow: "hsl(var(--neon-cyan))",
  },
  {
    icon: Layers,
    title: "Fullstack Stack Profiles",
    desc: "Choose Supabase Fullstack, SQLite Self-hosted, or Frontend Only. AI auto-wires schemas, auth, RLS policies, and edge functions for your stack.",
    glow: "hsl(var(--neon-green))",
  },
  {
    icon: Terminal,
    title: "AI-Integrated Terminal",
    desc: "Multi-shell terminal with built-in AI commands: ai code, ai refactor, ai explain, ai debug. Natural language fallback for unknown commands.",
    glow: "hsl(var(--neon-purple))",
  },
  {
    icon: GitBranch,
    title: "Git & GitHub Integration",
    desc: "OAuth GitHub connection, repo selector, commit/push via edge functions, branch switching, sync status, and natural language repo cloning.",
    glow: "hsl(var(--neon-cyan))",
  },
  {
    icon: Shield,
    title: "Codebase Analyzer",
    desc: "Quick Scan checks README, tests, TypeScript config, licenses. Deep Analysis gives AI-powered quality scores with actionable suggestions.",
    glow: "hsl(var(--neon-green))",
  },
];

const PLATFORMS = [
  { icon: Globe, label: "Web PWA" },
  { icon: Monitor, label: "Desktop" },
  { icon: Smartphone, label: "Mobile" },
  { icon: Chrome, label: "Extensions" },
];

const COMPARISONS = [
  { vs: "VS Code", edge: "Zero-install, AI-powered builds, cyberpunk aesthetic" },
  { vs: "Cursor / Windsurf", edge: "Web-first, timer metrics, extension ecosystem, 8 themes" },
  { vs: "GitHub Codespaces", edge: "No cloud compute costs, runs in browser, AI-native" },
  { vs: "CodePen / JSFiddle", edge: "Full project management, AI assistant, multi-target exports" },
  { vs: "Replit", edge: "Persona-driven AI, universal packaging, self-extending IDE" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${className}`}>
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/ide", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--neon-purple)/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--neon-green)/0.08),transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[hsl(var(--neon-green)/0.5)] to-transparent" />
      </div>

      {/* ====== STICKY NAV ====== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-md border-b border-border/40 shadow-lg shadow-[hsl(var(--neon-green)/0.05)]" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icons/termux-cyberpunk-48.png"
              alt="Cyberpunk Termux Codex"
              className="w-9 h-9 rounded-full shadow-neon-green"
            />
            <span className="font-cyber font-bold text-lg tracking-wider bg-gradient-to-r from-[hsl(var(--neon-green))] to-[hsl(var(--neon-cyan))] bg-clip-text text-transparent hidden sm:inline">
              CYBERPUNK TERMUX
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-terminal text-muted-foreground hover:text-[hsl(var(--neon-green))] transition-colors hidden sm:inline"
            >
              Features
            </button>
            <button
              onClick={() => document.getElementById("special")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-terminal text-muted-foreground hover:text-[hsl(var(--neon-cyan))] transition-colors hidden sm:inline"
            >
              Why Us
            </button>
            <button
              onClick={() => document.getElementById("compare")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm font-terminal text-muted-foreground hover:text-[hsl(var(--neon-purple))] transition-colors hidden sm:inline"
            >
              Compare
            </button>
            <Button
              size="sm"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-[hsl(var(--neon-green))] to-[hsl(var(--neon-cyan))] text-background font-cyber shadow-neon-green hover:shadow-cyber transition-shadow"
            >
              <Rocket className="mr-1.5 h-4 w-4" /> Enter
            </Button>
          </div>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-16">
        <div className="animate-veyl-breathe mb-6">
          <img
            src="/icons/termux-cyberpunk-256.png"
            alt="Cyberpunk Termux Codex"
            className="w-36 h-36 md:w-44 md:h-44 rounded-full shadow-neon-green ring-2 ring-[hsl(var(--neon-green)/0.3)] ring-offset-4 ring-offset-background"
          />
        </div>
        <h1 className="text-5xl md:text-7xl font-cyber font-bold tracking-wider mb-4">
          <span className="bg-gradient-to-r from-[hsl(var(--neon-green))] via-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-purple))] bg-clip-text text-transparent">
            CYBERPUNK TERMUX
          </span>
        </h1>
        <p className="text-xs md:text-sm font-cyber tracking-[0.3em] text-[hsl(var(--neon-green)/0.7)] uppercase mb-2">
          C O D E X &nbsp; I D E
        </p>
        <p className="text-lg md:text-2xl font-terminal text-muted-foreground max-w-2xl mb-2">
          The Zero-Install, AI-Native Development Environment
        </p>
        <p className="text-sm md:text-base text-muted-foreground/70 max-w-xl mb-10 font-terminal">
          Where AI is the build toolchain — not a plugin. From idea to executable in the browser.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-[hsl(var(--neon-green))] to-[hsl(var(--neon-cyan))] text-background font-cyber text-base px-8 shadow-neon-green hover:shadow-cyber transition-shadow"
          >
            <Rocket className="mr-2 h-5 w-5" /> Enter the Matrix
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="border-[hsl(var(--neon-purple)/0.5)] text-[hsl(var(--neon-purple))] hover:bg-[hsl(var(--neon-purple)/0.1)] font-cyber text-base px-8"
          >
            <ChevronDown className="mr-2 h-5 w-5" /> Explore Features
          </Button>
        </div>

        {/* Platform badges */}
        <div className="flex gap-6 opacity-60">
          {PLATFORMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-xs font-terminal text-muted-foreground">
              <Icon className="h-5 w-5" />
              {label}
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground/40" />
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 py-24">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-cyber font-bold mb-4">
            <Sparkles className="inline h-8 w-8 mr-2 text-[hsl(var(--neon-green))]" />
            Flagship Features
          </h2>
          <p className="text-muted-foreground font-terminal max-w-xl mx-auto">
            Everything you need to build, deploy, and ship — without leaving the browser.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <AnimatedSection key={f.title}>
              <div
                className="group relative rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 h-full hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_var(--feat-glow)]"
                style={{ "--feat-glow": f.glow } as React.CSSProperties}
              >
                <div
                  className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg"
                  style={{ background: `${f.glow}20`, color: f.glow }}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-cyber font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ====== WHAT MAKES IT SPECIAL ====== */}
      <section id="special" className="relative z-10 py-24 border-t border-border/30">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-cyber font-bold mb-4">
              <Zap className="inline h-8 w-8 mr-2 text-[hsl(var(--neon-cyan))]" />
              What Makes It Special
            </h2>
          </AnimatedSection>

          <div className="space-y-6">
            {[
              { icon: Cpu, text: "AI as Build Toolchain — Not just autocomplete; the AI generates complete deployable artifacts" },
              { icon: Package, text: "Universal Deployment — 10 export targets from a single codebase" },
              { icon: Timer, text: "Productivity Metrics — Thought/Worked timers for workflow analysis" },
              { icon: Globe, text: "Zero-Install Philosophy — Full IDE in browser, works offline as PWA" },
              { icon: Palette, text: "Cyberpunk Aesthetic — Consistent thematic experience across all UI" },
              { icon: Puzzle, text: "Self-Extending — Can build extensions that extend the IDE itself" },
              { icon: Layers, text: "Auto-Wiring Fullstack — AI knows your stack and generates backend code automatically" },
              { icon: Layout, text: "Completed Builds Dashboard — Track and re-download any previous build" },
            ].map((item, i) => (
              <AnimatedSection key={i}>
                <div className="flex items-start gap-4 p-4 rounded-lg border border-border/30 bg-card/40 hover:bg-card/60 transition-colors">
                  <div className="mt-0.5 p-2 rounded-md bg-[hsl(var(--neon-green)/0.1)]">
                    <item.icon className="h-5 w-5 text-[hsl(var(--neon-green))]" />
                  </div>
                  <p className="text-foreground font-terminal text-sm md:text-base">{item.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== COMPETITIVE COMPARISON ====== */}
      <section className="relative z-10 py-24 border-t border-border/30">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-cyber font-bold mb-4">
              <Code2 className="inline h-8 w-8 mr-2 text-[hsl(var(--neon-purple))]" />
              How It Stacks Up
            </h2>
          </AnimatedSection>

          <div className="space-y-4">
            {COMPARISONS.map((c, i) => (
              <AnimatedSection key={c.vs}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg border border-border/30 bg-card/40">
                  <span className="shrink-0 px-3 py-1 rounded-full text-xs font-cyber font-bold border border-[hsl(var(--neon-purple)/0.5)] text-[hsl(var(--neon-purple))]">
                    vs {c.vs}
                  </span>
                  <span className="text-sm text-muted-foreground font-terminal">{c.edge}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="relative z-10 py-32 text-center px-4">
        <AnimatedSection>
          <h2 className="text-3xl md:text-5xl font-cyber font-bold mb-6">
            Ready to <span className="text-[hsl(var(--neon-green))]">jack in</span>?
          </h2>
          <p className="text-muted-foreground font-terminal mb-10 max-w-lg mx-auto">
            Zero install. Zero config. Just build.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-[hsl(var(--neon-green))] to-[hsl(var(--neon-cyan))] text-background font-cyber text-lg px-12 py-6 shadow-neon-green hover:shadow-cyber transition-shadow"
          >
            Launch Codex <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8 text-center">
        <p className="text-xs text-muted-foreground/50 font-terminal">
          CYBERPUNK TERMUX CODEX — AI-Native Development Environment — {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
