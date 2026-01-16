import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function GitHubCallback() {
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [message, setMessage] = useState('Processing GitHub authorization...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(urlParams.get('error_description') || 'Authorization denied');
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        // Verify state
        const savedState = sessionStorage.getItem('github_oauth_state');
        if (state !== savedState) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        sessionStorage.removeItem('github_oauth_state');

        setMessage('Exchanging authorization code...');

        // Exchange code for token
        const redirectUri = `${window.location.origin}/github/callback`;
        const { data, error: callbackError } = await supabase.functions.invoke('github-oauth', {
          body: { 
            action: 'callback',
            code,
            redirectUri
          }
        });

        if (callbackError) throw callbackError;

        setStatus('success');
        setMessage(`Connected as ${data.username}!`);

        // Close popup after a short delay
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            window.location.href = '/';
          }
        }, 1500);

      } catch (err) {
        console.error('[GitHub Callback] Error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Authorization failed');
        
        // Close popup after showing error
        setTimeout(() => {
          if (window.opener) {
            window.close();
          }
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-studio-bg flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      
      <div className="relative z-10 text-center p-8 max-w-md">
        <div className="mb-6">
          {status === 'processing' && (
            <Loader2 className="h-16 w-16 text-purple-500 animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          )}
          {status === 'error' && (
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          )}
        </div>
        
        <h1 className="text-2xl font-cyber mb-4">
          {status === 'processing' && <span className="neon-purple">Connecting to GitHub...</span>}
          {status === 'success' && <span className="neon-green">Connection Successful!</span>}
          {status === 'error' && <span className="text-red-400">Connection Failed</span>}
        </h1>
        
        <p className="text-muted-foreground font-terminal">
          {message}
        </p>
        
        {status === 'success' && (
          <p className="text-xs text-muted-foreground mt-4 font-terminal">
            This window will close automatically...
          </p>
        )}
        
        {status === 'error' && (
          <button 
            onClick={() => window.close()}
            className="mt-6 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-terminal"
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  );
}
