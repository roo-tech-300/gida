import React from 'react';
import { render } from '@testing-library/react-native';
import { MessagePodJoinCard } from '@/components/messages/message-pod-join-card';
import { MessageBubble } from '@/components/messages/message-bubble';
import type { PodJoinAttachment, ChatMessage } from '@/types/messages';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

function makeAttachment(source: 'code' | 'recommendation'): PodJoinAttachment {
  return {
    type: 'pod_join',
    podId: 'pod-1',
    listingId: 'listing-1',
    title: 'Premium Studio',
    image: null,
    location: 'Lekki, Lagos',
    joinerName: 'Ada',
    source,
    seatNumber: 2,
    totalSeats: 4,
  };
}

describe('MessagePodJoinCard', () => {
  it('renders a recommendation join message', async () => {
    const { getByText } = await render(<MessagePodJoinCard attachment={makeAttachment('recommendation')} />);
    expect(getByText(/just joined your group/i)).toBeTruthy();
    expect(getByText(/Seat 2 of 4/i)).toBeTruthy();
  });

  it('renders a code join message', async () => {
    const { getByText } = await render(<MessagePodJoinCard attachment={makeAttachment('code')} />);
    expect(getByText(/just joined via your invite code/i)).toBeTruthy();
  });
});

describe('MessageBubble pod_join integration', () => {
  function bubble(attachment: PodJoinAttachment): ChatMessage {
    return {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'ada',
      body: 'Ada just joined your group',
      attachment,
      createdAt: new Date().toISOString(),
      clientSentAt: Date.now(),
      readAt: null,
      localCreatedAt: Date.now(),
    };
  }

  it('renders the pod-join card and does not render a duplicate text bubble', async () => {
    const { getByText, queryByText } = await render(
      <MessageBubble message={bubble(makeAttachment('recommendation'))} isMe={false} />,
    );
    expect(getByText(/just joined your group/i)).toBeTruthy();
    expect(queryByText('Ada just joined your group')).toBeNull();
  });
});
