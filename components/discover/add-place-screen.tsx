import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';
import { AddPlaceCategoryPicker } from '@/components/discover/add-place-category-picker';
import type { PlaceCategory } from '@/types/place';

export function AddPlaceScreen() {
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => void router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={DesignColors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Place</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          <AddPlaceCategoryPicker
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </View>

        {selectedCategory && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => setSelectedCategory(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancel selection"
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.nextButton]}
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="Continue to next step"
            >
              <Text style={styles.buttonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color={DesignColors.surfaceContainerLowest} />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: DesignSpacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.md,
    paddingTop: DesignSpacing.md,
  },
  backButton: {
    padding: DesignSpacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
  },
  section: {
    paddingHorizontal: DesignSpacing.md,
    marginTop: DesignSpacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignColors.onSurface,
    fontFamily,
    marginBottom: DesignSpacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: DesignSpacing.md,
    paddingHorizontal: DesignSpacing.md,
    paddingBottom: DesignSpacing.xl,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    height: 50,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainer,
  },
  cancelButton: {
    borderColor: DesignColors.textSecondary,
  },
  nextButton: {
    backgroundColor: DesignColors.primary,
    borderColor: DesignColors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignColors.secondary,
    fontFamily,
  },
});