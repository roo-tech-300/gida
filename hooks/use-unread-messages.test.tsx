import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAuth } from '@/context/auth-context';
import { fetchMyConversations } from '@/services/messageService';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import type { Conversation } from '@/types/messages';

jest.mock('@/context/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/messageService', () => ({ fetchMyConversations: jest.fn() }));
jest.mock('@/services/offline-message-store', () => ({
  getLocalSortKey: jest.fn(() => null),
  getOfflineThreads: jest.fn(() => []),
  syncThreadsToStore: jest.fn(),
}));

const USER_ID = 'user-123';
const mockedUseAuth = jest.mocked(useAuth);
const mockedFetchConversations = jest.mocked(fetchMyConversations);

function conversation(id: string, unreadCount: number): Conversation {
  return {
    id,
    participant: {
      id: `other-${id}`,
      name: `Other ${id}`,
      avatarUrl: null,
    },
    lastMessage: 'Hello',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    lastMessageSenderId: null,
    unreadCount,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function createWrapper(client: QueryClient): React.ComponentType<React.PropsWithChildren> {
  return function QueryWrapper({ children }: React.PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
}

describe('useUnreadMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      profile: { id: USER_ID } as ReturnType<typeof useAuth>['profile'],
    } as ReturnType<typeof useAuth>);
  });

  it('sums unread counts from the shared conversations query', async () => {
    mockedFetchConversations.mockResolvedValue([conversation('one', 3), conversation('two', 2)]);
    const client = createClient();

    const { result } = await renderHook(() => useUnreadMessages(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current).toBe(5));
    expect(mockedFetchConversations).toHaveBeenCalledTimes(1);
  });

  it('keeps two mounted navbar instances in sync when conversations are invalidated', async () => {
    mockedFetchConversations
      .mockResolvedValueOnce([conversation('one', 1)])
      .mockResolvedValueOnce([conversation('one', 4), conversation('two', 2)]);
    const client = createClient();
    const wrapper = createWrapper(client);
    const first = await renderHook(() => useUnreadMessages(), { wrapper });
    const second = await renderHook(() => useUnreadMessages(), { wrapper });

    await waitFor(() => {
      expect(first.result.current).toBe(1);
      expect(second.result.current).toBe(1);
    });
    expect(mockedFetchConversations).toHaveBeenCalledTimes(1);

    await act(async () => {
      await client.invalidateQueries({ queryKey: ['conversations', USER_ID] });
    });

    await waitFor(() => {
      expect(first.result.current).toBe(6);
      expect(second.result.current).toBe(6);
    });
    expect(mockedFetchConversations).toHaveBeenCalledTimes(2);
  });

  it('returns zero when signed out', async () => {
    mockedUseAuth.mockReturnValue({ profile: null } as ReturnType<typeof useAuth>);
    const { result } = await renderHook(() => useUnreadMessages(), { wrapper: createWrapper(createClient()) });

    expect(result.current).toBe(0);
    expect(mockedFetchConversations).not.toHaveBeenCalled();
  });
});
