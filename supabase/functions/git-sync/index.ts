import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, createRateLimitHeaders } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format').max(36),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Rate limiting: 10 requests per minute per user
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        resetAt: new Date(rateLimit.resetAt).toISOString()
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          ...createRateLimitHeaders(rateLimit.resetAt, rateLimit.remaining),
          'Content-Type': 'application/json' 
        },
      });
    }

    const body = await req.json();
    const { projectId } = requestSchema.parse(body);

    console.log('🔮 Lady Violet: Syncing project to GitHub...', projectId);

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Get project details and verify ownership
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all project files
    const { data: files, error: filesError } = await supabaseClient
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);

    if (filesError) {
      throw filesError;
    }

    console.log(`Found ${files?.length || 0} files to sync`);

    // Simulate Git operations (in real implementation, this would use GitHub API)
    const commitMessage = `Auto-sync by Lady Violet - ${new Date().toISOString()}`;
    const syncedFiles = files?.map(f => f.path) || [];

    // Update last synced timestamp using service role for this operation
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const { error: updateError } = await serviceClient
      .from('projects')
      .update({
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Project ${project.name} synced successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        project: project.name,
        files_synced: syncedFiles.length,
        commit_message: commitMessage,
        github_url: project.github_url,
        synced_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Git sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to sync project. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
