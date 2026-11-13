import { fireEvent, render } from '@testing-library/react-native';

import { NO_FILTERS } from '@/utils/place-filters';

import { PlaceFiltersSheet } from './place-filters-sheet';

async function setup(filters = NO_FILTERS) {
  const onChange = jest.fn();
  const onClear = jest.fn();
  const onClose = jest.fn();
  const utils = await render(
    <PlaceFiltersSheet visible filters={filters} resultCount={3} onChange={onChange} onClear={onClear} onClose={onClose} />,
  );
  return { ...utils, onChange, onClear, onClose };
}

describe('PlaceFiltersSheet', () => {
  it('sets a filter when a chip is tapped', async () => {
    const { getByText, onChange } = await setup();
    fireEvent.press(getByText('Up to ₦250k'));
    expect(onChange).toHaveBeenCalledWith({ maxBudget: 250_000 });
  });

  it('unsets a filter when the selected chip is tapped again', async () => {
    const { getByText, onChange } = await setup({ ...NO_FILTERS, maxBudget: 250_000 });
    fireEvent.press(getByText('Up to ₦250k'));
    expect(onChange).toHaveBeenCalledWith({ maxBudget: null });
  });

  it('shows Clear all only when a filter is active', async () => {
    expect((await setup()).queryByTestId('place-filter-clear')).toBeNull();
    const active = await setup({ ...NO_FILTERS, area: 'Bosso' });
    fireEvent.press(active.getByTestId('place-filter-clear'));
    expect(active.onClear).toHaveBeenCalled();
  });

  it('closes from the backdrop and the done button, and reports the result count', async () => {
    const { getByTestId, getByText, onClose } = await setup();
    expect(getByText('Show 3 places')).toBeTruthy();
    fireEvent.press(getByTestId('filter-sheet-done'));
    fireEvent.press(getByTestId('filter-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
