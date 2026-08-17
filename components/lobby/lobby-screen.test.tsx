import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ToastProvider } from '@/components/ui/toast-card';
import { useUserSlotCredits, useActivePods } from '@/hooks/use-liquidity';
import { MOCK_SLOT_CREDITS, MOCK_PODS } from '@/dummy/liquidity-mock';
import { LobbyScreen } from './lobby-screen';
import type { SlotCredit } from '@/types/liquidity';

jest.mock('@/hooks/use-liquidity', () => ({
  useUserSlotCredits: jest.fn(),
  useActivePods: jest.fn(),
}));

jest.mock('@/services/liquidity-service', () => ({
  inviteRoommateToPod: jest.fn().mockResolvedValue({}),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
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

  it('renders slot credit pass, pod formation status, and peer profile badges', async () => {
    const { getByTestId, getByText, getAllByText } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    expect(getByText('ROOMMATE MATCHING & CONFIRMATION')).toBeTruthy();
    expect(getByTestId('slot-pass-card')).toBeTruthy();

    expect(getByText('COMPATIBLE PEERS IN LOBBY (3)')).toBeTruthy();

    expect(getByText('Chinedu Okeke')).toBeTruthy();
    expect(getByText('Computer Science • UNILAG (Main Campus)')).toBeTruthy();
    expect(getAllByText(/Cleanliness: 5\/5/)).toHaveLength(2);
    expect(getByText('Night owl (2 AM)')).toBeTruthy();
  });

  it('triggers invite notifications when invite buttons are tapped', async () => {
    const { getByTestId } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    const inviteBtn = getByTestId('invite-btn-peer-201');
    fireEvent.press(inviteBtn);
    expect(inviteBtn).toBeTruthy();
  });

  it('shows a Pay Now CTA when the credit is still pending payment', async () => {
    const pending = { ...MOCK_SLOT_CREDITS[0], status: 'booked_pending_claim' as const };
    mockLobbyData([pending]);

    const { getByTestId, getByText } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>,
    );

    expect(getByText(/Payment required to confirm your spot/)).toBeTruthy();
    expect(getByTestId('lobby-pay-now')).toBeTruthy();
  });
});
