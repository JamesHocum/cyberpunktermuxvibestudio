import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, createRateLimitHeaders } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Enforce authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id, { maxRequests: 5, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, ...createRateLimitHeaders(rateLimit.resetAt, rateLimit.remaining) } }
      );
    }

    const { name, description, url, author } = await req.json();

    // Validate required fields with length limits
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Name is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (name.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name too long (max 100 characters)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate URL format and enforce HTTPS
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.protocol !== 'https:') {
        return new Response(
          JSON.stringify({ error: 'Only HTTPS URLs are allowed' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate optional fields length
    if (description && typeof description === 'string' && description.trim().length > 500) {
      return new Response(
        JSON.stringify({ error: 'Description too long (max 500 characters)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (author && typeof author === 'string' && author.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: 'Author name too long (max 100 characters)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from('extensions')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        url: url.trim(),
        author: author?.trim() || null,
        is_approved: false
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to submit extension' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ data, message: 'Extension submitted for review' }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('Function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
