import React from 'react';
import { render } from '@testing-library/react-native';
import { ToastProvider } from '@/components/ui/toast-card';
import { useUserSlotCredits, useActivePods } from '@/hooks/use-liquidity';
import { MOCK_SLOT_CREDITS, MOCK_PODS } from '@/dummy/liquidity-mock';
import { LobbyScreen } from './lobby-screen';
import type { SlotCredit } from '@/types/liquidity';

jest.mock('@/hooks/use-liquidity', () => ({
  useUserSlotCredits: jest.fn(),
  useActivePods: jest.fn(),
  usePhysicalRoom: jest.fn(() => ({ data: null })),
}));

jest.mock('@/services/liquidity-service', () => ({
  inviteRoommateToPod: jest.fn().mockResolvedValue({}),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  useFocusEffect: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

const { useLocalSearchParams } = jest.requireMock('expo-router');

function mockLobbyData(credits: SlotCredit[] = MOCK_SLOT_CREDITS, pods = MOCK_PODS) {
  (useUserSlotCredits as jest.Mock).mockReturnValue({
    data: credits,
    isLoading: false,
    isRefetching: false,
    isError: false,
    refetch: jest.fn(),
  });
  (useActivePods as jest.Mock).mockReturnValue({
    data: pods,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  });
}

describe('LobbyScreen & Peer Matching Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLobbyData();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders the slot pass, payment status, and current group', async () => {
    const { getByTestId, getByText } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    expect(getByText('Payment confirmed')).toBeTruthy();
    expect(getByTestId('slot-pass-card')).toBeTruthy();
    expect(getByText('YOUR GROUP')).toBeTruthy();
    expect(getByText('You (Current User)')).toBeTruthy();
    expect(getByText('1/4')).toBeTruthy();
  });

  it('shows group management for an active pod', async () => {
    const { getByTestId } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    expect(getByTestId('manage-group-btn')).toBeTruthy();
  });

  it('shows a Pay Now CTA when the credit is still pending payment', async () => {
    const pending = { ...MOCK_SLOT_CREDITS[0], status: 'booked_pending_claim' as const };
    mockLobbyData([pending]);

    const { getByTestId, getByText } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    expect(getByText('Payment required')).toBeTruthy();
    expect(getByTestId('lobby-pay-now')).toBeTruthy();
  });

  it('prefers the credit matching the creditId param over a stale expired credit', async () => {
    const expiredCredit = { ...MOCK_SLOT_CREDITS[0], id: 'expired-credit', status: 'expired' as const };
    const paidCredit = { ...MOCK_SLOT_CREDITS[0], id: 'paid-credit', status: 'paid_unmatched' as const };
    // Stale expired row first in the array — the old credits[0] fallback
    // would have picked it and shown the expired banner.
    mockLobbyData([expiredCredit, paidCredit]);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ creditId: 'paid-credit' });

    const { queryByText, getByText } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    expect(getByText('Payment confirmed')).toBeTruthy();
    expect(queryByText('Hold expired')).toBeNull();
  });

  it('prefers a non-expired credit when no params are passed', async () => {
    const expiredCredit = { ...MOCK_SLOT_CREDITS[0], id: 'expired-credit', status: 'expired' as const };
    const paidCredit = { ...MOCK_SLOT_CREDITS[0], id: 'paid-credit', status: 'paid_unmatched' as const };
    mockLobbyData([expiredCredit, paidCredit]);
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { queryByText, getByText } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    expect(getByText('Payment confirmed')).toBeTruthy();
    expect(queryByText('Hold expired')).toBeNull();
  });

  it('shows the expired banner for a genuinely expired credit selected by creditId', async () => {
    const expiredCredit = { ...MOCK_SLOT_CREDITS[0], id: 'expired-credit', status: 'expired' as const };
    mockLobbyData([expiredCredit]);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ creditId: 'expired-credit' });

    const { getByText } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    expect(getByText('Hold expired')).toBeTruthy();
  });
});
