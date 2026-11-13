import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

import { FeedSegmented, type FeedMode } from './feed-segmented';

type Props = { savedCount: number; onOpenSaved: () => void; mode: FeedMode; onModeChange: (mode: FeedMode) => void };

/** One row: title, Places/People switch, and the heart that opens the saved shortlist (saved is no longer a tab). */
export function DiscoverHeader({ savedCount, onOpenSaved, mode, onModeChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>Discover</Text>
      <FeedSegmented mode={mode} onChange={onModeChange} />
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
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.marginMobile, paddingTop: DesignSpacing.sm, paddingBottom: DesignSpacing.sm,
  },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: DesignColors.onSurface, fontFamily, letterSpacing: -0.6 },
  heart: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLow, borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  badge: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primary,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: DesignColors.onPrimary, fontFamily },
});
