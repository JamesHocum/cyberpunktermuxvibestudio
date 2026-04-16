import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  ShieldCheck, Eye, EyeOff, Copy, Download, Trash2, ArrowLeft,
  FileText, Mail, CreditCard, Phone, MapPin, Hash, Fingerprint,
  Scan, RotateCcw, Zap, Lock, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Redaction Engine ───

interface RedactionRule {
  id: string;
  label: string;
  icon: React.ReactNode;
  pattern: RegExp;
  replacement: string;
  enabled: boolean;
  count: number;
}

const DEFAULT_RULES: Omit<RedactionRule, 'count'>[] = [
  { id: 'email', label: 'Email Addresses', icon: <Mail className="h-4 w-4" />, pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]', enabled: true },
  { id: 'phone', label: 'Phone Numbers', icon: <Phone className="h-4 w-4" />, pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, replacement: '[PHONE_REDACTED]', enabled: true },
  { id: 'ssn', label: 'SSN / National ID', icon: <Fingerprint className="h-4 w-4" />, pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, replacement: '[SSN_REDACTED]', enabled: true },
  { id: 'creditcard', label: 'Credit Card Numbers', icon: <CreditCard className="h-4 w-4" />, pattern: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g, replacement: '[CC_REDACTED]', enabled: true },
  { id: 'ipv4', label: 'IPv4 Addresses', icon: <Hash className="h-4 w-4" />, pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, replacement: '[IP_REDACTED]', enabled: true },
  { id: 'address', label: 'Street Addresses', icon: <MapPin className="h-4 w-4" />, pattern: /\b\d{1,5}\s+[\w\s]{2,30}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\b\.?/gi, replacement: '[ADDRESS_REDACTED]', enabled: false },
];

function applyRedactions(text: string, rules: RedactionRule[]): { result: string; counts: Record<string, number> } {
  let result = text;
  const counts: Record<string, number> = {};
  for (const rule of rules) {
    if (!rule.enabled) { counts[rule.id] = 0; continue; }
    const matches = result.match(rule.pattern);
    counts[rule.id] = matches ? matches.length : 0;
    result = result.replace(rule.pattern, rule.replacement);
  }
  return { result, counts };
}

// ─── Custom Keyword Redactor ───

function redactKeywords(text: string, keywords: string[]): { result: string; count: number } {
  let result = text;
  let count = 0;
  for (const kw of keywords) {
    if (!kw.trim()) continue;
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = result.match(regex);
    if (matches) count += matches.length;
    result = result.replace(regex, '[CUSTOM_REDACTED]');
  }
  return { result, count };
}

// ─── Main Component ───

