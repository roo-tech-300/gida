import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { PodShelfCard } from '@/components/home/pod-shelf-card';
import { MOCK_RECOMMENDED_PODS } from '@/dummy/pod-shelf-mock';

const HEIGHT = 800;

describe('PodShelfCard', () => {
  it('renders the shelf header', async () => {
    const { getByText } = await render(
      <PodShelfCard
        pods={MOCK_RECOMMENDED_PODS.slice(0, 3)}
        height={HEIGHT}
        onOpenPod={jest.fn()}
      />,
    );

    expect(getByText('Groups saving for these lodges')).toBeTruthy();
    expect(getByText('3 groups match your budget and campus.')).toBeTruthy();
  });

  it('renders a lone pod as a hero tile with a singular footnote', async () => {
    const { getByText } = await render(
      <PodShelfCard
        pods={MOCK_RECOMMENDED_PODS.slice(0, 1)}
        height={HEIGHT}
        onOpenPod={jest.fn()}
      />,
    );

    expect(getByText('1 group matches your budget and campus.')).toBeTruthy();
    expect(getByText('1 of 3 filled')).toBeTruthy();
    expect(getByText(/₦400k/)).toBeTruthy();
    expect(getByText('2 seats open')).toBeTruthy();
  });

  it('opens the pod the viewer taps', async () => {
    const onOpenPod = jest.fn();
    const { getByLabelText } = await render(
      <PodShelfCard pods={MOCK_RECOMMENDED_PODS} height={HEIGHT} onOpenPod={onOpenPod} />,
    );

    const firstPod = MOCK_RECOMMENDED_PODS[0];
    fireEvent.press(getByLabelText(/Sunrise Lodge.*2 seats open/));

    expect(onOpenPod).toHaveBeenCalledWith(firstPod);
  });

  it('renders nothing without pods', async () => {
    const { toJSON } = await render(
      <PodShelfCard pods={[]} height={HEIGHT} onOpenPod={jest.fn()} />,
    );

    expect(toJSON()).toBeNull();
  });
});
