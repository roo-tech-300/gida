import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { MessageLodgeDecisionCard } from '@/components/messages/message-lodge-decision-card';
import { useAuth } from '@/context/auth-context';
import type { LodgeDecisionAttachment } from '@/types/messages';

import {
  adminLodgeApplicationRoute,
  applicantLodgeApplicationRoute,
  resolveLodgeApplicationCreditId,
  resolveLodgeApplicationPodId,
} from '@/services/lodge-application-route';

jest.mock('@/components/ui/animated-error-modal', () => {
  const { Text } = jest.requireActual('react-native') as typeof import('react-native');
  return {
    AnimatedErrorModal: ({ visible, testID }: { visible: boolean; testID?: string }) =>
      visible ? <Text testID={testID}>error</Text> : null,
  };
});

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/context/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/lodge-application-route', () => ({
  adminLodgeApplicationRoute: jest.fn((podId: string) => `/admin/lodge-reservation/${podId}`),
  applicantLodgeApplicationRoute: jest.fn((creditId: string) => ({
    pathname: '/property/pay-slot',
    params: { id: creditId },
  })),
  resolveLodgeApplicationPodId: jest.fn(),
  resolveLodgeApplicationCreditId: jest.fn(),
}));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuth = jest.mocked(useAuth);
const push = jest.fn();

const mockedAdminRoute = jest.mocked(adminLodgeApplicationRoute);
const mockedApplicantRoute = jest.mocked(applicantLodgeApplicationRoute);
const mockedResolvePod = jest.mocked(resolveLodgeApplicationPodId);
const mockedResolveCredit = jest.mocked(resolveLodgeApplicationCreditId);

function makeAttachment(overrides: Partial<LodgeDecisionAttachment> = {}): LodgeDecisionAttachment {
  return {
    type: 'lodge_decision',
    podId: 'pod-1',
    listingId: 'listing-1',
    creditId: 'credit-1',
    title: 'Peace Lodge',
    image: null,
    decision: 'accepted',
    ...overrides,
  };
}

describe('MessageLodgeDecisionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  it('sends the applicant to payment when approved', async () => {
    mockedUseAuth.mockReturnValue({ profile: { id: 'user-1', is_admin: false } } as unknown as ReturnType<typeof useAuth>);
    mockedResolveCredit.mockResolvedValue('credit-1');
    const { getByTestId } = await render(<MessageLodgeDecisionCard attachment={makeAttachment()} />);

    fireEvent.press(getByTestId('lodge-decision-card'));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith({ pathname: '/property/pay-slot', params: { id: 'credit-1' } }),
    );
    expect(mockedApplicantRoute).toHaveBeenCalledWith('credit-1');
  });

  it('sends the applicant to the status screen when rejected', async () => {
    mockedUseAuth.mockReturnValue({ profile: { id: 'user-1', is_admin: false } } as unknown as ReturnType<typeof useAuth>);
    mockedResolveCredit.mockResolvedValue('credit-1');
    const { getByTestId } = await render(
      <MessageLodgeDecisionCard attachment={makeAttachment({ decision: 'rejected', reason: 'Room taken' })} />,
    );

    fireEvent.press(getByTestId('lodge-decision-card'));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith({ pathname: '/property/pay-slot', params: { id: 'credit-1' } }),
    );
  });

  it('resolves the credit id for a legacy decision DM that predates the creditId field', async () => {
    mockedUseAuth.mockReturnValue({ profile: { id: 'user-1', is_admin: false } } as unknown as ReturnType<typeof useAuth>);
    mockedResolveCredit.mockResolvedValue('credit-legacy');
    const legacy = makeAttachment({ creditId: undefined });
    const { getByTestId } = await render(<MessageLodgeDecisionCard attachment={legacy} />);

    fireEvent.press(getByTestId('lodge-decision-card'));
    await waitFor(() => expect(mockedResolveCredit).toHaveBeenCalledWith(
      expect.objectContaining({ podId: 'pod-1', userId: 'user-1' }),
    ));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith({ pathname: '/property/pay-slot', params: { id: 'credit-legacy' } }),
    );
  });

  it('reopens the review screen for the admin who sent the decision', async () => {
    mockedUseAuth.mockReturnValue({ profile: { id: 'user-1', is_admin: true } } as unknown as ReturnType<typeof useAuth>);
    mockedResolvePod.mockResolvedValue('pod-1');
    const { getByTestId } = await render(<MessageLodgeDecisionCard attachment={makeAttachment()} isMe />);

    fireEvent.press(getByTestId('lodge-decision-card'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/lodge-reservation/pod-1'));
    expect(mockedAdminRoute).toHaveBeenCalledWith('pod-1');
  });

  it('resolves a legacy admin decision DM that only has a creditId to the real pod id', async () => {
    mockedUseAuth.mockReturnValue({ profile: { id: 'user-1', is_admin: true } } as unknown as ReturnType<typeof useAuth>);
    mockedResolvePod.mockResolvedValue('pod-legacy');
    const legacy = makeAttachment({ podId: '' });
    const { getByTestId } = await render(<MessageLodgeDecisionCard attachment={legacy} isMe />);

    fireEvent.press(getByTestId('lodge-decision-card'));
    await waitFor(() => expect(mockedResolvePod).toHaveBeenCalled());
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/admin/lodge-reservation/pod-legacy'),
    );
  });

  it('shows an animated error when the applicant credit id cannot be resolved', async () => {
    mockedUseAuth.mockReturnValue({ profile: { id: 'user-1', is_admin: false } } as unknown as ReturnType<typeof useAuth>);
    mockedResolveCredit.mockResolvedValue(null);
    const { getByTestId } = await render(
      <MessageLodgeDecisionCard attachment={makeAttachment({ creditId: undefined })} />,
    );

    fireEvent.press(getByTestId('lodge-decision-card'));
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => expect(getByTestId('lodge-decision-error')).toBeTruthy());
  });

  it('shows an animated error when the admin application cannot be resolved', async () => {
    mockedUseAuth.mockReturnValue({ profile: { id: 'user-1', is_admin: true } } as unknown as ReturnType<typeof useAuth>);
    mockedResolvePod.mockResolvedValue(null);
    const { getByTestId } = await render(
      <MessageLodgeDecisionCard attachment={makeAttachment({ podId: '' })} isMe />,
    );

    fireEvent.press(getByTestId('lodge-decision-card'));
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => expect(getByTestId('lodge-decision-error')).toBeTruthy());
  });
});
