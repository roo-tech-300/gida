import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MoveInStyleSelector } from './move-in-style-selector';

const baseProps = {
  onChangeMode: jest.fn(),
  friendCode: '',
  onChangeFriendCode: jest.fn(),
};

describe('MoveInStyleSelector', () => {
  it('renders all three move-in options with the selected mode highlighted', async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <MoveInStyleSelector mode="solo" {...baseProps} />
    );

    expect(getByText('Solo')).toBeTruthy();
    expect(getByText('Matchmaking')).toBeTruthy();
    expect(getByText('With Friends')).toBeTruthy();
    expect(getByTestId('mode-solo-badge')).toBeTruthy();
    expect(queryByTestId('mode-friends-badge')).toBeNull();
    expect(queryByTestId('mode-matchmaking-badge')).toBeNull();
    expect(queryByTestId('friend-code-input')).toBeNull();
  });

  it('highlights matchmaking and hides the badges on the other cards', async () => {
    const { getByTestId, queryByTestId } = await render(
      <MoveInStyleSelector mode="matchmaking" {...baseProps} />
    );

    expect(getByTestId('mode-matchmaking-badge')).toBeTruthy();
    expect(queryByTestId('mode-solo-badge')).toBeNull();
    expect(queryByTestId('mode-friends-badge')).toBeNull();
    expect(queryByTestId('friend-code-input')).toBeNull();
  });

  it('shows the invite code input in friends mode', async () => {
    const { getByTestId, getByText } = await render(
      <MoveInStyleSelector mode="friends" {...baseProps} />
    );

    expect(getByTestId('mode-friends-badge')).toBeTruthy();
    expect(getByTestId('friend-code-input')).toBeTruthy();
    expect(getByText('ALREADY HAVE AN INVITE CODE?')).toBeTruthy();
  });

  it('calls onChangeMode when a card is pressed', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <MoveInStyleSelector mode="solo" {...{ ...baseProps, onChangeMode: onChange }} />
    );

    fireEvent.press(getByTestId('mode-matchmaking'));
    expect(onChange).toHaveBeenCalledWith('matchmaking');
  });
});
