import type { GestureResponderEvent, PressableProps } from 'react-native';
import { Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

type WebClickEvent = GestureResponderEvent & {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

/** Ctrl/Cmd/Shift/Alt or a non-left click means "open in a new tab": leave that to the browser. */
export function isModifiedClick(event: WebClickEvent): boolean {
  return Boolean(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button != null && event.button !== 0));
}

/**
 * Tab button with a soft haptic on iOS.
 * On web the tab carries an `href`, so the browser would follow the link and reload the whole app on
 * every tab change. A plain click is handled by the router instead, so screens keep their state.
 */
export function HapticTab(props: PressableProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      onPress={(event) => {
        if (Platform.OS === 'web') {
          if (isModifiedClick(event as WebClickEvent)) return;
          event.preventDefault?.();
        }
        props.onPress?.(event);
      }}
    />
  );
}
