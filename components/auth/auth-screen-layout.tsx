import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { AuthBrandHeader } from '@/components/auth/auth-brand-header';
import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';
import { useResponsive } from '@/hooks/use-responsive';

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreenLayout({ title, subtitle, children, footer }: AuthScreenLayoutProps) {
  const { isDesktop, horizontalMargin, authCardWidth } = useResponsive();

  return (
    <SafeAreaView style={styles.safe}>
      <AuthBackgroundBubbles />
      <KeyboardAvoidingView
        behavior= {Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.flex}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalMargin,
              paddingBottom: isDesktop ? DesignSpacing.xl * 2 : DesignSpacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.center, isDesktop && styles.centerDesktop]}>
            <AuthBrandHeader size="compact" />

            <View
              style={[
                styles.card,
                { width: authCardWidth, maxWidth: '100%' },
                Platform.OS === 'web' ? styles.cardWeb : undefined,
              ]}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>

              {children}

              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: DesignSpacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'stretch',
  },
  centerDesktop: {
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    alignSelf: 'center',
    backgroundColor: DesignColors.glassFill,
    borderRadius: DesignRadius.xl,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.lg,
  },
  cardWeb: {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  } as ViewStyle,
  header: {
    gap: DesignSpacing.sm,
  },
  title: {
    ...DesignTypography.headlineLg,
    color: DesignColors.textPrimary,
    fontFamily,
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  footer: {
    marginTop: DesignSpacing.sm,
    alignItems: 'center',
    gap: DesignSpacing.sm,
  },
});
