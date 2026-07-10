import { type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { useResponsive } from '@/hooks/use-responsive';

type OnboardingLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function OnboardingLayout({ children, footer }: OnboardingLayoutProps) {
  const { horizontalMargin, isDesktop } = useResponsive();

  return (
    <SafeAreaView style={styles.safe}>
      <AuthBackgroundBubbles />
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0} style={styles.flex}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingHorizontal: horizontalMargin,
              paddingBottom: isDesktop ? DesignSpacing.xl * 2 : DesignSpacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>{children}</View>
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  flex: {
    flex: 1,
    zIndex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: DesignSpacing.xl,
  },
  inner: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  innerDesktop: {
    paddingVertical: DesignSpacing.xl,
  },
});
