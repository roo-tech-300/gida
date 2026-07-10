import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { type TourInfo } from '@/dummy/messages-mock';

export function MessageTourCard({ tour }: { tour: TourInfo }) {
  return (
    <Pressable style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={tour.image} style={styles.image} />
        <View style={styles.overlay} />
        <View style={styles.imageLabel}>
          <Text style={styles.badge}>Upcoming Tour</Text>
          <Text style={styles.imageTitle}>{tour.propertyName}, {tour.unit}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Ionicons name="calendar-outline" size={18} color={DesignColors.primary} />
          <Text style={styles.footerText}>{tour.date}</Text>
        </View>
        <View style={styles.footerRow}>
          <Ionicons name="time-outline" size={18} color={DesignColors.primary} />
          <Text style={styles.footerText}>{tour.time}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={DesignColors.outlineVariant} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: DesignRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: DesignColors.surfaceContainerLow,
    marginBottom: DesignSpacing.md,
  },
  imageWrap: {
    height: 192,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  imageLabel: {
    position: 'absolute',
    bottom: DesignSpacing.md,
    left: DesignSpacing.md,
    gap: 4,
  },
  badge: {
    ...DesignTypography.labelCaps,
    color: DesignColors.secondary,
    fontFamily,
  },
  imageTitle: {
    ...DesignTypography.headlineMd,
    color: DesignColors.textPrimary,
    fontFamily,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.lg,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.md,
    backgroundColor: 'rgba(42, 42, 44, 0.6)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.textPrimary,
    fontFamily,
  },
});
