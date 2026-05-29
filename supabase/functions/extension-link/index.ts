// Extension OAuth-style device-code handshake.
// Flow:
//   1) extension POST {action:"start"}                     -> {code, verification_url}
//   2) user opens verification_url in IDE, approves        (calls action:"approve" with bearer token)
//   3) extension polls GET ?action=poll&code=...           -> {access_token, refresh_token} once approved
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cyberpunk-extension',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const IDE_ORIGIN = Deno.env.get('IDE_ORIGIN') ?? 'https://cyberpunk-termux-ide.lovable.app';

function genCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (i === 3) out += '-';
  }
  return out;
}

async function getAction(req: Request): Promise<{ action: string; body: Record<string, unknown> }> {
  const url = new URL(req.url);
  if (req.method === 'GET') {
    return { action: url.searchParams.get('action') || 'poll', body: Object.fromEntries(url.searchParams) };
  }
  const body = await req.json().catch(() => ({}));
  return { action: String(body.action || 'start'), body };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const service = createClient(SUPABASE_URL, SERVICE_KEY);
    const { action, body } = await getAction(req);

    // 1) START — unauthenticated, just mints a short-lived code
    if (action === 'start') {
      const code = genCode();
      const { error } = await service.from('extension_link_codes').insert({
        code,
        scopes: body.scopes ?? ['bridge:read', 'bridge:write'],
      });
      if (error) return json({ error: error.message }, 500);
      return json({
        ok: true,
        code,
        verification_url: `${IDE_ORIGIN}/link-extension?code=${encodeURIComponent(code)}`,
        expires_in: 300,
      });
    }

    // 2) APPROVE / DENY — IDE user, authenticated
    if (action === 'approve' || action === 'deny') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ error: 'Authentication required' }, 401);
      const anon = createClient(SUPABASE_URL, ANON_KEY);
      const { data: { user }, error: authErr } = await anon.auth.getUser(
        authHeader.replace('Bearer ', ''),
      );
      if (authErr || !user) return json({ error: 'Invalid auth token' }, 401);

      const code = String(body.code || '');
      if (!code) return json({ error: 'code required' }, 400);

      const { data: existing } = await service
        .from('extension_link_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      if (!existing) return json({ error: 'Unknown code' }, 404);
      if (new Date(existing.expires_at).getTime() < Date.now())
        return json({ error: 'Code expired' }, 410);

      if (action === 'deny') {
        await service.from('extension_link_codes').delete().eq('code', code);
        return json({ ok: true, status: 'denied' });
      }

      // Mint a long-lived token via service role. Simpler: persist the user's
      // current bearer so the extension can use it as the access token.
      // (Future: swap for a scoped refresh token.)
      const token = authHeader.replace('Bearer ', '');
      const { error: upErr } = await service
        .from('extension_link_codes')
        .update({
          user_id: user.id,
          claimed_at: new Date().toISOString(),
          approved_token: token,
        })
        .eq('code', code);
      if (upErr) return json({ error: upErr.message }, 500);
      return json({ ok: true, status: 'approved' });
    }

    // 3) POLL — extension polls until approved
    if (action === 'poll') {
      const code = String(body.code || '');
      if (!code) return json({ error: 'code required' }, 400);
      const { data } = await service
        .from('extension_link_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      if (!data) return json({ error: 'Unknown code' }, 404);
      if (!data.claimed_at || !data.approved_token) {
        return json({ ok: true, status: 'pending' });
      }
      // One-shot: return token, then delete code so it can't be replayed
      const token = data.approved_token;
      await service.from('extension_link_codes').delete().eq('code', code);
      return json({
        ok: true,
        status: 'approved',
        access_token: token,
        user_id: data.user_id,
        scopes: data.scopes,
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('[extension-link]', e);
    return json({ error: e instanceof Error ? e.message : 'Link error' }, 500);
  }
});
