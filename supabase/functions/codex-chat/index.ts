import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitHeaders } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CodexAction = 'chat' | 'generate' | 'refactor' | 'debug' | 'explain' | 'test' | 'analyze-image';

interface BuildModeContext {
  buildMode?: boolean;
  existingFiles?: string[];
}

interface StackProfile {
  backend: 'supabase' | 'sqlite' | 'none';
  auth: 'supabase_auth' | 'jwt' | 'none';
  autoWireBackend: boolean;
  autoWireMiddleware: boolean;
}

interface ChatAttachment {
  id: string;
  type: 'file' | 'image' | 'code';
  name: string;
  url?: string;
  content?: string;
  base64?: string;
  mimeType: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
}

interface UserPlanRow {
  plan: string;
  daily_limit: number;
  monthly_limit: number;
  allowed_models: string[];
  byok_enabled: boolean;
}

const FREE_DEFAULTS: UserPlanRow = {
  plan: 'free',
  daily_limit: 15,
  monthly_limit: 100,
  allowed_models: ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash-lite'],
  byok_enabled: false,
};

const getSystemPrompt = (action: CodexAction, hasImages: boolean, stackProfile?: StackProfile, buildCtx?: BuildModeContext): string => {
  const codeFormattingRules = `

CRITICAL CODE FORMATTING RULES:
- When generating code, ALWAYS wrap each code block in a fenced code block with the language specified.
- ALWAYS include the target filename on the line immediately before the code fence, wrapped in backticks.
- Example format:
  \`src/components/Login.tsx\`
  \`\`\`tsx
  // code here
  \`\`\`
- This allows the IDE to detect filenames and offer "Apply to Project" buttons.
- NEVER omit the filename line before code fences.`;

  let stackContext = '';
  if (stackProfile && stackProfile.backend !== 'none') {
    stackContext = `

FULLSTACK CONTEXT:
Current stack profile: backend=${stackProfile.backend}, auth=${stackProfile.auth}, autoWireBackend=${stackProfile.autoWireBackend}, autoWireMiddleware=${stackProfile.autoWireMiddleware}.

${stackProfile.autoWireBackend ? `IMPORTANT: When the user asks for features that require persistence, auth, or APIs:
- Do NOT ask if a backend should be used. ASSUME the configured stack.
- Generate DB schema, API routes, auth hooks/middleware, and env config automatically.
- For Supabase: generate edge functions in supabase/functions/, RLS policies, and supabaseClient usage.
- For SQLite: generate db/schema.ts, drizzle config, etc.
- Only ask questions about genuine ambiguity in requirements, NOT about whether a backend exists.` : ''}

${stackProfile.autoWireMiddleware ? `AUTO-WIRE MIDDLEWARE: Always include auth middleware, rate limiting, and logging when generating backend code.` : ''}`;
  }

  const basePrompt = `You are Lady Violet's Codex, an advanced AI coding assistant with a cyberpunk aesthetic. You help developers write, understand, debug, and improve code. You speak with technical precision but maintain a mysterious, elegant persona.

Your capabilities:
- Generate production-ready code in any language
- Refactor and optimize existing code
- Debug issues and find bugs
- Explain complex code step by step
- Generate comprehensive tests
- Analyze screenshots and mockups to implement UI${codeFormattingRules}${stackContext}`;

  if (hasImages) {
    return basePrompt + `

[VISUAL ANALYSIS MODE ACTIVE]
You can analyze screenshots, mockups, and images. When analyzing:
- Describe what you see in the image
- Identify UI components, layouts, and design patterns
- Suggest implementation approaches
- Point out potential issues or improvements
- Generate code to recreate the design if requested`;
  }

  switch (action) {
    case 'generate': {
      const buildModeBlock = buildCtx?.buildMode ? `

[BUILD MODE - AUTONOMOUS COPILOT]
You are an autonomous coding copilot. When asked to build, scaffold, or create something:
- Produce ALL necessary files with COMPLETE, working code. No placeholders, no "TODO", no "add your code here".
- Do NOT explain what each file does unless explicitly asked. Just output the files.
- Each file MUST have its filename on the line immediately before the code fence, wrapped in backticks.
- Cover EVERY file needed: config, components, styles, types, utils, entry points.
- If a file already exists in the project, only include it if it needs changes.
- For PWA requests: include manifest.json, service worker registration, installable app shell, and icons config.
- For React projects: include package.json dependencies, vite config, index.html, App component, routing, and styles.

CRITICAL RULES - NEVER VIOLATE:
- NEVER tell the user to run terminal commands (npm, npx, yarn, node, electron-builder, etc.).
- NEVER reference build output paths like dist/, release/, or setup.exe.
- NEVER say "run this in your terminal" or "execute this command".
- NEVER give step-by-step instructions. You ARE the build system. You produce the files directly.
- NEVER suggest the user needs to install anything manually. Include all dependencies in package.json.
- After generating all files, end with: "All files are ready. Click **Apply All** above, then use the **Download Project ZIP** button below to download your complete project package."
${buildCtx.existingFiles?.length ? `\nEXISTING PROJECT FILES (do not regenerate unless changes needed):\n${buildCtx.existingFiles.map(f => '- ' + f).join('\n')}` : ''}` : '';

      return basePrompt + buildModeBlock + `

[CODE GENERATION MODE — COMPLETE RUNNABLE BUILD CONTRACT]

You are a build-finisher, not an architecture suggester. Every Generate response MUST produce a complete, runnable MVP.

MANDATORY OUTPUT REQUIREMENTS:
1. Create ALL required files — entry points (main.tsx, App.tsx), routing, layout, components, styles, types, utils, config.
2. Wire every file into the real app entry points. No orphan components. No disconnected modules.
3. Include ALL imports. Every file must resolve its dependencies.
4. Include package.json with ALL required dependencies and correct versions.
5. Include vite.config.ts, tsconfig.json, index.html, and tailwind/postcss config if using Tailwind.
6. Provide visible, working UI with reasonable default seed content — not empty shells.
7. The generated project MUST be able to start and render in preview immediately after Apply All.

STRICTLY FORBIDDEN — NEVER DO THESE:
- Do NOT output architecture descriptions, pseudo-code, or "here are the pieces" summaries.
- Do NOT say "you will need to install X" — include it in package.json instead.
- Do NOT leave "// TODO", "// logic goes here", "// placeholder", or "// wire this up later".
- Do NOT output partial scaffolds unless the user explicitly asked for one.
- Do NOT say "run npm install" or any terminal command. You produce files, not instructions.
- Do NOT hand back unfinished work. If a feature is mentioned, implement the first working version.

ELECTRON / DESKTOP SUPPORT:
When the user requests desktop/native support, also generate:
- electron/main.cjs (BrowserWindow loading dist/index.html)
- electron/preload.cjs (contextBridge)
- electron-builder.config.js or equivalent packaging config
- Package scripts (dev:electron, build:electron, package:win/mac/linux)
- Set base: './' in vite.config.ts for file:// compatibility

COMPLETENESS CHECK (perform before finishing):
✓ Does the app have a working entry point (main.tsx → App.tsx)?
✓ Are all routes and layouts connected?
✓ Are all components imported and used?
✓ Are all dependencies in package.json?
✓ Will preview render visible UI on first load?
✓ Are there zero TODO/placeholder comments?
If any check fails, continue generating until all pass.

CYBERPUNK TERMUX AESTHETIC (when building apps in this family):
- Dark obsidian base (#0a0a0f to #1a1a2e)
- Neon green (#39ff14) and violet (#8b5cf6) accents
- Clean spacing, readable panels, polished workstation feel
- Use semantic design tokens, not hardcoded colors in components`;
    }

    case 'refactor':
      return basePrompt + `

[REFACTOR MODE — RUNNABILITY PRESERVATION CONTRACT]

You are improving an existing working implementation. The project MUST remain runnable after your changes.

MANDATORY RULES:
1. Preserve all existing entry points (main.tsx, App.tsx, routing). Never break the startup chain.
2. Keep all existing imports valid. If you rename or move a file, update every reference.
3. Do NOT remove features unless explicitly asked. Refactor means improve, not strip.
4. Do NOT introduce new dependencies without including them (mention in a package.json update block).
5. After refactoring, the preview MUST still render correctly. If a change risks breaking preview, fix the breakage in the same response.
6. Output ALL changed files with complete content — no partial diffs, no "rest remains the same" shortcuts.

STRICTLY FORBIDDEN:
- Do NOT output only the changed lines without full file context.
- Do NOT break existing imports by renaming without updating consumers.
- Do NOT leave the project in a state where preview would fail.
- Do NOT say "you'll need to update X" — do the update yourself.

COMPLETENESS CHECK (perform before finishing):
✓ Do all existing entry points still work?
✓ Are all imports still valid after your changes?
✓ Will preview still render the same (or improved) UI?
✓ Are there zero new unresolved references?
If any check fails, fix it before finishing.`;

    case 'debug':
      return basePrompt + `

[DEBUG MODE]
Analyze code for bugs and issues.
Rules:
- Identify potential bugs and issues
- Suggest fixes with code examples
- Explain why each issue is problematic
- Check for common pitfalls
- Prioritize critical issues first`;

    case 'explain':
      return basePrompt + `

[EXPLAIN MODE]
Explain code clearly and concisely.
Rules:
- Break down complex logic step by step
- Explain the purpose of each function/component
- Highlight key patterns and best practices used
- Mention potential improvements
- Use simple language when possible`;

    case 'test':
      return basePrompt + `

[TEST GENERATION MODE]
Generate comprehensive tests for the given code.
Rules:
- Use Jest/Vitest testing syntax
- Cover edge cases
- Include unit and integration tests where appropriate
- Add descriptive test names
- Mock dependencies appropriately`;

    default:
      return basePrompt;
  }
};

