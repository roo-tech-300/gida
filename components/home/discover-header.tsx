import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

type Props = { savedCount: number; onOpenSaved: () => void };

/** Screen title plus the heart that opens the saved shortlist (saved is no longer a tab). */
export function DiscoverHeader({ savedCount, onOpenSaved }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>Discover</Text>
      <Pressable
        onPress={onOpenSaved}
        style={styles.heart}
        accessibilityRole="button"
        accessibilityLabel={savedCount > 0 ? `Saved places, ${savedCount}` : 'Saved places'}
        testID="discover-saved-button"
      >
        <Ionicons name="heart-outline" size={22} color={DesignColors.onSurface} />
        {savedCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{savedCount > 9 ? '9+' : savedCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.sm, paddingBottom: DesignSpacing.md,
  },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.6 },
  heart: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  badge: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: DesignColors.onPrimary, fontFamily },
});
