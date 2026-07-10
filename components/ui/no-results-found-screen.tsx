import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { FloatingBadge } from '@/components/ui/floating-badge';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

interface NoResultsFoundScreenProps {
  query: string;
  onQueryChange: (value: string) => void;
  onAdjustFilters: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  showSearchBar?: boolean;
  subtitle?: string;
}

export function NoResultsFoundScreen({
  query,
  onQueryChange,
  onAdjustFilters,
  onRefresh,
  refreshing,
  showSearchBar = true,
  subtitle = "We couldn't find any available apartments or active roommate requests matching your current filters around campus.",
}: NoResultsFoundScreenProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const mainTranslateY = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -15, 0],
  });

  const mainRotate = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['6deg', '4deg', '6deg'],
  });

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DesignColors.primary} />
        }
      >
        {showSearchBar ? (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={DesignColors.onSurfaceVariant} />
            <TextInput
              placeholder="Locations and property type"
              placeholderTextColor={DesignColors.onSurfaceVariant}
              returnKeyType="search"
              style={styles.input}
              value={query}
              onChangeText={onQueryChange}
            />
            <Pressable onPress={onAdjustFilters} style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color={DesignColors.onSurfaceVariant} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.center}>
          <View style={styles.iconArea}>
            <Animated.View
              style={[
                styles.mainCard,
                {
                  transform: [{ translateY: mainTranslateY }, { rotate: mainRotate }],
                },
              ]}
            >
              <Ionicons name="home" size={52} color={DesignColors.primary} />

              <FloatingBadge
                icon="location-outline"
                size={18}
                top={-8}
                right={-8}
                rotate="-12deg"
                color={DesignColors.secondary}
                shape="rounded"
              />

              <FloatingBadge
                icon="star-outline"
                size={18}
                bottom={-4}
                left={-14}
                rotate="12deg"
                color={DesignColors.tertiary}
                shape="circle"
                delay={600}
              />
            </Animated.View>
          </View>

          <Text style={styles.title}>Nothing Found</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <Pressable onPress={onAdjustFilters} style={styles.button}>
            <Text style={styles.buttonText}>Adjust filters</Text>
          </Pressable>

          <Text style={styles.hint}>Or view popular spaces nearby</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  scroll: {
    flexGrow: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: DesignSpacing.md,
    minHeight: 56,
    marginHorizontal: DesignSpacing.marginMobile,
    marginTop: DesignSpacing.md,
    borderRadius: 32,
    backgroundColor: 'rgba(26, 26, 30, 0.45)',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    paddingVertical: 0,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: DesignSpacing.md,
  },
  iconArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSpacing.sm,
  },
  mainCard: {
    width: 144,
    height: 144,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 27, 29, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
    marginTop: DesignSpacing.sm,
  },
  buttonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
  hint: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    marginTop: -DesignSpacing.xs,
  },
});