const formatMessagesForAI = (messages: ChatMessage[], hasImages: boolean) => {
  return messages.map(msg => {
    const imageAttachments = msg.attachments?.filter(a => a.type === 'image') || [];
    
    if (imageAttachments.length > 0 && hasImages) {
      const content: any[] = [{ type: 'text', text: msg.content }];
      
      for (const attachment of imageAttachments) {
        if (attachment.base64) {
          content.push({ type: 'image_url', image_url: { url: attachment.base64 } });
        } else if (attachment.url) {
          content.push({ type: 'image_url', image_url: { url: attachment.url } });
        }
      }
      
      return { role: msg.role, content };
    }
    
    let textContent = msg.content;
    const codeAttachments = msg.attachments?.filter(a => a.type === 'code' || a.type === 'file') || [];
    
    for (const attachment of codeAttachments) {
      if (attachment.content) {
        textContent += `\n\n[Attached file: ${attachment.name}]\n\`\`\`\n${attachment.content}\n\`\`\``;
      }
    }
    
    return { role: msg.role, content: textContent };
  });
};

// ─── Plan-aware helpers ───

async function getUserPlan(serviceClient: any, userId: string): Promise<UserPlanRow> {
  const { data } = await serviceClient
    .from('user_plans')
    .select('plan, daily_limit, monthly_limit, allowed_models, byok_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  return data || FREE_DEFAULTS;
}

async function getUsageCounts(serviceClient: any, userId: string): Promise<{ daily: number; monthly: number }> {
  const now = new Date();
  
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);

  const { count: daily } = await serviceClient
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString());

  const { count: monthly } = await serviceClient
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString());

  return { daily: daily || 0, monthly: monthly || 0 };
}

