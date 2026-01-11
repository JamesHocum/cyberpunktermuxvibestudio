import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  action: z.enum(['authorize', 'callback', 'status', 'disconnect']),
  code: z.string().optional(),
  redirectUri: z.string().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GITHUB_CLIENT_ID = Deno.env.get('GITHUB_CLIENT_ID');
    const GITHUB_CLIENT_SECRET = Deno.env.get('GITHUB_CLIENT_SECRET');

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ 
          error: 'GitHub OAuth not configured',
          setup_required: true 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, code, redirectUri } = requestSchema.parse(body);

    console.log(`[GitHub OAuth] Action: ${action} for user: ${user.id}`);

    // Service client for updating profiles
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    switch (action) {
      case 'authorize': {
        // Generate OAuth URL
        const state = crypto.randomUUID();
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri || '')}&scope=repo,user&state=${state}`;
        
        return new Response(
          JSON.stringify({ url: authUrl, state }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'callback': {
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Authorization code required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error('[GitHub OAuth] Token error:', tokenData.error);
          return new Response(
            JSON.stringify({ error: tokenData.error_description || 'Failed to get access token' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const accessToken = tokenData.access_token;

        // Get GitHub user info
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        const githubUser = await userResponse.json();

        // Upsert profile with GitHub token
        const { error: updateError } = await serviceClient
          .from('profiles')
          .upsert({
            id: user.id,
            github_access_token: accessToken,
            github_username: githubUser.login,
            avatar_url: githubUser.avatar_url,
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          console.error('[GitHub OAuth] Profile update error:', updateError);
          throw updateError;
        }

        console.log(`[GitHub OAuth] Successfully connected: ${githubUser.login}`);

        return new Response(
          JSON.stringify({ 
            success: true,
            username: githubUser.login,
            avatar_url: githubUser.avatar_url,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'status': {
        // Check if user has GitHub connected
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('github_username, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        return new Response(
          JSON.stringify({ 
            connected: !!profile?.github_username,
            username: profile?.github_username || null,
            avatar_url: profile?.avatar_url || null,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        // Remove GitHub connection
        const { error: updateError } = await serviceClient
          .from('profiles')
          .update({
            github_access_token: null,
            github_username: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        console.log(`[GitHub OAuth] Disconnected for user: ${user.id}`);

        return new Response(
          JSON.stringify({ success: true, disconnected: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('[GitHub OAuth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'GitHub OAuth failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
