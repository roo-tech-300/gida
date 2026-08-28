import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors } from '@/constants/design';
import { styles } from './book-tour-modal.styles';
import { stepStyles } from './location-check-step.styles';

type Props = {
  propertyLocation: string;
  latitude?: number;
  longitude?: number;
  isUnlocked: boolean;
  fee: string;
  onUnlock: () => void;
  onGetDirections: () => void;
  onBack: () => void;
};

export function LocationCheckStep({
  propertyLocation,
  latitude,
  longitude,
  isUnlocked,
  fee,
  onUnlock,
  onGetDirections,
  onBack,
}: Props) {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  return (
    <>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scroll}
      >
        <View style={stepStyles.hero}>
          <View style={stepStyles.heroIcon}>
            <Ionicons name="navigate-outline" size={30} color={DesignColors.primaryBright} />
          </View>
          <Text style={stepStyles.heroTitle}>Location & Exterior Check</Text>
          <Text style={stepStyles.heroSubtitle}>
            Visit on your own time and scope out the neighborhood and the exact spot.
          </Text>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationAccent} />
          <View style={styles.locationInfo}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color={DesignColors.primaryBright} />
              <Text style={styles.locationText}>{propertyLocation}</Text>
            </View>
            <View style={stepStyles.cardDivider} />
            {isUnlocked && hasCoords ? (
              <View style={styles.coordsRow}>
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>LATITUDE</Text>
                  <Text style={styles.coordValue}>{latitude!.toFixed(4)}° N</Text>
                </View>
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>LONGITUDE</Text>
                  <Text style={styles.coordValue}>{longitude!.toFixed(4)}° E</Text>
                </View>
              </View>
            ) : (
              <View style={styles.lockedRow}>
                <View style={stepStyles.lockChip}>
                  <Ionicons name="lock-closed" size={15} color={DesignColors.primaryBright} />
                </View>
                <Text style={styles.lockedHint}>
                  Exact GPS coordinates & one-tap directions unlock for ₦{fee}.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={stepStyles.benefitList}>
          <View style={stepStyles.benefitRow}>
            <Ionicons name="checkmark-circle" size={15} color={DesignColors.primaryBright} />
            <Text style={stepStyles.benefitText}>Exterior view only, no interior access.</Text>
          </View>
          <View style={stepStyles.benefitRow}>
            <Ionicons name="checkmark-circle" size={15} color={DesignColors.primaryBright} />
            <Text style={stepStyles.benefitText}>
              Scope out the neighborhood and entry point at your own pace.
            </Text>
          </View>
        </View>

        <Pressable onPress={onBack} style={styles.switchLink}>
          <Text style={styles.switchLinkText}>Back to tour options</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          style={styles.footerBtn}
          onPress={isUnlocked ? onGetDirections : onUnlock}
        >
          <Ionicons
            name={isUnlocked ? 'navigate' : 'lock-open-outline'}
            size={18}
            color={DesignColors.onPrimary}
          />
          <Text style={styles.footerBtnText}>
            {isUnlocked ? 'Get Directions' : 'Unlock Location & Directions'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
