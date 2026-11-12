import type { Conversation } from '@/types/messages';
import { splitThreads } from './thread-kind';

function thread(id: string, participantId: string, unreadCount = 0): Conversation {
  return {
    id, participant: { id: participantId, name: 'Someone', avatarUrl: null }, lastMessage: 'hi',
    lastMessageAt: '2026-11-10T10:00:00.000Z', lastMessageSenderId: null, unreadCount, createdAt: '2026-11-10T09:00:00.000Z',
  };
}

const staff = new Set(['admin-1']);
const threads = [thread('t1', 'student-1', 2), thread('t2', 'admin-1', 1), thread('t3', 'student-2', 0)];

describe('splitThreads', () => {
  it('separates Gida Support from direct chats', () => {
    const { support, direct } = splitThreads(threads, staff, 'All');
    expect(support.map((t) => t.id)).toEqual(['t2']);
    expect(direct.map((t) => t.id)).toEqual(['t1', 't3']);
  });
  it('shows only staff chats under Support', () => {
    const { support, direct } = splitThreads(threads, staff, 'Support');
    expect(support).toHaveLength(1);
    expect(direct).toHaveLength(0);
  });
  it('keeps only unread chats under Unread, in both groups', () => {
    const { support, direct } = splitThreads(threads, staff, 'Unread');
    expect(support.map((t) => t.id)).toEqual(['t2']);
    expect(direct.map((t) => t.id)).toEqual(['t1']);
  });
});
