import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { WAITLIST_WHATSAPP_CHANNEL_URL } from '@/constants/launch';

const SOCIAL_LINKS = [
  { label: 'WhatsApp', icon: 'logo-whatsapp', url: WAITLIST_WHATSAPP_CHANNEL_URL, color: '#25D366' },
  { label: 'Facebook', icon: 'logo-facebook', url: 'https://www.facebook.com/share/1LdcNi7zJE/', color: '#7AA7FF' },
  { label: 'TikTok', icon: 'logo-tiktok', url: 'https://www.tiktok.com/@gida_properties', color: '#F4F2F8' },
  { label: 'Instagram', icon: 'logo-instagram', url: 'https://www.instagram.com/gida_properties', color: '#F19BB2' },
] as const;

type SocialLinksFooterProps = {
  onOpenLink: (url: string) => void;
};

export function SocialLinksFooter({ onOpenLink }: SocialLinksFooterProps) {
  return (
    <Animated.View entering={FadeInUp.duration(600).delay(350)} style={styles.footer}>
      <View style={styles.topLine} />
      <Text style={styles.eyebrow}>STAY IN THE LOOP</Text>
      <Text style={styles.caption}>Follow Gida for updates, sneak peeks and more.</Text>
      <View style={styles.links}>
        {SOCIAL_LINKS.map((link, index) => (
          <Animated.View key={link.label} entering={FadeInUp.duration(400).delay(450 + index * 90)}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Visit Gida on ${link.label}`}
              onPress={() => onOpenLink(link.url)}
              style={({ pressed, hovered }) => [styles.socialButton, (pressed || hovered) && styles.socialButtonActive]}>
              <Ionicons name={link.icon} size={21} color={link.color} />
            </Pressable>
          </Animated.View>
        ))}
      </View>
      <Text style={styles.brand}>GIDA <Text style={styles.dot}>•</Text> FIND YOUR PLACE</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingHorizontal: DesignSpacing.lg,
    paddingTop: DesignSpacing.md,
    paddingBottom: DesignSpacing.md,
    gap: DesignSpacing.xs,
  },
  topLine: {
    width: 44,
    height: 2,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primaryBright,
    marginBottom: DesignSpacing.sm,
  },
  eyebrow: {
    ...DesignTypography.labelCaps,
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  caption: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    gap: DesignSpacing.md,
    marginTop: DesignSpacing.sm,
    marginBottom: DesignSpacing.xs,
  },
  socialButton: {
    width: 46,
    height: 46,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.glassFill,
    borderWidth: 1,
    borderColor: DesignColors.glassBorder,
  },
  socialButtonActive: {
    transform: [{ scale: 1.12 }],
    backgroundColor: DesignColors.primaryTint,
    borderColor: DesignColors.primaryTintBorder,
  },
  brand: {
    ...DesignTypography.labelCaps,
    color: DesignColors.outline,
    fontFamily,
    fontSize: 10,
    letterSpacing: 1.4,
    marginTop: DesignSpacing.xs,
  },
  dot: {
    color: DesignColors.primaryBright,
  },
});
