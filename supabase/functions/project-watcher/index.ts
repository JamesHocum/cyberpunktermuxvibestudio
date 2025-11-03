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

    console.log('🔮 Lady Violet: Scanning for new projects for user:', user.id);
    
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Find pending projects that haven't been auto-initialized (only user's own projects)
    const { data: pendingProjects, error: fetchError } = await serviceClient
      .from('projects')
      .select('*')
      .eq('status', 'pending')
      .eq('auto_initialized', false)
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching pending projects:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingProjects?.length || 0} pending projects`);

    // Auto-initialize each pending project
    for (const project of pendingProjects || []) {
      console.log(`Initializing project: ${project.name} (${project.id})`);

      // Update project status
      const { error: updateError } = await serviceClient
        .from('projects')
        .update({
          status: 'initialized',
          auto_initialized: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`Failed to initialize ${project.name}:`, updateError);
        continue;
      }

      // Create initial file tree if it doesn't exist
      const { data: existingTree } = await serviceClient
        .from('file_tree')
        .select('*')
        .eq('project_id', project.id)
        .maybeSingle();

      if (!existingTree) {
        const defaultTree = {
          name: project.name,
          type: 'folder',
          children: [
            {
              name: 'src',
              type: 'folder',
              children: [
                { name: 'App.tsx', type: 'file', extension: 'tsx' },
                { name: 'main.tsx', type: 'file', extension: 'tsx' },
                { name: 'index.css', type: 'file', extension: 'css' }
              ]
            },
            { name: 'README.md', type: 'file', extension: 'md' }
          ]
        };

        await serviceClient
          .from('file_tree')
          .insert({
            project_id: project.id,
            tree_structure: defaultTree,
            user_id: project.user_id
          });
      }

      console.log(`✅ Project ${project.name} initialized successfully`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        initialized: pendingProjects?.length || 0,
        message: `Lady Violet initialized ${pendingProjects?.length || 0} projects`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Project watcher error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
