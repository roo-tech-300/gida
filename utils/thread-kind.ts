import type { Conversation, MessageFilter } from '@/types/messages';

export interface SplitThreads {
  support: Conversation[];
  direct: Conversation[];
}

export function isSupportThread(thread: Conversation, supportIds: ReadonlySet<string>): boolean {
  return supportIds.has(thread.participant.id);
}

/** Apply the inbox filter, then separate Gida Support from direct chats. */
export function splitThreads(threads: readonly Conversation[], supportIds: ReadonlySet<string>, filter: MessageFilter): SplitThreads {
  const support: Conversation[] = [];
  const direct: Conversation[] = [];
  for (const thread of threads) {
    if (filter === 'Unread' && thread.unreadCount === 0) continue;
    const isSupport = isSupportThread(thread, supportIds);
    if (filter === 'Support' && !isSupport) continue;
    (isSupport ? support : direct).push(thread);
  }
  return { support, direct };
}
