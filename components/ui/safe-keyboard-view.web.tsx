import { View, ViewStyle } from 'react-native';

type Props = {
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function SafeKeyboardView({ style, children }: Props) {
  return <View style={style}>{children}</View>;
}
