import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { MessageLodgeReservationCard } from '@/components/messages/message-lodge-reservation-card';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import type { LodgeReservationAttachment } from '@/types/messages';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
    addEventListener: jest.fn(() => jest.fn()),
  },
  useNetInfo: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/context/auth-context', () => ({ useAuth: jest.fn() }));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuth = jest.mocked(useAuth);
const push = jest.fn();

function makeAttachment(): LodgeReservationAttachment {
  return {
    type: 'lodge_reservation',
    podId: 'pod-1',
    listingId: 'listing-1',
    creditId: 'credit-1',
    title: 'Peace Lodge',
    image: null,
    location: 'Minna, Niger',
    userName: 'Ada',
  };
}

describe('MessageLodgeReservationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  it('routes an admin to the reservation review screen', async () => {
    mockedUseAuth.mockReturnValue({ profile: { is_admin: true } } as unknown as ReturnType<typeof useAuth>);
    const { getByText, getByTestId } = await render(<MessageLodgeReservationCard attachment={makeAttachment()} />);

    expect(getByText(/New application/i)).toBeTruthy();
    fireEvent.press(getByTestId('lodge-reservation-card'));
    expect(push).toHaveBeenCalledWith('/admin/lodge-reservation/pod-1');
  });

  it('routes the applicant to the pending-application screen', async () => {
    mockedUseAuth.mockReturnValue({ profile: { is_admin: false } } as unknown as ReturnType<typeof useAuth>);
    const { getByText, getByTestId } = await render(<MessageLodgeReservationCard attachment={makeAttachment()} />);

    expect(getByText(/Awaiting review/i)).toBeTruthy();
    fireEvent.press(getByTestId('lodge-reservation-card'));
    expect(push).toHaveBeenCalledWith({ pathname: '/property/pay-slot', params: { id: 'credit-1' } });
  });

  it('does not navigate for a legacy attachment without a creditId', async () => {
    mockedUseAuth.mockReturnValue({ profile: { is_admin: false } } as unknown as ReturnType<typeof useAuth>);
    const legacy = { ...makeAttachment(), creditId: '' };
    const { getByTestId } = await render(<MessageLodgeReservationCard attachment={legacy} />);

    fireEvent.press(getByTestId('lodge-reservation-card'));
    expect(push).not.toHaveBeenCalled();
  });
});