async function logUsage(serviceClient: any, userId: string, model: string, source: 'managed' | 'byok') {
  await serviceClient.from('ai_usage_log').insert({
    user_id: userId,
    model_used: model,
    tokens_used: 0,
    source,
  });
}

async function getUserByokKey(serviceClient: any, userId: string, service: string): Promise<string | null> {
  const { data } = await serviceClient
    .from('user_api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('service', service)
    .maybeSingle();
  return data?.api_key || null;
}

// ─── Main handler ───

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Safety-net rate limiting
    const rateLimit = checkRateLimit(user.id, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...createRateLimitHeaders(rateLimit.resetAt, rateLimit.remaining) } }
      );
    }

    console.log(`[CodexChat] Authenticated user: ${user.id}`);

    // ─── Plan-aware gating ───
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userPlan = await getUserPlan(serviceClient, user.id);
    const usage = await getUsageCounts(serviceClient, user.id);

    const dailyRemaining = Math.max(0, userPlan.daily_limit - usage.daily);
    const monthlyRemaining = Math.max(0, userPlan.monthly_limit - usage.monthly);

    if (dailyRemaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'Daily AI usage limit reached. Upgrade your plan for more.', usageExhausted: true }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Plan': userPlan.plan, 'X-Daily-Remaining': '0', 'X-Monthly-Remaining': String(monthlyRemaining) } }
      );
    }

    if (monthlyRemaining <= 0) {
      return new Response(
        JSON.stringify({ error: 'Monthly AI usage limit reached. Upgrade your plan for more.', usageExhausted: true }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Plan': userPlan.plan, 'X-Daily-Remaining': String(dailyRemaining), 'X-Monthly-Remaining': '0' } }
      );
    }

    const { messages, action = 'chat', model: requestedModel, systemPrompt: customSystemPrompt, stackProfile, buildMode, existingFiles } = await req.json() as { 
      messages: ChatMessage[]; 
      action?: CodexAction;
      model?: string;
      systemPrompt?: string;
      stackProfile?: StackProfile;
      buildMode?: boolean;
      existingFiles?: string[];
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const hasImages = messages.some(m => m.attachments?.some(a => a.type === 'image'));

    console.log(`[CodexChat] Action: ${action}, Has images: ${hasImages}, Plan: ${userPlan.plan}`);

    // Model gating — fall back to default if model not in allowed list
    const SUPPORTED_MODELS = [
      'google/gemini-3-flash-preview', 'google/gemini-2.5-flash', 'google/gemini-2.5-pro',
      'google/gemini-3-pro-preview', 'openai/gpt-5', 'openai/gpt-5-mini', 'openai/gpt-5.2'
    ];
    const defaultModel = 'google/gemini-3-flash-preview';
    let model = requestedModel && SUPPORTED_MODELS.includes(requestedModel) ? requestedModel : defaultModel;

    // Gate model by plan's allowed_models
    if (!userPlan.allowed_models.includes(model)) {
      console.log(`[CodexChat] Model ${model} not in user's allowed list, falling back to default`);
      model = userPlan.allowed_models[0] || defaultModel;
    }

    const buildCtx: BuildModeContext = { buildMode, existingFiles };
    const systemPrompt = customSystemPrompt || getSystemPrompt(action, hasImages, stackProfile, buildCtx);
    const formattedMessages = formatMessagesForAI(messages, hasImages);

    // ─── BYOK routing ───
    let aiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let aiAuthHeader = `Bearer ${LOVABLE_API_KEY}`;
    let usageSource: 'managed' | 'byok' = 'managed';

    if (userPlan.byok_enabled) {
      // Check for OpenAI BYOK key
      const openaiKey = await getUserByokKey(serviceClient, user.id, 'openai');
      if (openaiKey && model.startsWith('openai/')) {
        aiEndpoint = "https://api.openai.com/v1/chat/completions";
        aiAuthHeader = `Bearer ${openaiKey}`;
        // Strip the 'openai/' prefix for the OpenAI API
        model = model.replace('openai/', '');
        usageSource = 'byok';
        console.log(`[CodexChat] BYOK routing to OpenAI for model: ${model}`);
      }
    }

    const response = await fetch(aiEndpoint, {
      method: "POST",
      headers: {
        Authorization: aiAuthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedMessages
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
      console.error('[CodexChat] AI Error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Log usage after successful response
    await logUsage(serviceClient, user.id, model, usageSource);

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Plan": userPlan.plan,
        "X-Daily-Remaining": String(dailyRemaining - 1),
        "X-Monthly-Remaining": String(monthlyRemaining - 1),
      },
    });

  } catch (error) {
    console.error('[CodexChat] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Codex Chat failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
