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

    console.log('🔮 Lady Violet: Analyzing project...', projectId);

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    // Get project and files
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    const { data: files, error: filesError } = await supabaseClient
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);

    if (filesError) {
      throw filesError;
    }

    console.log(`Analyzing ${files?.length || 0} files...`);

    // Prepare content for AI analysis
    const codeFiles = files?.filter(f => !f.is_folder && f.content) || [];
    const filesSummary = codeFiles.map(f => ({
      path: f.path,
      type: f.file_type,
      size: f.content?.length || 0
    }));

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const analysisPrompt = `Analyze this project structure and provide insights:
    
Project: ${project.name}
Description: ${project.description || 'No description'}
Total Files: ${codeFiles.length}

File Structure:
${filesSummary.map(f => `- ${f.path} (${f.type}, ${f.size} chars)`).join('\n')}

Provide analysis in JSON format with:
1. "findings": Array of issues or patterns found
2. "suggestions": Array of improvement recommendations
3. "score": Overall code quality score (0-100)
4. "summary": Brief summary of the project`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are Lady Violet, an expert code analyst. Provide concise, actionable insights in JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_project",
              description: "Analyze project code and structure",
              parameters: {
                type: "object",
                properties: {
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        severity: { type: "string", enum: ["info", "warning", "error"] },
                        message: { type: "string" },
                        file: { type: "string" }
                      },
                      required: ["type", "severity", "message"],
                      additionalProperties: false
                    }
                  },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] }
                      },
                      required: ["category", "title", "description", "priority"],
                      additionalProperties: false
                    }
                  },
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  summary: { type: "string" }
                },
                required: ["findings", "suggestions", "score", "summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_project" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI analysis failed:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const analysis = toolCall ? JSON.parse(toolCall.function.arguments) : {
      findings: [],
      suggestions: [{ category: "general", title: "Analysis unavailable", description: "Could not analyze project", priority: "low" }],
      score: 50,
      summary: "Analysis could not be completed"
    };

    // Store analysis in database
    const { error: insertError } = await supabaseClient
      .from('project_analysis')
      .insert({
        project_id: projectId,
        analysis_type: 'ai_review',
        findings: analysis.findings,
        suggestions: analysis.suggestions,
        score: analysis.score
      });

    if (insertError) {
      console.error('Failed to store analysis:', insertError);
    }

    console.log(`✅ Analysis complete. Score: ${analysis.score}/100`);

    return new Response(
      JSON.stringify({
        success: true,
        project: project.name,
        analysis: {
          ...analysis,
          analyzed_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Project analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
