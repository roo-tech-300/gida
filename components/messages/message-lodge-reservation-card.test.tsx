import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { MessageLodgeReservationCard } from '@/components/messages/message-lodge-reservation-card';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import type { LodgeReservationAttachment } from '@/types/messages';

import {
  adminLodgeApplicationRoute,
  applicantLodgeApplicationRoute,
  resolveLodgeApplicationPodId,
} from '@/services/lodge-application-route';

jest.mock('@/components/ui/animated-error-modal', () => {
  const { Text } = jest.requireActual('react-native') as typeof import('react-native');
  return {
    AnimatedErrorModal: ({ visible, testID }: { visible: boolean; testID?: string }) =>
      visible ? <Text testID={testID}>error</Text> : null,
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
    addEventListener: jest.fn(() => jest.fn()),
    useNetInfo: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
  },
}));

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/context/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/lodge-application-route', () => ({
  adminLodgeApplicationRoute: jest.fn((podId: string) => `/admin/lodge-reservation/${podId}`),
  applicantLodgeApplicationRoute: jest.fn((creditId: string) => ({
    pathname: '/property/pay-slot',
    params: { id: creditId },
  })),
  resolveLodgeApplicationPodId: jest.fn(),
}));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuth = jest.mocked(useAuth);
const push = jest.fn();

const mockedAdminRoute = jest.mocked(adminLodgeApplicationRoute);
const mockedApplicantRoute = jest.mocked(applicantLodgeApplicationRoute);
const mockedResolvePod = jest.mocked(resolveLodgeApplicationPodId);

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

  it('routes an admin to the same review route as the Applications queue', async () => {
    mockedUseAuth.mockReturnValue({ profile: { is_admin: true } } as unknown as ReturnType<typeof useAuth>);
    mockedResolvePod.mockResolvedValue('pod-1');
    const { getByText, getByTestId } = await render(<MessageLodgeReservationCard attachment={makeAttachment()} />);

    expect(getByText(/New application/i)).toBeTruthy();
    fireEvent.press(getByTestId('lodge-reservation-card'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/lodge-reservation/pod-1'));
    expect(mockedAdminRoute).toHaveBeenCalledWith('pod-1');
  });

  it('resolves a legacy DM that only has a creditId to the real pod id', async () => {
    mockedUseAuth.mockReturnValue({ profile: { is_admin: true } } as unknown as ReturnType<typeof useAuth>);
    mockedResolvePod.mockResolvedValue('pod-99');
    const legacy = { ...makeAttachment(), podId: '' };
    const { getByTestId } = await render(<MessageLodgeReservationCard attachment={legacy} />);

    fireEvent.press(getByTestId('lodge-reservation-card'));
    await waitFor(() => expect(mockedResolvePod).toHaveBeenCalled());
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/lodge-reservation/pod-99'));
  });

  it('does not navigate for a legacy attachment without a creditId', async () => {
    mockedUseAuth.mockReturnValue({ profile: { is_admin: false } } as unknown as ReturnType<typeof useAuth>);
    const legacy = { ...makeAttachment(), creditId: '' };
    const { getByTestId } = await render(<MessageLodgeReservationCard attachment={legacy} />);

    fireEvent.press(getByTestId('lodge-reservation-card'));
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => expect(getByTestId('lodge-reservation-error')).toBeTruthy());
  });

  it('shows an animated error instead of navigating when the admin application cannot be resolved', async () => {
    mockedUseAuth.mockReturnValue({ profile: { is_admin: true } } as unknown as ReturnType<typeof useAuth>);
    mockedResolvePod.mockResolvedValue(null);
    const legacy = { ...makeAttachment(), podId: '' };
    const { getByTestId } = await render(<MessageLodgeReservationCard attachment={legacy} />);

    fireEvent.press(getByTestId('lodge-reservation-card'));
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => expect(getByTestId('lodge-reservation-error')).toBeTruthy());
  });

  it('routes the applicant to the pending-application screen', async () => {
    mockedUseAuth.mockReturnValue({ profile: { is_admin: false } } as unknown as ReturnType<typeof useAuth>);
    const { getByText, getByTestId } = await render(<MessageLodgeReservationCard attachment={makeAttachment()} />);

    expect(getByText(/Awaiting review/i)).toBeTruthy();
    fireEvent.press(getByTestId('lodge-reservation-card'));
    expect(push).toHaveBeenCalledWith({ pathname: '/property/pay-slot', params: { id: 'credit-1' } });
    expect(mockedApplicantRoute).toHaveBeenCalledWith('credit-1');
  });
});
