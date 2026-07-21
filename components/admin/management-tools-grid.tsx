import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function ManagementToolsGrid() {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <Pressable style={[styles.card, styles.cardTall, styles.indigoCard]} onPress={() => router.push('/admin/create-listing')}>
          <BlurView intensity={30} tint="dark" style={styles.glassBlur} />
          <View style={styles.cardContent}>
            <View style={styles.primaryIconWrap}>
              <Ionicons name="add-circle-outline" size={24} color={DesignColors.onPrimary} />
            </View>
            <Text style={styles.cardTitle}>Upload New{'\n'}Property</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.card, styles.cardTall, styles.glassCard]}>
          <BlurView intensity={20} tint="dark" style={styles.glassBlur} />
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Ionicons name="business-outline" size={22} color={DesignColors.primary} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3 Active</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Manage Active{'\n'}Listings</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.card, styles.cardShort, styles.glassCard]}>
          <BlurView intensity={20} tint="dark" style={styles.glassBlur} />
          <View style={styles.cardContent}>
            <Ionicons name="document-text-outline" size={22} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.cardTitle}>Tenant{'\n'}Applications</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.card, styles.cardShort, styles.glassCard]}>
          <BlurView intensity={20} tint="dark" style={styles.glassBlur} />
          <View style={styles.cardContent}>
            <Ionicons name="calendar-outline" size={22} color={DesignColors.onSurfaceVariant} />
            <Text style={styles.cardTitle}>Scheduled{'\n'}Tours</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: DesignSpacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: DesignSpacing.md,
  },
  card: {
    flex: 1,
    borderRadius: DesignRadius.xl + 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  glassCard: {
    backgroundColor: 'rgba(24,24,28,0.6)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  indigoCard: {
    backgroundColor: 'rgba(54,71,54,0.15)',
    borderColor: 'rgba(94,124,94,0.2)',
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  cardTall: {
    height: 176,
  },
  cardShort: {
    height: 160,
  },
  cardContent: {
    flex: 1,
    padding: DesignSpacing.lg - 4,
    justifyContent: 'space-between',
  },
  primaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '3deg' }],
    shadowColor: DesignColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: 'rgba(54,71,54,0.25)',
    borderRadius: DesignRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DesignColors.onPrimaryContainer,
    fontFamily,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: DesignColors.onSurface,
    fontFamily,
  },
});
