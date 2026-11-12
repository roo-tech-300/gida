import type { HouseholdChat, HouseholdMessage } from '@/types/household-chat';

type Raw = Record<string, unknown>;

const isRecord = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);
const asString = (value: unknown): string | null => (typeof value === 'string' && value.length > 0 ? value : null);

/** Validates one inbox row from get_household_chats(); a malformed row is dropped, not guessed at. */
export function parseHouseholdChat(value: unknown): HouseholdChat | null {
  if (!isRecord(value)) return null;
  const podId = asString(value.podId);
  if (!podId) return null;
  const names = Array.isArray(value.memberNames) ? value.memberNames.filter((n): n is string => typeof n === 'string') : [];
  return {
    podId,
    listingTitle: asString(value.listingTitle),
    memberIds: Array.isArray(value.memberIds) ? value.memberIds.filter((n): n is string => typeof n === 'string') : [],
    memberCount: typeof value.memberCount === 'number' ? value.memberCount : names.length,
    memberNames: names,
    lastMessage: asString(value.lastMessage),
    lastMessageAt: asString(value.lastMessageAt),
    lastSenderId: asString(value.lastSenderId),
    lastSenderName: asString(value.lastSenderName),
    unreadCount: typeof value.unreadCount === 'number' ? Math.max(0, value.unreadCount) : 0,
  };
}

export function parseHouseholdChats(value: unknown): HouseholdChat[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseHouseholdChat).filter((chat): chat is HouseholdChat => chat !== null);
}

export function parseHouseholdMessage(value: unknown): HouseholdMessage | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const podId = asString(value.pod_id);
  const senderId = asString(value.sender_id);
  const body = asString(value.body);
  const createdAt = asString(value.created_at);
  if (!id || !podId || !senderId || !body || !createdAt) return null;
  return { id, podId, senderId, body, createdAt };
}

/** "Royal Lodge" — the part of a listing title before the first comma. */
export function householdTitle(chat: Pick<HouseholdChat, 'listingTitle'>): string {
  const place = chat.listingTitle?.split(',')[0]?.trim();
  return place ? `${place} household` : 'Your household';
}

/** "Ada, Amina and Tobi" for the chat header and inbox row. */
export function memberSummary(names: readonly string[], myFirstName?: string | null): string {
  const others = names.filter((name) => name !== myFirstName);
  const shown = others.length > 0 ? others : [...names];
  if (shown.length <= 1) return shown[0] ?? 'Housemates';
  if (shown.length === 2) return `${shown[0]} and ${shown[1]}`;
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
}

/** id -> first name for the people in a household. */
export function memberNameMap(chat: Pick<HouseholdChat, 'memberIds' | 'memberNames'>): Record<string, string> {
  const map: Record<string, string> = {};
  chat.memberIds.forEach((id, index) => {
    map[id] = chat.memberNames[index] ?? 'Housemate';
  });
  return map;
}

export function householdPreview(chat: HouseholdChat, myId?: string | null): string {
  if (!chat.lastMessage) return 'Say hi to your future housemates';
  if (myId && chat.lastSenderId === myId) return `You: ${chat.lastMessage}`;
  return chat.lastSenderName ? `${chat.lastSenderName}: ${chat.lastMessage}` : chat.lastMessage;
}
