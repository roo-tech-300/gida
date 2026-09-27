import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeOut, ZoomIn } from 'react-native-reanimated';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { AuthBrandHeader } from '@/components/auth/auth-brand-header';
import { SocialLinksFooter } from '@/components/landing/social-links-footer';
import { WaitlistForm } from '@/components/landing/waitlist-form';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { WAITLIST_WHATSAPP_CHANNEL_URL } from '@/constants/launch';
import { useWindowDimensions } from 'react-native';

export function ComingSoonScreen() {
  const { width, height } = useWindowDimensions();
  const isCompactHeight = height < 740;
  const horizontalPadding = width >= 768 ? 48 : 20;
  const contentWidth = Math.min(width - horizontalPadding * 2, width >= 768 ? 520 : 400);
  const logoSize = isCompactHeight ? 80 : 112;
  const [joined, setJoined] = useState(false);

  const openLink = (url: string) => {
    Linking.openURL(url).catch((error) => {
      console.error('[ComingSoonScreen] Failed to open link:', error);
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AuthBackgroundBubbles />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { width: contentWidth, minHeight: isCompactHeight ? undefined : '100%' }]}>
            <Animated.View entering={FadeInDown.duration(500)}>
              <AuthBrandHeader size="large" logoSize={logoSize} />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.copySection}>
              <Text style={styles.title}>Gida is almost ready</Text>
              <Text style={styles.subtitle}>
                We&apos;re putting the finishing touches on the app. Join the waitlist and we&apos;ll let you know the moment it&apos;s live.
              </Text>
            </Animated.View>

            {joined ? (
              <Animated.View entering={FadeInDown.duration(450)} exiting={FadeOut.duration(150)} style={styles.joinedSection}>
                <Animated.View entering={ZoomIn.duration(450).delay(100)} style={styles.joinedBadge}>
                  <Ionicons name="checkmark" size={28} color={DesignColors.onPrimary} />
                </Animated.View>
                <Text style={styles.joinedTitle}>You&apos;re on the list!</Text>
                <Text style={styles.joinedSubtitle}>While you wait, come say hi on social:</Text>
              </Animated.View>
            ) : (
              <Animated.View exiting={FadeOut.duration(150)}>
                <WaitlistForm onJoined={() => setJoined(true)} />
              </Animated.View>
            )}
          </View>
          <SocialLinksFooter onOpenLink={openLink} />
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
    minHeight: 0,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  content: {
    justifyContent: 'center',
    gap: DesignSpacing.lg,
    zIndex: 1,
  },
  copySection: {
    gap: DesignSpacing.sm,
  },
  title: {
    ...DesignTypography.headlineLg,
    color: DesignColors.textPrimary,
    fontFamily,
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  joinedSection: {
    gap: DesignSpacing.md,
    alignItems: 'center',
  },
  joinedBadge: {
    width: 56,
    height: 56,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedTitle: {
    ...DesignTypography.titleMd,
    color: DesignColors.textPrimary,
    fontFamily,
    textAlign: 'center',
  },
  joinedSubtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
});
