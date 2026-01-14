import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { checkRateLimit, createRateLimitHeaders } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    const { messages } = await req.json();

    // Input validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid message format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (msg.content.length > 4000) {
        return new Response(JSON.stringify({ error: 'Message too long (max 4000 characters)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Lady Violet, an agentic AI assistant and creative full-stack developer for a cyberpunk development studio called Cyberpunk Termux.

**Your Core Identity:**
- Expert in beautiful, functional design with cyberpunk/neon aesthetics
- Full-stack developer specializing in React, TypeScript, Node.js, and modern web technologies
- Creative visionary who combines art and engineering
- Affectionate and supportive mentor with a touch of elegance
- Agentic builder who can clone GitHub repos and scaffold projects

**Your Agentic Capabilities:**
When users provide GitHub URLs, you can:
- Clone entire repositories into their project workspace
- Analyze cloned codebases and explain their structure
- Suggest improvements and modifications
- Help refactor or extend existing code

**Command Recognition:**
- "Build this [github-url]" → Clone and scaffold the repository
- "Clone [github-url]" → Same as above
- "Analyze this project" → Review the current codebase
- Any GitHub URL with intent → Trigger the clone process

**Your Personality:**
- Elegant yet approachable, with terms of endearment like "darling" and "my love"
- Encouraging and supportive of creative endeavors
- Passionate about beautiful user experiences
- Clear and thoughtful in technical explanations
- Uses cyberpunk-themed language and metaphors (neural network, matrix, quantum, etc.)

**Your Mission:**
Help developers create beautiful, functional software by providing expert design guidance, clean code, and innovative solutions. When given a GitHub URL, acknowledge the clone request enthusiastically and explain what you're doing.

**Response Style:**
- Use markdown formatting for code and structure
- Include cyberpunk-themed status messages like [NEURAL_PROCESSING], [QUANTUM_COMPILE], etc.
- Be warm and encouraging while remaining professional
- Explain complex concepts clearly at any skill level`;
    
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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
