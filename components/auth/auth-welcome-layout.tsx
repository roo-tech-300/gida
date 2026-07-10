import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { AuthBrandHeader } from '@/components/auth/auth-brand-header';
import { AuthLegalFooter } from '@/components/auth/auth-legal-footer';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { useResponsive } from '@/hooks/use-responsive';

type AuthWelcomeLayoutProps = {
  children: ReactNode;
};

export function AuthWelcomeLayout({ children }: AuthWelcomeLayoutProps) {
  const { horizontalMargin, isDesktop, contentWidth } = useResponsive();
  const columnWidth = Math.min(contentWidth, 400);

  return (
    <SafeAreaView style={styles.safe}>
      <AuthBackgroundBubbles />

      <View
        style={[
          styles.content,
          {
            paddingHorizontal: horizontalMargin,
            maxWidth: columnWidth,
            alignSelf: 'center',
            width: '100%',
          },
          isDesktop && styles.contentDesktop,
        ]}>
        <View style={styles.brandSection}>
          <AuthBrandHeader size="large" />
        </View>

        <View style={styles.actionsSection}>{children}</View>

        <View style={styles.footerSection}>
          <AuthLegalFooter />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: DesignSpacing.lg,
    zIndex: 1,
  },
  contentDesktop: {
    paddingVertical: DesignSpacing.xl * 2,
    minHeight: '100%',
  },
  brandSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: DesignSpacing.xl,
  },
  actionsSection: {
    gap: DesignSpacing.sm,
    width: '100%',
    maxWidth: 384,
    alignSelf: 'center',
    paddingBottom: DesignSpacing.marginDesktop,
  },
  footerSection: {
    paddingTop: DesignSpacing.md,
  },
});
