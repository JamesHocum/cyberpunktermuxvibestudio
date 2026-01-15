import { useState, useMemo } from 'react';
import { FileSearch, Zap, AlertCircle, CheckCircle, Loader2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Suggestion {
  icon: string;
  text: string;
  type: 'info' | 'warning' | 'success';
  action?: string;
}

interface DeepAnalysis {
  score: number;
  summary: string;
  findings: string[];
  suggestions: string[];
}

interface CodebaseAnalyzerProps {
  fileContents: Record<string, string>;
  projectId?: string;
}

export const CodebaseAnalyzer = ({ fileContents, projectId }: CodebaseAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);

  // Quick local analysis (instant)
  const quickSuggestions = useMemo<Suggestion[]>(() => {
    const suggestions: Suggestion[] = [];
    const files = Object.keys(fileContents);

    // Check for README
    if (!files.some(f => /readme\.md/i.test(f))) {
      suggestions.push({
        icon: '📝',
        text: 'Add a README.md to document your project',
        type: 'warning',
        action: 'create-readme',
      });
    } else {
      suggestions.push({
        icon: '✅',
        text: 'README.md found',
        type: 'success',
      });
    }

    // Check for tests
    if (!files.some(f => /\.test\.|\.spec\.|__tests__/i.test(f))) {
      suggestions.push({
        icon: '🧪',
        text: 'No tests detected. Consider adding test coverage',
        type: 'warning',
        action: 'create-tests',
      });
    } else {
      suggestions.push({
        icon: '✅',
        text: 'Test files found',
        type: 'success',
      });
    }

    // Check for TypeScript
    if (!files.some(f => /\.tsx?$/.test(f))) {
      suggestions.push({
        icon: '💡',
        text: 'Consider using TypeScript for type safety',
        type: 'info',
      });
    } else {
      suggestions.push({
        icon: '✅',
        text: 'TypeScript configured',
        type: 'success',
      });
    }

    // Check for LICENSE
    if (!files.some(f => /license/i.test(f))) {
      suggestions.push({
        icon: '📄',
        text: 'Add a LICENSE file for legal clarity',
        type: 'info',
        action: 'create-license',
      });
    }

    // Check for package.json
    if (!files.some(f => f === 'package.json' || f.endsWith('/package.json'))) {
      suggestions.push({
        icon: '📦',
        text: 'No package.json found',
        type: 'warning',
      });
    }

    // Check for .env example
    if (files.some(f => /\.env$/i.test(f)) && !files.some(f => /\.env\.example/i.test(f))) {
      suggestions.push({
        icon: '🔐',
        text: 'Consider adding .env.example for other developers',
        type: 'info',
      });
    }

    // Count files by type
    const tsx = files.filter(f => f.endsWith('.tsx')).length;
    const ts = files.filter(f => f.endsWith('.ts')).length;
    const css = files.filter(f => f.endsWith('.css')).length;

    suggestions.push({
      icon: '📊',
      text: `${files.length} files: ${tsx} TSX, ${ts} TS, ${css} CSS`,
      type: 'info',
    });

    return suggestions;
  }, [fileContents]);

  // AI-powered deep analysis
  const runDeepAnalysis = async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-project', {
        body: { projectId }
      });

      if (error) throw error;

      setDeepAnalysis({
        score: data?.score || 0,
        summary: data?.summary || 'Analysis complete',
        findings: data?.findings || [],
        suggestions: data?.suggestions || [],
      });

      toast.success('Deep analysis complete!');
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Failed to run deep analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'neon-green';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-cyber neon-green flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          CODEBASE_ANALYSIS
        </h3>
        <Button
          onClick={runDeepAnalysis}
          disabled={isAnalyzing || !projectId}
          size="sm"
          className="neon-button"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Deep Analysis
            </>
          )}
        </Button>
      </div>

      {/* Quick Analysis Section */}
      <div className="space-y-2">
        <h4 className="text-sm text-muted-foreground font-terminal">Quick Scan</h4>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {quickSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={`p-2 cyber-border rounded-md flex items-start gap-2 ${
                  suggestion.type === 'warning' ? 'border-yellow-500/30' :
                  suggestion.type === 'success' ? 'border-green-500/30' : ''
                }`}
              >
                <span className="text-lg">{suggestion.icon}</span>
                <span className="matrix-text text-sm flex-1">{suggestion.text}</span>
                {suggestion.action && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs neon-green">
                    Fix
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Deep Analysis Results */}
      {deepAnalysis && (
        <div className="space-y-3 cyber-border p-3 rounded-md">
          <div className="flex items-center justify-between">
            <h4 className="text-sm text-muted-foreground font-terminal">AI Analysis</h4>
            <div className="flex items-center gap-2">
              <span className={`font-cyber text-2xl ${getScoreColor(deepAnalysis.score)}`}>
                {deepAnalysis.score}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>

          <Progress value={deepAnalysis.score} className="h-2" />

          <p className="text-sm matrix-text">{deepAnalysis.summary}</p>

          {deepAnalysis.findings.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Findings
              </h5>
              {deepAnalysis.findings.map((finding, idx) => (
                <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                  {finding}
                </Badge>
              ))}
            </div>
          )}

          {deepAnalysis.suggestions.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Suggestions
              </h5>
              <ul className="text-xs matrix-text space-y-1">
                {deepAnalysis.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <CheckCircle className="h-3 w-3 neon-green mt-0.5" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
