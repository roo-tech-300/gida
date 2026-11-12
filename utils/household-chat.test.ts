import { householdPreview, memberNameMap, householdTitle, memberSummary, parseHouseholdChat, parseHouseholdChats, parseHouseholdMessage } from './household-chat';

const chat = {
  podId: 'pod-1', listingTitle: 'Royal Lodge, 2-bed shared flat', memberCount: 2, memberIds: ['u-ada', 'u-amina'], memberNames: ['Ada', 'Amina'],
  lastMessage: 'Who has the kettle?', lastMessageAt: '2026-11-12T10:00:00Z', lastSenderId: 'u-ada', lastSenderName: 'Ada', unreadCount: 3,
};

describe('household chat helpers', () => {
  it('parses a valid inbox row and drops malformed ones', () => {
    expect(parseHouseholdChat(chat)).toEqual(chat);
    expect(parseHouseholdChat({ memberNames: [] })).toBeNull();
    expect(parseHouseholdChats([chat, null, 'x', { podId: 'p2' }])).toHaveLength(2);
    expect(parseHouseholdChats('nope')).toEqual([]);
  });

  it('never trusts a negative or missing unread count', () => {
    expect(parseHouseholdChat({ ...chat, unreadCount: -4 })?.unreadCount).toBe(0);
    expect(parseHouseholdChat({ podId: 'p', memberNames: ['A'] })?.unreadCount).toBe(0);
  });

  it('parses realtime message rows', () => {
    const row = { id: 'm1', pod_id: 'pod-1', sender_id: 'u1', body: 'hi', created_at: '2026-11-12T10:00:00Z' };
    expect(parseHouseholdMessage(row)).toEqual({ id: 'm1', podId: 'pod-1', senderId: 'u1', body: 'hi', createdAt: row.created_at });
    expect(parseHouseholdMessage({ ...row, body: '' })).toBeNull();
  });

  it('titles the household by place', () => {
    expect(householdTitle(chat)).toBe('Royal Lodge household');
    expect(householdTitle({ listingTitle: null })).toBe('Your household');
  });

  it('lists housemates without the viewer', () => {
    expect(memberSummary(['Ada', 'Amina', 'Tobi'], 'Ada')).toBe('Amina and Tobi');
    expect(memberSummary(['Ada', 'Amina'], 'Ada')).toBe('Amina');
    expect(memberSummary(['Ada', 'Amina', 'Tobi', 'Chidi'], 'Ada')).toBe('Amina, Tobi and Chidi');
    expect(memberSummary([], 'Ada')).toBe('Housemates');
  });

  it('maps member ids to first names', () => {
    expect(memberNameMap(chat)).toEqual({ 'u-ada': 'Ada', 'u-amina': 'Amina' });
  });

  it('previews the last message with who said it', () => {
    expect(householdPreview(chat, 'u-ada')).toBe('You: Who has the kettle?');
    expect(householdPreview(chat, 'u-amina')).toBe('Ada: Who has the kettle?');
    expect(householdPreview({ ...chat, lastMessage: null }, 'u-ada')).toBe('Say hi to your future housemates');
  });
});
