import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react-native';

import { useEscapeKey } from '@/components/claim/use-escape-key';
import { PodJoinSheet } from '@/components/pod/pod-join-sheet';
import { MOCK_RECOMMENDED_PODS } from '@/dummy/pod-shelf-mock';

jest.mock('@/hooks/use-pod-member-navigation', () => ({
  usePodMemberNavigation: () => jest.fn(),
}));

jest.mock('@/components/claim/use-escape-key', () => ({
  useEscapeKey: jest.fn(),
}));

const pod = MOCK_RECOMMENDED_PODS[0];

// Sheet mounts pull in the modal + icon fonts; slow CI boxes need headroom.
jest.setTimeout(30_000);

describe('PodJoinSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows who is already in the group and listens for Escape', async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <PodJoinSheet pod={pod} onClose={onClose} onJoin={jest.fn()} joining={false} />,
    );

    expect(getByText('This group looks good')).toBeTruthy();
    expect(getByText('Amina Bello')).toBeTruthy();
    expect(getByText(/1 of 3 people are already in/)).toBeTruthy();
    expect(useEscapeKey).toHaveBeenCalledWith(onClose, true);
  });

  it('joins the selected pod from the sheet CTA', async () => {
    const onJoin = jest.fn();
    const { getByText } = await render(
      <PodJoinSheet pod={pod} onClose={jest.fn()} onJoin={onJoin} joining={false} />,
    );

    fireEvent.press(getByText('Join This Group'));

    expect(onJoin).toHaveBeenCalledWith(pod);
  });

  it('closes when the backdrop or the close button is pressed', async () => {
    const onClose = jest.fn();
    const { getByLabelText } = await render(
      <PodJoinSheet pod={pod} onClose={onClose} onJoin={jest.fn()} joining={false} />,
    );

    fireEvent.press(getByLabelText('Close pod details'));
    fireEvent.press(getByLabelText('Dismiss pod'));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders nothing without a selection', async () => {
    const { toJSON } = await render(
      <PodJoinSheet pod={null} onClose={jest.fn()} onJoin={jest.fn()} joining={false} />,
    );

    expect(toJSON()).toBeNull();
  });
});
