import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { HapticTab, isModifiedClick } from './haptic-tab';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

describe('isModifiedClick', () => {
  it('spots open-in-new-tab clicks', () => {
    expect(isModifiedClick({ ctrlKey: true } as never)).toBe(true);
    expect(isModifiedClick({ metaKey: true } as never)).toBe(true);
    expect(isModifiedClick({ button: 1 } as never)).toBe(true);
    expect(isModifiedClick({ button: 0 } as never)).toBe(false);
    expect(isModifiedClick({} as never)).toBe(false);
  });
});

describe('HapticTab on web', () => {
  const Platform = jest.requireActual('react-native').Platform;
  const original = Platform.OS;
  beforeEach(() => { Platform.OS = 'web'; });
  afterEach(() => { Platform.OS = original; });

  it('stops the browser following the tab link and lets the router handle the press', async () => {
    const onPress = jest.fn();
    const preventDefault = jest.fn();
    const { getByTestId } = await render(<HapticTab onPress={onPress} testID="tab"><Text>Discover</Text></HapticTab>);
    fireEvent.press(getByTestId('tab'), { preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('leaves ctrl-click alone so it can open in a new tab', async () => {
    const onPress = jest.fn();
    const preventDefault = jest.fn();
    const { getByTestId } = await render(<HapticTab onPress={onPress} testID="tab"><Text>Discover</Text></HapticTab>);
    fireEvent.press(getByTestId('tab'), { preventDefault, ctrlKey: true });
    expect(preventDefault).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });
});
