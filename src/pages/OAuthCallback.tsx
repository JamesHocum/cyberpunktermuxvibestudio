import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Terminal, CheckCircle, XCircle } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the session from the URL hash (Supabase OAuth flow)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth callback error:', error);
          setStatus('error');
          setMessage(error.message || 'Authentication failed');
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        if (data?.session) {
          setStatus('success');
          setMessage('Welcome to the Matrix!');
          setTimeout(() => navigate('/'), 1500);
        } else {
          // No session - check if this is a hash callback from Supabase
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            // Exchange the tokens from URL
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !sessionData.session) {
              setStatus('error');
              setMessage('Failed to establish session');
              setTimeout(() => navigate('/auth'), 3000);
            } else {
              setStatus('success');
              setMessage('Welcome to the Matrix!');
              setTimeout(() => navigate('/'), 1500);
            }
          } else {
            setStatus('error');
            setMessage('No authentication data found');
            setTimeout(() => navigate('/auth'), 3000);
          }
        }
      } catch (err) {
        console.error('OAuth callback exception:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-studio-bg flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      
      <div className="relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${
            status === 'loading' ? 'bg-purple-600/30' :
            status === 'success' ? 'bg-green-600/30' :
            'bg-red-600/30'
          } shadow-[0_0_30px_rgba(168,85,247,0.3)]`}>
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-400" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-400" />
            )}
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {status === 'loading' ? 'Authenticating...' :
           status === 'success' ? 'Access Granted!' :
           'Authentication Failed'}
        </h1>
        
        <p className={`text-lg ${
          status === 'success' ? 'text-green-400' :
          status === 'error' ? 'text-red-400' :
          'text-purple-400'
        }`}>
          {message}
        </p>
        
        {status === 'error' && (
          <p className="text-gray-500 mt-4 text-sm">
            Redirecting to login...
          </p>
        )}
      </div>
    </div>
  );
}
