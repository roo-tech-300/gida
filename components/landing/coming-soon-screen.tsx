import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { AuthBrandHeader } from '@/components/auth/auth-brand-header';
import { AuthButton } from '@/components/auth/auth-button';
import { WaitlistForm } from '@/components/landing/waitlist-form';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { WAITLIST_WHATSAPP_CHANNEL_URL } from '@/constants/launch';
import { useResponsive } from '@/hooks/use-responsive';

export function ComingSoonScreen() {
  const { horizontalMargin, contentWidth } = useResponsive();
  const [joined, setJoined] = useState(false);

  const handleOpenWhatsapp = () => {
    Linking.openURL(WAITLIST_WHATSAPP_CHANNEL_URL).catch((error) => {
      console.error('[ComingSoonScreen] Failed to open WhatsApp channel:', error);
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AuthBackgroundBubbles />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.content, { paddingHorizontal: horizontalMargin, maxWidth: Math.min(contentWidth, 400) }]}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <AuthBrandHeader size="large" />
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
              <Text style={styles.joinedSubtitle}>
                We&apos;ll email you at launch. For updates in the meantime, hop into our WhatsApp channel.
              </Text>
              <AuthButton label="Join our WhatsApp channel" onPress={handleOpenWhatsapp} />
            </Animated.View>
          ) : (
            <Animated.View exiting={FadeOut.duration(150)}>
              <WaitlistForm onJoined={() => setJoined(true)} />
            </Animated.View>
          )}
        </View>
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    gap: DesignSpacing.xl,
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
