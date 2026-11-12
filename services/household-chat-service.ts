import { supabase } from '@/lib/supabase';
import type { HouseholdChat, HouseholdMessage } from '@/types/household-chat';
import { parseHouseholdChats, parseHouseholdMessage } from '@/utils/household-chat';

export const HOUSEHOLD_PAGE_SIZE = 40;

export async function fetchHouseholdChats(): Promise<HouseholdChat[]> {
  const { data, error } = await supabase.rpc('get_household_chats');
  if (error) {
    console.error('[HouseholdChat] Failed to load household chats:', error.message);
    throw new Error(error.message);
  }
  return parseHouseholdChats(data);
}

/** Newest first. `before` is the created_at of the oldest message already loaded. */
export async function fetchHouseholdMessages(podId: string, before?: string): Promise<HouseholdMessage[]> {
  let query = supabase
    .from('household_messages')
    .select('id, pod_id, sender_id, body, created_at')
    .eq('pod_id', podId)
    .order('created_at', { ascending: false })
    .limit(HOUSEHOLD_PAGE_SIZE);
  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  if (error) {
    console.error('[HouseholdChat] Failed to load messages:', error.message);
    throw new Error(error.message);
  }
  return (data ?? []).map(parseHouseholdMessage).filter((m): m is HouseholdMessage => m !== null);
}

export async function sendHouseholdMessage(podId: string, senderId: string, body: string): Promise<HouseholdMessage> {
  const { data, error } = await supabase
    .from('household_messages')
    .insert({ pod_id: podId, sender_id: senderId, body: body.trim() })
    .select('id, pod_id, sender_id, body, created_at')
    .single();
  const message = error ? null : parseHouseholdMessage(data);
  if (error || !message) {
    console.error('[HouseholdChat] Failed to send message:', error?.message ?? 'malformed response');
    throw new Error(error?.message ?? 'Could not send message.');
  }
  return message;
}

export async function markHouseholdRead(podId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_household_read', { p_pod_id: podId });
  if (error) console.error('[HouseholdChat] Failed to mark read:', error.message);
}

let channelSeq = 0;

/** Calls onChange whenever anyone posts in the household. Returns an unsubscribe function. */
export function subscribeToHousehold(podId: string, onChange: () => void): () => void {
  channelSeq += 1;
  const channel = supabase
    .channel(`household:${podId}:${Date.now().toString(36)}-${channelSeq}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'household_messages', filter: `pod_id=eq.${podId}` }, onChange);
  channel.subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.error(`[HouseholdChat] Realtime ${status}`, err ?? '');
  });
  return () => {
    void supabase.removeChannel(channel);
  };
}
