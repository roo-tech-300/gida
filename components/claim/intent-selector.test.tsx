import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { IntentSelector } from './intent-selector';

describe('IntentSelector UI Integration', () => {
  it('renders all occupancy options for a property and selects on press', async () => {
    const mockSelect = jest.fn();
    const { getByTestId, getByText } = await render(
      <IntentSelector propertyTier={4} selectedIntent={1} onSelectIntent={mockSelect} />
    );

    expect(getByText('CHOOSE YOUR RESERVATION SIZE')).toBeTruthy();
    expect(getByText('Just Me (Private)')).toBeTruthy();
    expect(getByText('Live with 1 Roommate (2 People Total)')).toBeTruthy();

    const option2 = getByTestId('intent-option-2');
    fireEvent.press(option2);
    expect(mockSelect).toHaveBeenCalledWith(2);
  });

  it('selects the solo (Just Me) occupancy when pressed', async () => {
    const mockSelect = jest.fn();
    const { getByTestId } = await render(
      <IntentSelector propertyTier={3} selectedIntent={1} onSelectIntent={mockSelect} />
    );

    fireEvent.press(getByTestId('intent-option-1'));
    expect(mockSelect).toHaveBeenCalledWith(1);
  });

  it('offers every occupancy from 1 to tier, including odd tiers', async () => {
    const mockSelect = jest.fn();
    const { getByTestId, queryByTestId } = await render(
      <IntentSelector propertyTier={3} selectedIntent={1} onSelectIntent={mockSelect} />
    );

    expect(queryByTestId('intent-option-1')).toBeTruthy();
    expect(queryByTestId('intent-option-2')).toBeTruthy();
    expect(queryByTestId('intent-option-3')).toBeTruthy();
    expect(queryByTestId('intent-option-4')).toBeNull();

    fireEvent.press(getByTestId('intent-option-2'));
    expect(mockSelect).toHaveBeenCalledWith(2);
  });
});
