import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Zap, Link2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Device-code style OAuth handshake target. The extension generates a `code`
 * via `extension-link/start`, opens the user's browser to `/link-extension?code=...`,
 * and polls until the IDE-authenticated user approves here.
 */
export default function LinkExtension() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const code = useMemo(() => params.get('code')?.trim() || '', [params]);
  const [status, setStatus] = useState<'idle' | 'approving' | 'approved' | 'denied' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate(`/auth?next=/link-extension?code=${encodeURIComponent(code)}`);
  }, [isLoading, isAuthenticated, code, navigate]);

  const decide = async (approve: boolean) => {
    if (!code) return;
    setStatus('approving');
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('extension-link', {
        body: { action: approve ? 'approve' : 'deny', code },
      });
      if (error) throw error;
      if ((data as any)?.ok) {
        setStatus(approve ? 'approved' : 'denied');
        toast.success(approve ? 'Extension linked' : 'Request denied');
      } else {
        throw new Error((data as any)?.error || 'Unexpected response');
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message || 'Link failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-matrix-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full p-6 space-y-5 cyber-border bg-studio-terminal/60">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-matrix-green" />
          <h1 className="text-lg font-semibold text-matrix-green tracking-wide">
            LINK BROWSER EXTENSION
          </h1>
        </div>

        {!code ? (
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4" /> Missing or invalid link code.
          </div>
        ) : status === 'approved' ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-matrix-green">
              <ShieldCheck className="h-5 w-5" /> Extension linked.
            </div>
            <p className="text-muted-foreground">
              You can close this tab. The extension will pick up the session within a few seconds.
            </p>
          </div>
        ) : status === 'denied' ? (
          <p className="text-sm text-muted-foreground">Request denied. The extension will not be linked.</p>
        ) : (
          <>
            <div className="space-y-2 text-sm text-foreground/90">
              <p>The Cyberpunk Termux browser extension is requesting access to:</p>
              <ul className="space-y-1.5 pl-4">
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-matrix-green" /> Send selections &amp; prompts from your AI tabs into this IDE
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-matrix-green" /> Receive IDE responses back to the originating page
                </li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                Code <span className="font-mono text-matrix-green">{code}</span>
              </p>
            </div>

            {errorMsg && (
              <div className="text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" /> {errorMsg}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-matrix-green/20 hover:bg-matrix-green/30 text-matrix-green border border-matrix-green/40"
                disabled={status === 'approving'}
                onClick={() => decide(true)}
              >
                {status === 'approving' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                disabled={status === 'approving'}
                onClick={() => decide(false)}
              >
                Deny
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
