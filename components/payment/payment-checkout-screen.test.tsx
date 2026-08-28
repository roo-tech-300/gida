import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ToastProvider } from '@/components/ui/toast-card';
import { useUserSlotCredits } from '@/hooks/use-liquidity';
import { PaymentCheckoutScreen } from './payment-checkout-screen';
import type { SlotCredit } from '@/types/liquidity';

const mockPayCredit = jest.fn().mockResolvedValue({ status: 'paid_unmatched' });

jest.mock('@/hooks/use-liquidity', () => ({
  useUserSlotCredits: jest.fn(),
  useMarkSlotCreditPaid: jest.fn(() => ({ mutateAsync: mockPayCredit })),
  useExpireSlotCredit: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

const PENDING_CREDIT: SlotCredit = {
  id: 'credit-test-1',
  user_id: 'usr-current-student',
  estate_id: 'est-101',
  listing_id: 'listing-test-1',
  property_tier: 2,
  intent_size: 1,
  target_occupancy: 2,
  status: 'booked_pending_claim',
  invite_code: 'GIDA-POD-0001',
  created_at: new Date().toISOString(),
  payment_deadline: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
  amount_paid: 610000,
  estate: {
    id: 'est-101',
    name: 'Gida Prestige Residence',
    campus: 'UNILAG',
    property_tier: 2,
    price_per_annum: 1200000,
    physical_rooms_inventory: 5,
    abstract_slots_available: 20,
    rules: [],
    amenities: [],
  },
};

function mockCredits(credits: SlotCredit[]) {
  (useUserSlotCredits as jest.Mock).mockReturnValue({
    data: credits,
    isLoading: false,
    isRefetching: false,
    isError: false,
    refetch: jest.fn(),
  });
}

describe('PaymentCheckoutScreen (dummy payment flow)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the amount due and a pay button for a pending credit', async () => {
    mockCredits([PENDING_CREDIT]);
    const { getByTestId, getByText } = await render(
      <ToastProvider>
        <PaymentCheckoutScreen creditId="credit-test-1" />
      </ToastProvider>,
    );

    expect(getByTestId('checkout-amount')).toBeTruthy();
    expect(getByText('₦610,000')).toBeTruthy();
    expect(getByTestId('checkout-pay-btn')).toBeTruthy();
    expect(getByTestId('method-card')).toBeTruthy();
    expect(getByTestId('method-transfer')).toBeTruthy();
    expect(getByTestId('method-ussd')).toBeTruthy();
  });

  it('processes payment after the simulated delay and shows the success screen', async () => {
    mockCredits([PENDING_CREDIT]);
    const { getByTestId, findByTestId } = await render(
      <ToastProvider>
        <PaymentCheckoutScreen creditId="credit-test-1" />
      </ToastProvider>,
    );

    await act(async () => {
      fireEvent.press(getByTestId('checkout-pay-btn'));
      await jest.advanceTimersByTimeAsync(1500);
    });

    expect(mockPayCredit).toHaveBeenCalledWith('credit-test-1');
    expect(await findByTestId('checkout-success')).toBeTruthy();
    expect(await findByTestId('checkout-continue')).toBeTruthy();
  });
});
