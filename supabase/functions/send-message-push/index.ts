import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface WebhookRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment: { title?: string } | null;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: WebhookRecord;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY') ?? '';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== 'INSERT' || !payload.record) {
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { conversation_id, sender_id, body, attachment } = payload.record;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch conversation to find recipient
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('participant_a, participant_b')
      .eq('id', conversation_id)
      .single();

    if (convError || !conv) {
      console.error('[SendPush] Conversation not found:', convError);
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
    }

    const recipientId = conv.participant_a === sender_id ? conv.participant_b : conv.participant_a;

    // 2. Fetch sender profile for display name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sender_id)
      .single();

    const senderName = senderProfile?.full_name ?? 'Someone on Gida';

    // 3. Fetch recipient tokens
    const { data: tokenRows, error: tokenError } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', recipientId);

    if (tokenError || !tokenRows || tokenRows.length === 0) {
      console.log(`[SendPush] No device tokens found for recipient ${recipientId}`);
      return new Response(JSON.stringify({ delivered: 0 }), { status: 200 });
    }

    const messagePreview = body?.trim() || (attachment ? `Shared a listing: ${attachment.title ?? 'Listing'}` : 'Sent an attachment');

    // 4. Dispatch FCM push notifications to all recipient device tokens
    const invalidTokens: string[] = [];
    let sentCount = 0;

    for (const row of tokenRows) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${FCM_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: row.token,
            priority: 'high',
            notification: {
              title: senderName,
              body: messagePreview,
              sound: 'default',
            },
            data: {
              conversationId: conversation_id,
              senderId: sender_id,
            },
          }),
        });

        if (response.ok) {
          sentCount += 1;
        } else {
          const errText = await response.text();
          console.warn(`[SendPush] FCM send error for token:`, errText);
          if (response.status === 404 || response.status === 400) {
            invalidTokens.push(row.token);
          }
        }
      } catch (fcmError) {
        console.error('[SendPush] Network error sending FCM:', fcmError);
      }
    }

    // 5. Clean up any invalid or expired tokens
    if (invalidTokens.length > 0) {
      await supabase.from('device_tokens').delete().in('token', invalidTokens);
    }

    return new Response(JSON.stringify({ delivered: sentCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SendPush] Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
