import { KeyboardAvoidingView, Platform, ViewStyle } from 'react-native';

type Props = {
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function SafeKeyboardView({ style, children }: Props) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={style}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