const SyntheticRedactKit = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState(SAMPLE_TEXT);
  const [redactedText, setRedactedText] = useState('');
  const [rules, setRules] = useState<RedactionRule[]>(
    DEFAULT_RULES.map(r => ({ ...r, count: 0 }))
  );
  const [customKeywords, setCustomKeywords] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalRedactions, setTotalRedactions] = useState(0);
  const [customRedactions, setCustomRedactions] = useState(0);
  const [hasProcessed, setHasProcessed] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleRedact = useCallback(() => {
    if (!inputText.trim()) { toast.error('No input text to redact'); return; }
    setIsProcessing(true);

    // Simulate processing delay for UX feel
    setTimeout(() => {
      const { result: step1, counts } = applyRedactions(inputText, rules);
      const keywords = customKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const { result: final, count: kwCount } = redactKeywords(step1, keywords);

      const updatedRules = rules.map(r => ({ ...r, count: counts[r.id] || 0 }));
      setRules(updatedRules);
      setRedactedText(final);
      setCustomRedactions(kwCount);
      const total = Object.values(counts).reduce((a, b) => a + b, 0) + kwCount;
      setTotalRedactions(total);
      setHasProcessed(true);
      setIsProcessing(false);
      toast.success(`Redaction complete — ${total} item${total !== 1 ? 's' : ''} redacted`);
    }, 400);
  }, [inputText, rules, customKeywords]);

  const handleCopy = () => {
    navigator.clipboard.writeText(redactedText);
    toast.success('Redacted text copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([redactedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redacted-output.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Redacted file downloaded');
  };

  const handleClear = () => {
    setInputText('');
    setRedactedText('');
    setTotalRedactions(0);
    setCustomRedactions(0);
    setHasProcessed(false);
    setRules(prev => prev.map(r => ({ ...r, count: 0 })));
  };

  const enabledCount = rules.filter(r => r.enabled).length;
  const confidenceScore = hasProcessed ? Math.min(100, Math.round((enabledCount / rules.length) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(var(--neon-purple)/0.06)] via-background to-[hsl(var(--neon-green)/0.04)]" />
      <div className="fixed inset-0 animate-scanlines pointer-events-none opacity-20" />

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/40 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-foreground">Synthetic Redact Kit</h1>
                <p className="text-[11px] text-muted-foreground font-mono">PII & Sensitive Data Redaction Engine</p>
              </div>
            </div>
          </div>
          {hasProcessed && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
                <Lock className="h-3 w-3 mr-1" />{totalRedactions} redacted
              </Badge>
              <Badge
                variant="outline"
                className={`font-mono text-xs ${confidenceScore >= 80 ? 'border-primary/40 text-primary' : confidenceScore >= 50 ? 'border-yellow-500/40 text-yellow-400' : 'border-destructive/40 text-destructive'}`}
              >
                {confidenceScore}% coverage
              </Badge>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Rules Panel */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Scan className="h-4 w-4 text-primary" />Redaction Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={rule.enabled ? 'text-primary' : 'text-muted-foreground/50'}>{rule.icon}</span>
                        <Label className="text-xs font-mono cursor-pointer truncate" htmlFor={rule.id}>{rule.label}</Label>
                        {rule.count > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">{rule.count}</Badge>
                        )}
                      </div>
                      <Switch id={rule.id} checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} className="scale-75" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-secondary" />Custom Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="e.g. Acme Corp, John Doe"
                    value={customKeywords}
                    onChange={e => setCustomKeywords(e.target.value)}
                    className="bg-input border-border text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2">Comma-separated. Case-insensitive.</p>
                  {customRedactions > 0 && (
                    <Badge variant="outline" className="mt-2 text-[10px] border-secondary/40 text-secondary">
                      {customRedactions} custom match{customRedactions !== 1 ? 'es' : ''}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {hasProcessed && (
                <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />Coverage Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={confidenceScore} className="h-2 mb-2" />
                    <p className="text-[10px] text-muted-foreground">
                      {enabledCount}/{rules.length} rule categories active.
                      {confidenceScore < 80 && ' Enable more rules for better coverage.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Editor Panels */}
            <div className="lg:col-span-9 space-y-4">
              {/* Action Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button onClick={handleRedact} disabled={isProcessing || !inputText.trim()} className="neon-green font-mono text-xs">
                  {isProcessing ? (
                    <><Scan className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4 mr-2" />Redact Now</>
                  )}
                </Button>
                {hasProcessed && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="font-mono text-xs">
                      <Copy className="h-3.5 w-3.5 mr-1.5" />Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} className="font-mono text-xs">
                      <Download className="h-3.5 w-3.5 mr-1.5" />Download
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowOriginal(!showOriginal)} className="font-mono text-xs">
                      {showOriginal ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                      {showOriginal ? 'Hide' : 'Show'} Original
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleClear} className="font-mono text-xs ml-auto text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset
                </Button>
              </div>

              <Tabs defaultValue="input">
                <TabsList className="bg-card/60 border border-border/40">
                  <TabsTrigger value="input" className="font-mono text-xs"><FileText className="h-3.5 w-3.5 mr-1.5" />Input</TabsTrigger>
                  <TabsTrigger value="output" className="font-mono text-xs" disabled={!hasProcessed}>
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />Redacted Output
                  </TabsTrigger>
                  {showOriginal && (
                    <TabsTrigger value="compare" className="font-mono text-xs">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />Side by Side
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="input">
                  <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <Textarea
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="Paste text containing sensitive data here..."
                        className="min-h-[400px] bg-input border-border font-mono text-sm leading-relaxed resize-y"
                      />
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                        <span>{inputText.length.toLocaleString()} characters</span>
                        <span>{inputText.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="output">
                  <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <Textarea
                        ref={outputRef}
                        value={redactedText}
                        readOnly
                        className="min-h-[400px] bg-input border-border font-mono text-sm leading-relaxed resize-y"
                      />
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                        <span>{totalRedactions} total redaction{totalRedactions !== 1 ? 's' : ''} applied</span>
                        <span>{redactedText.length.toLocaleString()} characters</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {showOriginal && (
                  <TabsContent value="compare">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-destructive" />Original (SENSITIVE)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Textarea value={inputText} readOnly className="min-h-[350px] bg-destructive/5 border-destructive/20 font-mono text-xs leading-relaxed" />
                        </CardContent>
                      </Card>
                      <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3 text-primary" />Redacted (SAFE)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Textarea value={redactedText} readOnly className="min-h-[350px] bg-primary/5 border-primary/20 font-mono text-xs leading-relaxed" />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// ─── Sample Seed Data ───

const SAMPLE_TEXT = `CONFIDENTIAL — Employee Onboarding Record

Name: Sarah J. Mitchell
Email: sarah.mitchell@acmecorp.com
Phone: +1 (415) 555-0192
SSN: 287-65-4321
Address: 742 Evergreen Terrace, Springfield IL 62704

Emergency Contact: James Mitchell — james.m@gmail.com — (312) 555-8834

Payment Info:
  Corporate Card: 4532-1234-5678-9012
  Expense Card:   5500 0000 1234 5678

IT Setup:
  Workstation IP: 192.168.1.42
  VPN Gateway:    10.0.0.1
  Badge ID:       EMP-2024-0847

Notes:
Sarah will be joining the Quantum Research division on March 15.
Her manager, Dr. Alan Voss (alan.voss@acmecorp.com), has approved
remote work from 1580 Market Street, San Francisco CA 94102.
Please ensure her access credentials are provisioned by EOD Friday.
Contact IT support at helpdesk@acmecorp.com or call 1-800-555-0199.
`;

export default SyntheticRedactKit;
