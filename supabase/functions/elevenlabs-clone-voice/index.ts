import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get ElevenLabs API key (user-specific or system)
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let elevenLabsKey = '';
    const { data: userKey } = await adminClient
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('service', 'elevenlabs')
      .maybeSingle();

    elevenLabsKey = userKey?.api_key || Deno.env.get('ELEVENLABS_API_KEY') || '';

    if (!elevenLabsKey) {
      return new Response(JSON.stringify({ error: 'No ElevenLabs API key configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const audioFile = formData.get('audio') as File;

    if (!name || !audioFile) {
      return new Response(JSON.stringify({ error: 'Name and audio file are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Audio file must be under 10MB' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call ElevenLabs Add Voice API (Instant Voice Cloning)
    const cloneFormData = new FormData();
    cloneFormData.append('name', name);
    cloneFormData.append('files', audioFile, audioFile.name);
    cloneFormData.append('description', `Custom voice created by user ${user.id}`);

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
      },
      body: cloneFormData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('ElevenLabs clone error:', errData);
      const msg = errData?.detail?.message || errData?.detail || 'Voice cloning failed';
      return new Response(JSON.stringify({ error: msg }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();

    return new Response(JSON.stringify({ voice_id: result.voice_id, name }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Voice clone error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
