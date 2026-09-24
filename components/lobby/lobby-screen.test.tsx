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
});
