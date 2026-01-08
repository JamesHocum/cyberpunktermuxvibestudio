import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  task: z.enum(['text-generation', 'image-generation', 'embeddings', 'summarization', 'code-generation']),
  model: z.string().optional(),
  inputs: z.string(),
  parameters: z.record(z.any()).optional()
});

// Default models for different tasks
const defaultModels: Record<string, string> = {
  'text-generation': 'mistralai/Mistral-7B-Instruct-v0.2',
  'image-generation': 'stabilityai/stable-diffusion-xl-base-1.0',
  'embeddings': 'sentence-transformers/all-MiniLM-L6-v2',
  'summarization': 'facebook/bart-large-cnn',
  'code-generation': 'codellama/CodeLlama-7b-hf'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get HuggingFace token
    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!hfToken) {
      return new Response(
        JSON.stringify({ 
          error: 'HuggingFace access token not configured',
          setup_required: true 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { task, model, inputs, parameters } = requestSchema.parse(body);

    const selectedModel = model || defaultModels[task];
    console.log(`[HuggingFace] Task: ${task}, Model: ${selectedModel}`);

    // Construct API URL based on task
    let apiUrl = `https://api-inference.huggingface.co/models/${selectedModel}`;
    
    const requestBody: any = {
      inputs,
      ...parameters
    };

    // For image generation, we need different handling
    if (task === 'image-generation') {
      requestBody.options = { wait_for_model: true };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[HuggingFace] API Error:', response.status, errorText);
      
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ 
            error: 'Model is loading, please try again in a moment',
            loading: true
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    // Handle different response types
    if (task === 'image-generation') {
      const imageBuffer = await response.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      return new Response(
        JSON.stringify({ 
          image: `data:image/png;base64,${base64Image}`,
          task,
          model: selectedModel 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Normalize response format
    let result: any = { task, model: selectedModel };
    
    if (task === 'text-generation' || task === 'code-generation') {
      result.generated_text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    } else if (task === 'summarization') {
      result.summary = Array.isArray(data) ? data[0]?.summary_text : data.summary_text;
    } else if (task === 'embeddings') {
      result.embeddings = data;
    } else {
      result.data = data;
    }

    console.log(`[HuggingFace] Success for task: ${task}`);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HuggingFace] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'HuggingFace inference failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
