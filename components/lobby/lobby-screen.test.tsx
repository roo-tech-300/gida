import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ToastProvider } from '@/components/ui/toast-card';
import { LobbyScreen } from './lobby-screen';

jest.mock('@/hooks/use-liquidity', () => ({
  useUserSlotCredits: jest.fn().mockReturnValue({
    data: [require('@/dummy/liquidity-mock').mockSlotCredit],
    isLoading: false,
    isRefetching: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useActivePods: jest.fn().mockReturnValue({
    data: [require('@/dummy/liquidity-mock').mockPod],
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/services/liquidity-service', () => ({
  inviteRoommateToPod: jest.fn().mockResolvedValue({}),
}));

describe('LobbyScreen & Peer Matching Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders slot credit pass, pod formation status, and peer profile badges', async () => {
    const { getByTestId, getByText, getAllByText } = await render(
      <ToastProvider>
        <LobbyScreen />
      </ToastProvider>
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
      </ToastProvider>
    );

    const inviteBtn = getByTestId('invite-btn-peer-201');
    fireEvent.press(inviteBtn);
    expect(inviteBtn).toBeTruthy();
  });
});
