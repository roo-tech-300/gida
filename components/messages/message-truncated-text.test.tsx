import { act, fireEvent, render } from '@testing-library/react-native';
import { type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';

import { MessageTruncatedText } from '@/components/messages/message-truncated-text';

const MULTILINE_TEXT = Array.from({ length: 25 }, (_, index) => `Line ${index + 1}`).join('\n');
const SINGLE_LINE_TEXT = 'A long line of text that wraps into multiple lines in the bubble.';

function layoutEvent(lineCount: number): NativeSyntheticEvent<TextLayoutEventData> {
  return {
    nativeEvent: { lines: Array.from({ length: lineCount }, () => ({ text: 'x' })) },
  } as unknown as NativeSyntheticEvent<TextLayoutEventData>;
}

function heightLayoutEvent(height: number) {
  return {
    nativeEvent: { layout: { x: 0, y: 0, width: 200, height } },
  };
}

describe('MessageTruncatedText', () => {
  it('shows no Read more link for short messages', async () => {
    const { queryByText } = await render(
      <MessageTruncatedText text="Short message" collapsedLines={15} />,
    );

    expect(queryByText('Read more')).toBeNull();
  });

  it('shows Read more immediately for messages with more newline-separated lines than the cap', async () => {
    const { getByTestId, getByText, queryByText } = await render(
      <MessageTruncatedText text={MULTILINE_TEXT} collapsedLines={15} />,
    );

    expect(getByText('Read more')).toBeTruthy();
    const toggle = getByTestId('message-truncate-toggle');

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(queryByText('Read more')).toBeNull();
    expect(getByText('Show less')).toBeTruthy();

    await act(async () => {
      fireEvent.press(toggle);
    });
    expect(getByText('Read more')).toBeTruthy();
  });

  it('shows Read more once textLayout reports more lines than the cap, and expands on press', async () => {
    const { getByTestId, getByText, queryByText } = await render(
      <MessageTruncatedText text={SINGLE_LINE_TEXT} collapsedLines={15} />,
    );

    expect(queryByText('Read more')).toBeNull();

    // The probe Text is rendered and carries the layout trigger
    const probe = getByTestId('message-truncation-probe', { includeHiddenElements: true });

    await act(async () => {
      fireEvent(probe, 'textLayout', layoutEvent(25));
    });

    expect(getByText('Read more')).toBeTruthy();
    const toggle = getByTestId('message-truncate-toggle');

    await act(async () => {
      fireEvent.press(toggle);
    });

    expect(queryByText('Read more')).toBeNull();
    expect(getByText('Show less')).toBeTruthy();

    await act(async () => {
      fireEvent.press(toggle);
    });
    expect(getByText('Read more')).toBeTruthy();
  });

  it('keeps the link hidden when textLayout reports lines within the cap', async () => {
    const { getByTestId, queryByText } = await render(
      <MessageTruncatedText text="A short-ish message" collapsedLines={15} />,
    );

    const probe = getByTestId('message-truncation-probe', { includeHiddenElements: true });

    await act(async () => {
      fireEvent(probe, 'textLayout', layoutEvent(3));
    });

    expect(queryByText('Read more')).toBeNull();
  });

  it('shows Read more when the unclamped probe is taller than the clamped body', async () => {
    const { getByTestId, getByText, queryByText } = await render(
      <MessageTruncatedText text={SINGLE_LINE_TEXT} collapsedLines={15} />,
    );

    expect(queryByText('Read more')).toBeNull();

    const body = getByTestId('message-truncated-body');
    const probe = getByTestId('message-truncation-probe', { includeHiddenElements: true });

    await act(async () => {
      fireEvent(body, 'layout', heightLayoutEvent(210));
      fireEvent(probe, 'layout', heightLayoutEvent(420));
    });

    expect(getByText('Read more')).toBeTruthy();
  });

  it('keeps the link hidden when probe and clamped heights match', async () => {
    const { getByTestId, queryByText } = await render(
      <MessageTruncatedText text="Fits in the bubble" collapsedLines={15} />,
    );

    const body = getByTestId('message-truncated-body');
    const probe = getByTestId('message-truncation-probe', { includeHiddenElements: true });

    await act(async () => {
      fireEvent(body, 'layout', heightLayoutEvent(42));
      fireEvent(probe, 'layout', heightLayoutEvent(42));
    });

    expect(queryByText('Read more')).toBeNull();
  });
});
