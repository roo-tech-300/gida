import React from 'react';
import { render } from '@testing-library/react-native';

import { PodShelfTile } from '@/components/home/pod-shelf-tile';
import { MOCK_RECOMMENDED_PODS } from '@/dummy/pod-shelf-mock';

jest.mock('expo-image', () => ({
  Image: () => null,
}));

const pod = MOCK_RECOMMENDED_PODS[0];

describe('PodShelfTile', () => {
  it('renders the lodge image card with title, price, fill count, and seat chip', async () => {
    const { getByText } = await render(<PodShelfTile pod={pod} onPress={jest.fn()} />);

    expect(getByText(pod.listing.title)).toBeTruthy();
    expect(getByText(/₦400k/)).toBeTruthy();
    expect(getByText('1 of 3 filled')).toBeTruthy();
    expect(getByText('2 seats open')).toBeTruthy();
  });

  it('exposes the accessibility label with title, fill, price, and open seats', async () => {
    const { getByLabelText } = await render(<PodShelfTile pod={pod} onPress={jest.fn()} />);

    expect(getByLabelText(/Sunrise Lodge.*2 seats open/)).toBeTruthy();
  });

  it('renders a hero tile for a lone pod', async () => {
    const { getByText } = await render(<PodShelfTile pod={pod} onPress={jest.fn()} hero />);

    expect(getByText(pod.listing.title)).toBeTruthy();
    expect(getByText(/₦400k/)).toBeTruthy();
    expect(getByText('2 seats open')).toBeTruthy();
  });

  it('renders content without crashing when the listing has no photo', async () => {
    const { getByText } = await render(<PodShelfTile pod={pod} onPress={jest.fn()} />);

    expect(getByText(pod.listing.title)).toBeTruthy();
    expect(getByText('1 of 3 filled')).toBeTruthy();
  });
});
