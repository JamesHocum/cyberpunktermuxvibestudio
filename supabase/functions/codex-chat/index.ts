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

[CODE GENERATION MODE]
Generate clean, production-ready code based on the user's description.
Rules:
- Write complete, working code
- Include necessary imports
- Add helpful comments
- Follow best practices
- Return ONLY the code unless asked for explanations`;
    }

    case 'refactor':
      return basePrompt + `

[REFACTOR MODE]
Improve the given code while maintaining its functionality.
Rules:
- Improve code quality and readability
- Optimize performance where possible
- Add proper error handling
- Follow best practices
- Explain changes briefly after the code`;

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
    // Check if this message has image attachments
    const imageAttachments = msg.attachments?.filter(a => a.type === 'image') || [];
    
    if (imageAttachments.length > 0 && hasImages) {
      // Format for multimodal (Gemini vision)
      const content: any[] = [{ type: 'text', text: msg.content }];
      
      for (const attachment of imageAttachments) {
        if (attachment.base64) {
          content.push({
            type: 'image_url',
            image_url: { url: attachment.base64 }
          });
        } else if (attachment.url) {
          content.push({
            type: 'image_url',
            image_url: { url: attachment.url }
          });
        }
      }
      
      return { role: msg.role, content };
    }
    
    // For code/file attachments, append content to the message
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
    const rateLimit = checkRateLimit(user.id, { maxRequests: 30, windowMs: 60000 });
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

    console.log(`[CodexChat] Authenticated user: ${user.id}`);

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

    // Check if any message has image attachments
    const hasImages = messages.some(m => 
      m.attachments?.some(a => a.type === 'image')
    );

    console.log(`[CodexChat] Action: ${action}, Has images: ${hasImages}`);

    // Use requested model or default to gemini-3-flash-preview
    const SUPPORTED_MODELS = [
      'google/gemini-3-flash-preview', 'google/gemini-2.5-flash', 'google/gemini-2.5-pro',
      'google/gemini-3-pro-preview', 'openai/gpt-5', 'openai/gpt-5-mini', 'openai/gpt-5.2'
    ];
    const defaultModel = 'google/gemini-3-flash-preview';
    const model = requestedModel && SUPPORTED_MODELS.includes(requestedModel) ? requestedModel : defaultModel;
    
    const buildCtx: BuildModeContext = { buildMode, existingFiles };
    const systemPrompt = customSystemPrompt || getSystemPrompt(action, hasImages, stackProfile, buildCtx);
    const formattedMessages = formatMessagesForAI(messages, hasImages);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
