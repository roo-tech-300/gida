import { StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  intensity?: number;
  tint?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function WebBlurView({ intensity = 20, tint = 'dark', style, children }: Props) {
  const opacity = Math.min(intensity / 100, 1);
  const bgColor = tint === 'dark' ? `rgba(14, 14, 16, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;

  return (
    <View
      style={[{ backgroundColor: bgColor }, style]}
      children={children}
    />
  );
}
