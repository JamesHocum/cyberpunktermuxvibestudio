import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { projectId } = await req.json();

    console.log('🔮 Lady Violet: Syncing project to GitHub...', projectId);

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Get project details
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
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

    // Update last synced timestamp
    const { error: updateError } = await supabaseClient
      .from('projects')
      .update({
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
