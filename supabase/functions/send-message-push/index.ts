import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

type MessageWebhook = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string | null;
    attachment: { title?: string } | null;
  };
};

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type FcmError = { error?: { status?: string; message?: string } };

const json = (body: Record<string, unknown>, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function createAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = encodeBase64Url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: account.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const pem = account.private_key.replace(/\\n/g, '\n');
  const raw = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(raw);
  const keyBytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', keyBytes, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const signatureBytes = String.fromCharCode(...new Uint8Array(signature));
  const assertion = `${unsigned}.${encodeBase64Url(signatureBytes)}`;
  const response = await fetch(account.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const result = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !result.access_token) throw new Error(`Google OAuth failed (${response.status}): ${result.error ?? 'missing access token'}`);
  return result.access_token;
}

serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const hookSecret = Deno.env.get('MESSAGE_WEBHOOK_SECRET');
    if (!hookSecret || request.headers.get('x-message-webhook-secret') !== hookSecret) {
      return json({ error: 'Unauthorized webhook request' }, 401);
    }
    const payload = await request.json() as MessageWebhook;
    if (payload.type !== 'INSERT' || payload.table !== 'messages' || !payload.record) return json({ skipped: true });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const accountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!supabaseUrl || !serviceKey || !accountJson) throw new Error('Missing Supabase or Firebase server secrets');
    const account = JSON.parse(accountJson) as ServiceAccount;
    const database = createClient(supabaseUrl, serviceKey);
    const { conversation_id: conversationId, sender_id: senderId, body, attachment } = payload.record;

    const [{ data: conversation, error: conversationError }, { data: sender }] = await Promise.all([
      database.from('conversations').select('participant_a,participant_b').eq('id', conversationId).single(),
      database.from('profiles').select('full_name').eq('id', senderId).maybeSingle(),
    ]);
    if (conversationError || !conversation) throw new Error(`Conversation lookup failed: ${conversationError?.message ?? 'not found'}`);
    if (conversation.participant_a !== senderId && conversation.participant_b !== senderId) {
      return json({ error: 'Message sender is not a conversation participant' }, 400);
    }
    const recipientId = conversation.participant_a === senderId ? conversation.participant_b : conversation.participant_a;
    const { data: tokens, error: tokenError } = await database.from('device_tokens').select('token').eq('user_id', recipientId);
    if (tokenError) throw new Error(`Device token lookup failed: ${tokenError.message}`);
    if (!tokens?.length) return json({ delivered: 0, reason: 'No device tokens for recipient' });

    const accessToken = await createAccessToken(account);
    const preview = body?.trim() || (attachment ? `Shared a listing: ${attachment.title ?? 'Listing'}` : 'Sent an attachment');
    const title = sender?.full_name || 'Someone on Gida';
    const results = await Promise.all(tokens.map(async ({ token }) => {
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body: preview },
            data: { conversationId, senderId },
            android: { priority: 'high', notification: { sound: 'default' } },
          },
        }),
      });
      const result = await response.json() as FcmError;
      if (!response.ok && result.error?.status === 'UNREGISTERED') {
        const { error } = await database.from('device_tokens').delete().eq('token', token);
        if (error) console.error('[SendPush] Failed removing unregistered token:', error.message);
      }
      return { ok: response.ok, status: result.error?.status ?? (response.ok ? 'SENT' : `HTTP_${response.status}`) };
    }));

    const delivered = results.filter((result) => result.ok).length;
    console.log('[SendPush] Dispatch complete', { conversationId, recipientId, delivered, failures: results.length - delivered });
    return json({ delivered, failed: results.length - delivered, results });
  } catch (error) {
    console.error('[SendPush] Dispatch failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected notification failure' }, 500);
  }
});
