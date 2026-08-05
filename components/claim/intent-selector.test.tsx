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
    expect(getByText('2 Slots (1 Roommate)')).toBeTruthy();

    const option2 = getByTestId('intent-option-2');
    fireEvent.press(option2);
    expect(mockSelect).toHaveBeenCalledWith(2);
  });

  it('automatically disables unsupported intent options for odd tier properties', async () => {
    const mockSelect = jest.fn();
    const { getByTestId, getByText } = await render(
      <IntentSelector propertyTier={3} selectedIntent={1} onSelectIntent={mockSelect} />
    );

    const option2 = getByTestId('intent-option-2');
    expect(option2.props.accessibilityState?.disabled ?? option2.props.disabled).toBe(true);
    expect(getByText('Odd-tier rule: Must purchase exactly 1 slot or 100% buyout.')).toBeTruthy();

    fireEvent.press(option2);
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
