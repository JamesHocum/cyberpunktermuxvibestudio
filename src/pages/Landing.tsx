import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Code2, Sparkles, GitBranch, Terminal } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            DEVSTUDIO_MATRIX.EXE
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            AI-Powered Development Studio with Autonomous Workflow Intelligence
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
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
