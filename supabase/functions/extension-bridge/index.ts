// Browser Extension Interoperability Bridge
// Accepts authenticated context drops from the Cyberpunk Termux browser extension
// (selection text, page URL/title, prompt) and stores them as unconsumed inbox
// items the IDE can pull on next chat session.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cyberpunk-extension",
  "Access-Control-Allow-Methods": "POST, GET, PATCH, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) return json({ error: "Invalid auth token" }, 401);

    const service = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // GET ?unconsumed=1 — list pending inbox items
    if (req.method === "GET") {
      const url = new URL(req.url);
      const unconsumed = url.searchParams.get("unconsumed") === "1";
      const query = service
        .from("extension_context")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (unconsumed) query.eq("consumed", false);
      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);
      return json({ items: data ?? [] });
    }

    // PATCH /:id — mark consumed
    if (req.method === "PATCH") {
      const { id } = await req.json();
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await service
        .from("extension_context")
        .update({ consumed: true, consumed_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // POST — drop new context from the extension
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const {
        origin_url = null,
        page_title = null,
        selection = null,
        prompt = null,
        metadata = {},
        source = "browser-extension",
      } = body as Record<string, unknown>;

      // Size guards — extension drops should stay small
      const cap = (v: unknown, n: number) =>
        typeof v === "string" ? v.slice(0, n) : v;

      const { data, error } = await service
        .from("extension_context")
        .insert({
          user_id: user.id,
          source: String(source).slice(0, 64),
          origin_url: cap(origin_url, 2048),
          page_title: cap(page_title, 512),
          selection: cap(selection, 20000),
          prompt: cap(prompt, 20000),
          metadata: metadata ?? {},
        })
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, item: data });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("[extension-bridge]", e);
    return json({ error: e instanceof Error ? e.message : "Bridge error" }, 500);
  }
});
