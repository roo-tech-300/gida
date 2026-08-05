import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { IntentSelector } from './intent-selector';

describe('IntentSelector UI Integration', () => {
  it('renders all available intent options for an even tier property', async () => {
    const mockSelect = jest.fn();
    const { getByTestId, getByText } = await render(
      <IntentSelector propertyTier={4} selectedIntent={2} onSelectIntent={mockSelect} />
    );

    expect(getByText('SELECT YOUR ROOMMATE INTENT')).toBeTruthy();
    expect(getByText('2 Slots (50% Capacity)')).toBeTruthy();

    const option2 = getByTestId('intent-option-2');
    fireEvent.press(option2);
    expect(mockSelect).toHaveBeenCalledWith(2);
  });

  it('automatically disables unsupported intent options for odd tier properties in solo mode', async () => {
    const mockSelect = jest.fn();
    const { getByTestId, getByText } = await render(
      <IntentSelector propertyTier={3} selectedIntent={1} onSelectIntent={mockSelect} isFriendMode={false} />
    );

    const option2 = getByTestId('intent-option-2');
    expect(option2.props.accessibilityState?.disabled ?? option2.props.disabled).toBe(true);
    expect(getByText('Solo odd-tier fairness rule: Cannot purchase partial majority solo. Switch to Friend Coordination or select 1 slot.')).toBeTruthy();

    fireEvent.press(option2);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('unlocks multi-slot selections in odd tier properties under friend group mode', async () => {
    const mockSelect = jest.fn();
    const { getByTestId } = await render(
      <IntentSelector propertyTier={3} selectedIntent={1} onSelectIntent={mockSelect} isFriendMode={true} />
    );

    const option2 = getByTestId('intent-option-2');
    expect(option2.props.accessibilityState?.disabled ?? option2.props.disabled).toBe(false);

    fireEvent.press(option2);
    expect(mockSelect).toHaveBeenCalledWith(2);
  });
});

