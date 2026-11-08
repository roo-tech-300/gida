import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

type ListingRecord = {
  id: string;
  title?: string;
  city?: string;
  location_landmark?: string;
  published?: boolean;
};

type ListingWebhook = {
  type?: 'INSERT' | 'UPDATE';
  table?: string;
  record?: ListingRecord;
  old_record?: ListingRecord | null;
  listing_id?: string;
  listingId?: string;
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
  const keyBytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
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
  const result = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !result.access_token) {
    throw new Error(`Google OAuth failed (${response.status}): ${result.error ?? 'missing access token'}`);
  }
  return result.access_token;
}

serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const hookSecret = Deno.env.get('MATCH_WEBHOOK_SECRET');
    if (hookSecret && request.headers.get('x-match-webhook-secret') !== hookSecret) {
      return json({ error: 'Unauthorized webhook request' }, 401);
    }

    const payload = (await request.json()) as ListingWebhook;
    const listingId = payload.record?.id ?? payload.listing_id ?? payload.listingId;
    if (!listingId) return json({ skipped: true, reason: 'No listing ID in payload' });

    // For webhooks: only send alerts if transition into published = true
    if (payload.record && payload.record.published !== undefined) {
      if (!payload.record.published) return json({ skipped: true, reason: 'Listing unpublished' });
      if (payload.type === 'UPDATE' && payload.old_record?.published === true) {
        return json({ skipped: true, reason: 'Listing was already published' });
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const accountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!supabaseUrl || !serviceKey || !accountJson) {
      throw new Error('Missing Supabase or Firebase server secrets');
    }

    const database = createClient(supabaseUrl, serviceKey);
    const account = JSON.parse(accountJson) as ServiceAccount;

    // Fetch listing details for notification copy
    const { data: listing } = await database
      .from('listings')
      .select('title, city, location_landmark')
      .eq('id', listingId)
      .single();

    // Call matching RPC function with 70% match threshold
    const { data: matches, error: matchError } = await database.rpc(
      'find_matching_users_for_listing',
      { p_listing_id: listingId, p_min_score: 70 },
    );

    if (matchError) throw new Error(`Match query failed: ${matchError.message}`);
    if (!matches || matches.length === 0) {
      return json({ delivered: 0, reason: 'No users matched 70% threshold' });
    }

    const userIds = matches.map((m: { user_id: string }) => m.user_id);
    const scoreMap = new Map(matches.map((m: { user_id: string; match_score: number }) => [m.user_id, Math.round(m.match_score)]));

    const { data: tokens, error: tokenError } = await database
      .from('device_tokens')
      .select('token, user_id')
      .in('user_id', userIds);

    if (tokenError) throw new Error(`Device token lookup failed: ${tokenError.message}`);
    if (!tokens || tokens.length === 0) {
      return json({ delivered: 0, reason: 'No active device tokens found for matched users' });
    }

    const accessToken = await createAccessToken(account);
    const listingTitle = listing?.title?.trim() || 'a lodge';
    const notificationTitle = 'We just found you a lodge';
    const notificationBody = `We found ${listingTitle} check it out`;

    const results = await Promise.all(tokens.map(async ({ token, user_id }) => {
      const score = scoreMap.get(user_id) ?? 70;
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: notificationTitle,
              body: notificationBody,
            },
            data: {
              type: 'apartment_match',
              listingId: String(listingId),
              listing_id: String(listingId),
              matchScore: String(score),
            },
            android: { priority: 'high', notification: { sound: 'default' } },
          },
        }),
      });

      const resJson = (await res.json()) as FcmError;
      if (!res.ok && resJson.error?.status === 'UNREGISTERED') {
        await database.from('device_tokens').delete().eq('token', token);
      }
      return { ok: res.ok, status: resJson.error?.status ?? (res.ok ? 'SENT' : `HTTP_${res.status}`) };
    }));

    const delivered = results.filter((r) => r.ok).length;
    console.log('[MatchAlert] Dispatch complete (70% threshold)', { listingId, matchedUsers: matches.length, delivered });
    return json({ delivered, failed: results.length - delivered, matchedUsers: matches.length });
  } catch (error: unknown) {
    console.error('[MatchAlert] Failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected notification failure' }, 500);
  }
});
