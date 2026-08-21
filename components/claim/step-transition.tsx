import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  stepKey: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const DURATION = 220;

export function StepTransition({ stepKey, children, style }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const previousStep = useRef(stepKey);

  useEffect(() => {
    const forward = stepKey >= previousStep.current;
    previousStep.current = stepKey;

    fade.setValue(0);
    slide.setValue(forward ? 26 : -26);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [stepKey, fade, slide]);

  return (
    <Animated.View style={[styles.container, style, { opacity: fade, transform: [{ translateX: slide }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
