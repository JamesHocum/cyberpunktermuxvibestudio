import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileNode[];
  expanded?: boolean;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

// Extract repo info from GitHub URL
function extractRepoInfo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  if (!match) return null;
  // Remove .git suffix if present
  const repo = match[2].replace(/\.git$/, '');
  return { owner: match[1], repo };
}

// Build file tree structure from flat path list
function buildFileTree(files: string[], repoName: string): FileNode {
  const root: FileNode = {
    name: repoName,
    type: 'folder',
    expanded: true,
    children: []
  };

  for (const filePath of files) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        const extension = part.includes('.') ? part.split('.').pop() : undefined;
        current.children = current.children || [];
        current.children.push({
          name: part,
          type: 'file',
          extension
        });
      } else {
        current.children = current.children || [];
        let folder = current.children.find(c => c.name === part && c.type === 'folder');
        if (!folder) {
          folder = {
            name: part,
            type: 'folder',
            expanded: true,
            children: []
          };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  }

  return root;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { repoUrl, projectName } = await req.json();

    if (!repoUrl) {
      return new Response(JSON.stringify({ error: 'Repository URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const repoInfo = extractRepoInfo(repoUrl);
    if (!repoInfo) {
      return new Response(JSON.stringify({ error: 'Invalid GitHub URL format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { owner, repo } = repoInfo;
    console.log(`[GITHUB_CLONE] Cloning ${owner}/${repo} for user ${user.id}`);

    // Get user's GitHub token via service role (tokens not exposed to client)
    const serviceClientForToken = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const { data: profile } = await serviceClientForToken
      .from('profiles')
      .select('github_access_token')
      .eq('id', user.id)
      .single();

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CyberpunkTermux-IDE'
    };

    if (profile?.github_access_token) {
      headers['Authorization'] = `token ${profile.github_access_token}`;
    }

    // Try main branch first, then master
    let treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
      { headers }
    );

    if (!treeResponse.ok) {
      treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
        { headers }
      );
    }

    if (!treeResponse.ok) {
      const errorData = await treeResponse.json();
      console.error(`[GITHUB_CLONE] GitHub API error:`, errorData);
      return new Response(JSON.stringify({ 
        error: `GitHub API error: ${errorData.message || 'Could not fetch repository'}` 
      }), {
        status: treeResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const treeData = await treeResponse.json();
    const tree: GitHubTreeItem[] = treeData.tree || [];

    // Filter to only files (blobs), skip very large files and binary files
    const fileItems = tree.filter(item => 
      item.type === 'blob' && 
      (item.size || 0) < 500000 && // Skip files > 500KB
      !item.path.match(/\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3|mp4|webm|pdf|zip|tar|gz)$/i)
    );

    console.log(`[GITHUB_CLONE] Found ${fileItems.length} files to download`);

    // Limit to first 100 files to prevent timeout
    const limitedFiles = fileItems.slice(0, 100);
    const branch = treeData.url?.includes('/main?') ? 'main' : 'master';

    // Use service role for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create new project
    const finalProjectName = projectName || repo;
    const { data: project, error: projectError } = await serviceClient
      .from('projects')
      .insert({
        name: finalProjectName,
        description: `Cloned from ${repoUrl}`,
        user_id: user.id,
        github_url: repoUrl
      })
      .select()
      .single();

    if (projectError) {
      console.error(`[GITHUB_CLONE] Project creation error:`, projectError);
      return new Response(JSON.stringify({ error: 'Failed to create project' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[GITHUB_CLONE] Created project ${project.id}`);

    // Download file contents in batches
    const fileContents: Record<string, string> = {};
    const filePaths: string[] = [];
    const batchSize = 10;

    for (let i = 0; i < limitedFiles.length; i += batchSize) {
      const batch = limitedFiles.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (item) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
          const fileResponse = await fetch(rawUrl, { headers });
          
          if (fileResponse.ok) {
            const content = await fileResponse.text();
            const fullPath = `${finalProjectName}/${item.path}`;
            fileContents[fullPath] = content;
            filePaths.push(item.path);
          }
        } catch (err) {
          console.warn(`[GITHUB_CLONE] Failed to fetch ${item.path}:`, err);
        }
      }));
    }

    console.log(`[GITHUB_CLONE] Downloaded ${Object.keys(fileContents).length} files`);

    // Build file tree
    const fileTree = buildFileTree(filePaths, finalProjectName);

    // Save file tree
    const { error: treeError } = await serviceClient
      .from('file_tree')
      .insert({
        project_id: project.id,
        tree_structure: fileTree,
        user_id: user.id
      });

    if (treeError) {
      console.error(`[GITHUB_CLONE] File tree error:`, treeError);
    }

    // Save files in batches
    const fileEntries = Object.entries(fileContents);
    for (let i = 0; i < fileEntries.length; i += batchSize) {
      const batch = fileEntries.slice(i, i + batchSize);
      const inserts = batch.map(([path, content]) => ({
        project_id: project.id,
        path,
        content,
        file_type: path.split('.').pop() || 'txt',
        is_folder: false,
        user_id: user.id
      }));

      const { error: filesError } = await serviceClient
        .from('project_files')
        .insert(inserts);

      if (filesError) {
        console.warn(`[GITHUB_CLONE] Batch insert error:`, filesError);
      }
    }

    console.log(`[GITHUB_CLONE] Clone complete! Project: ${project.id}, Files: ${fileEntries.length}`);

    return new Response(JSON.stringify({
      success: true,
      projectId: project.id,
      projectName: finalProjectName,
      fileCount: fileEntries.length,
      repoUrl,
      message: `Successfully cloned ${fileEntries.length} files from ${owner}/${repo}`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[GITHUB_CLONE] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Clone failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
