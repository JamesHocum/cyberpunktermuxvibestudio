import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText, FileDown, Presentation, BookOpen, Rocket, DollarSign } from "lucide-react";

type Doc = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  files: { label: string; href: string; ext: string }[];
};

const DOCS: Doc[] = [
  {
    title: "Project README",
    description:
      "Full technical manual: architecture, install steps, Generate/Refactor modes, and the Complete Runnable Build Contract.",
    icon: BookOpen,
    files: [{ label: "Download README", href: "/docs/03_README.md", ext: "MD" }],
  },
  {
    title: "Product One-Pager",
    description:
      "Executive summary — platform, flagship features, uniqueness, and ideal customer. Perfect for quick share-outs.",
    icon: FileText,
    files: [{ label: "Download One-Pager", href: "/docs/04_one_pager.md", ext: "MD" }],
  },
  {
    title: "Live Demo Script",
    description:
      "5–10 minute walkthrough from Generate → Preview → Refactor → Export. Use for investor demos and webinars.",
    icon: Rocket,
    files: [
      { label: "Markdown", href: "/docs/01_demo_script.md", ext: "MD" },
      { label: "PDF", href: "/docs/01_demo_script.pdf", ext: "PDF" },
    ],
  },
  {
    title: "Investor Pitch Deck",
    description:
      "14-slide on-brand investor deck with traction placeholders, monetization strategy, and roadmap.",
    icon: Presentation,
    files: [
      { label: "PDF", href: "/docs/05_pitch_deck.pdf", ext: "PDF" },
      { label: "PPTX (editable)", href: "/docs/05_pitch_deck.pptx", ext: "PPTX" },
    ],
  },
  {
    title: "Monetization Roadmap",
    description:
      "4-phase plan: Stripe activation, signed native builds (Win/Mac/Mobile), Enterprise SSO (SAML/SCIM), Marketplace revenue.",
    icon: DollarSign,
    files: [{ label: "Download Plan", href: "/docs/02_monetization_plan.md", ext: "MD" }],
  },
];

export default function Docs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-studio-bg text-matrix-green font-terminal">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black to-cyan-900/10 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 neon-green hover:neon-glow gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold neon-green mb-3 tracking-tight">
            Documentation & Downloads
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Everything you need to understand, demo, pitch, and ship Cyberpunk Termux Codex IDE.
            All assets are on-brand and ready to share.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {DOCS.map((doc) => {
            const Icon = doc.icon;
            return (
              <Card
                key={doc.title}
                className="cyber-border bg-card/60 backdrop-blur p-6 hover:neon-glow transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="rounded-lg p-2 bg-primary/10 border border-primary/30">
                    <Icon className="h-6 w-6 neon-green" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      {doc.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {doc.files.map((f) => (
                    <a
                      key={f.href}
                      href={f.href}
                      download
                      className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded border border-primary/40 hover:border-primary hover:bg-primary/10 transition-colors neon-green"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      {f.label}
                      <span className="opacity-60">.{f.ext.toLowerCase()}</span>
                    </a>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground font-mono">
          <p>All documents are kept in sync with the latest build.</p>
        </footer>
      </div>
    </div>
  );
}
