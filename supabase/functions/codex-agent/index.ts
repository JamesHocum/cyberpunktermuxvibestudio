import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitHeaders } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply rate limiting per user
    const rateLimit = checkRateLimit(user.id, { maxRequests: 20, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            ...createRateLimitHeaders(rateLimit.resetAt, rateLimit.remaining)
          } 
        }
      );
    }

    console.log(`[CodexAgent] Authenticated user: ${user.id}`);

    const { action, prompt, code, language, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`[CodexAgent] Action: ${action}`);

    // Build system prompt based on action
    let systemPrompt = '';
    let userPrompt = prompt;

    switch (action) {
      case 'generate':
        systemPrompt = `You are an expert code generator. Generate clean, production-ready code based on the user's description.
        
Rules:
- Write complete, working code
- Include necessary imports
- Add helpful comments
- Follow best practices for ${language || 'TypeScript/React'}
- Return ONLY the code, no explanations unless asked`;
        break;

      case 'refactor':
        systemPrompt = `You are an expert code refactoring assistant. Improve the given code while maintaining its functionality.

Rules:
- Improve code quality and readability
- Optimize performance where possible
- Add proper error handling
- Follow ${language || 'TypeScript'} best practices
- Explain changes briefly after the code`;
        userPrompt = `Refactor this code:\n\`\`\`${language || 'typescript'}\n${code}\n\`\`\`\n\nRequirements: ${prompt || 'General improvements'}`;
        break;

      case 'explain':
        systemPrompt = `You are a code explanation expert. Explain code clearly and concisely.

Rules:
- Break down complex logic step by step
- Explain the purpose of each function/component
- Highlight key patterns and best practices used
- Mention potential improvements`;
        userPrompt = `Explain this code:\n\`\`\`${language || 'typescript'}\n${code}\n\`\`\``;
        break;

      case 'debug':
        systemPrompt = `You are an expert debugger. Analyze code for bugs and issues.

Rules:
- Identify potential bugs and issues
- Suggest fixes with code examples
- Explain why each issue is problematic
- Check for common pitfalls`;
        userPrompt = `Debug this code:\n\`\`\`${language || 'typescript'}\n${code}\n\`\`\`\n\nIssue description: ${prompt || 'Find potential bugs'}`;
        break;

      case 'complete':
        systemPrompt = `You are an intelligent code completion assistant. Complete the given partial code.

Rules:
- Complete the code naturally
- Maintain consistent style
- Add proper error handling
- Follow the existing patterns in the code`;
        userPrompt = `Complete this code:\n\`\`\`${language || 'typescript'}\n${code}\n\`\`\``;
        break;

      case 'test':
        systemPrompt = `You are a test generation expert. Generate comprehensive tests for the given code.

Rules:
- Use Jest/Vitest testing syntax
- Cover edge cases
- Include unit and integration tests where appropriate
- Add descriptive test names`;
        userPrompt = `Generate tests for this code:\n\`\`\`${language || 'typescript'}\n${code}\n\`\`\``;
        break;

      default:
        systemPrompt = `You are Lady Violet's Codex Agent, an advanced AI coding assistant. You help with code generation, refactoring, debugging, and explanation.`;
    }

    // Add context if provided
    if (context) {
      systemPrompt += `\n\nProject context:\n${context}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[CodexAgent] AI Error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error('[CodexAgent] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Codex Agent failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
