import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit, createRateLimitHeaders } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  action: z.enum(['push', 'pull', 'commit', 'status', 'list-repos', 'set-repo']).optional(),
  projectId: z.string().uuid('Invalid project ID format').max(36).optional(),
  message: z.string().max(500).optional(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string()
  })).optional(),
  repo: z.string().optional(),
  branch: z.string().optional(),
});

// Encode content to base64 for GitHub API
const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

// Decode base64 content from GitHub API
const decodeBase64 = (str: string): string => {
  return decodeURIComponent(escape(atob(str)));
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
    const { action = 'push', projectId, message, files, repo, branch } = requestSchema.parse(body);

    // Get user's GitHub token via service role (tokens not exposed to client)
    const serviceClientForToken = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const { data: profile, error: profileError } = await serviceClientForToken
      .from('profiles')
      .select('github_access_token, github_username')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const githubToken = profile?.github_access_token;
    const githubUsername = profile?.github_username;

    console.log(`[Git Sync] Action: ${action}, User: ${user.id}, GitHub: ${githubUsername || 'not connected'}`);

    // Service client for updates
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    switch (action) {
      case 'status': {
        // Return git status
        if (!projectId) {
          return new Response(
            JSON.stringify({ error: 'Project ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: project } = await supabaseClient
          .from('projects')
          .select('github_repo, github_branch, last_synced_at')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        return new Response(
          JSON.stringify({
            connected: !!githubToken,
            username: githubUsername,
            repo: project?.github_repo,
            branch: project?.github_branch || 'main',
            lastSynced: project?.last_synced_at,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-repos': {
        if (!githubToken) {
          return new Response(
            JSON.stringify({ error: 'GitHub not connected', repos: [] }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch user's repos from GitHub
        const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!reposResponse.ok) {
          throw new Error('Failed to fetch repositories');
        }

        const repos = await reposResponse.json();
        
        return new Response(
          JSON.stringify({
            repos: repos.map((r: any) => ({
              name: r.name,
              full_name: r.full_name,
              html_url: r.html_url,
              default_branch: r.default_branch,
            }))
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'set-repo': {
        if (!projectId || !repo) {
          return new Response(
            JSON.stringify({ error: 'Project ID and repo required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await serviceClient
          .from('projects')
          .update({
            github_repo: repo,
            github_branch: branch || 'main',
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ success: true, repo, branch: branch || 'main' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'push': {
        if (!projectId) {
          return new Response(
            JSON.stringify({ error: 'Project ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get project details
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

        // If no GitHub token or repo, just update sync timestamp
        if (!githubToken || !project.github_repo) {
          const { error: updateError } = await serviceClient
            .from('projects')
            .update({
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', projectId);

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({
              success: true,
              simulated: true,
              message: 'Sync recorded (GitHub not connected)',
              synced_at: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Real GitHub push
        const [owner, repoName] = project.github_repo.split('/');
        const targetBranch = project.github_branch || 'main';
        const commitMessage = message || `Sync from Matrix DevStudio - ${new Date().toISOString()}`;

        // Get the current commit SHA
        const refResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${targetBranch}`,
          {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        let baseSha: string;
        
        if (refResponse.ok) {
          const refData = await refResponse.json();
          baseSha = refData.object.sha;
        } else if (refResponse.status === 404) {
          // Branch doesn't exist, create it
          const defaultRefResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/main`,
            {
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );
          
          if (!defaultRefResponse.ok) {
            throw new Error('Could not find default branch');
          }
          
          const defaultRef = await defaultRefResponse.json();
          baseSha = defaultRef.object.sha;
        } else {
          throw new Error('Failed to get branch reference');
        }

        // Get the base tree
        const commitResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/commits/${baseSha}`,
          {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!commitResponse.ok) {
          throw new Error('Failed to get base commit');
        }

        const commitData = await commitResponse.json();
        const baseTreeSha = commitData.tree.sha;

        // Get files to push
        let filesToPush = files;
        if (!filesToPush || filesToPush.length === 0) {
          const { data: projectFiles } = await supabaseClient
            .from('project_files')
            .select('path, content')
            .eq('project_id', projectId)
            .eq('is_folder', false);

          filesToPush = projectFiles || [];
        }

        // Create blobs for each file
        const treeItems = await Promise.all(
          filesToPush.map(async (file: { path: string; content: string }) => {
            const blobResponse = await fetch(
              `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content: encodeBase64(file.content || ''),
                  encoding: 'base64',
                }),
              }
            );

            if (!blobResponse.ok) {
              console.error('Failed to create blob for', file.path);
              return null;
            }

            const blobData = await blobResponse.json();
            return {
              path: file.path,
              mode: '100644',
              type: 'blob',
              sha: blobData.sha,
            };
          })
        );

        const validTreeItems = treeItems.filter(item => item !== null);

        // Create new tree
        const treeResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              base_tree: baseTreeSha,
              tree: validTreeItems,
            }),
          }
        );

        if (!treeResponse.ok) {
          throw new Error('Failed to create tree');
        }

        const treeData = await treeResponse.json();

        // Create commit
        const newCommitResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: commitMessage,
              tree: treeData.sha,
              parents: [baseSha],
            }),
          }
        );

        if (!newCommitResponse.ok) {
          throw new Error('Failed to create commit');
        }

        const newCommitData = await newCommitResponse.json();

        // Update branch reference
        const updateRefResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${targetBranch}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sha: newCommitData.sha,
              force: false,
            }),
          }
        );

        if (!updateRefResponse.ok) {
          // Try to create the branch if it doesn't exist
          await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ref: `refs/heads/${targetBranch}`,
                sha: newCommitData.sha,
              }),
            }
          );
        }

        // Update sync timestamp
        await serviceClient
          .from('projects')
          .update({
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);

        console.log(`[Git Sync] Push successful: ${validTreeItems.length} files to ${owner}/${repoName}`);

        return new Response(
          JSON.stringify({
            success: true,
            commit_sha: newCommitData.sha,
            files_pushed: validTreeItems.length,
            commit_message: commitMessage,
            synced_at: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'pull': {
        if (!projectId) {
          return new Response(
            JSON.stringify({ error: 'Project ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: project } = await supabaseClient
          .from('projects')
          .select('github_repo, github_branch')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (!project?.github_repo || !githubToken) {
          return new Response(
            JSON.stringify({ error: 'GitHub not connected or no repo set' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const [owner, repoName] = project.github_repo.split('/');
        const targetBranch = project.github_branch || 'main';

        // Get the tree
        const treeResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/trees/${targetBranch}?recursive=1`,
          {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!treeResponse.ok) {
          throw new Error('Failed to get repository tree');
        }

        const treeData = await treeResponse.json();
        
        // Get file contents
        const files = await Promise.all(
          treeData.tree
            .filter((item: any) => item.type === 'blob')
            .slice(0, 100) // Limit to 100 files
            .map(async (item: any) => {
              const blobResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/git/blobs/${item.sha}`,
                {
                  headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                  },
                }
              );

              if (!blobResponse.ok) return null;

              const blobData = await blobResponse.json();
              
              try {
                return {
                  path: item.path,
                  content: decodeBase64(blobData.content.replace(/\n/g, '')),
                };
              } catch {
                return { path: item.path, content: '' };
              }
            })
        );

        const validFiles = files.filter(f => f !== null);

        // Update sync timestamp
        await serviceClient
          .from('projects')
          .update({
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);

        console.log(`[Git Sync] Pull successful: ${validFiles.length} files from ${owner}/${repoName}`);

        return new Response(
          JSON.stringify({
            success: true,
            files: validFiles,
            files_pulled: validFiles.length,
            synced_at: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'commit': {
        // Same as push for now
        return new Response(
          JSON.stringify({ error: 'Use push action for commits' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('[Git Sync] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to sync project. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
