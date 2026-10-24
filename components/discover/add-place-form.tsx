import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors } from '@/constants/design';
import { PlaceDraft, PlaceDraftErrors } from '@/types/place';
import { PLACE_NAME_MAX, PLACE_AREA_MAX, PLACE_DESCRIPTION_MAX } from '@/constants/place-form';
import { AddPlaceField, AddPlaceInput } from '@/components/discover/add-place-field';
import { AddPlaceCategoryPicker } from '@/components/discover/add-place-category-picker';

type FormProps = {
  draft: PlaceDraft;
  errors: PlaceDraftErrors;
  onChange: <K extends keyof PlaceDraft>(field: K, value: PlaceDraft[K]) => void;
  images: string[];
  onImageAdd: () => void;
  onImageRemove: (index: number) => void;
};

export function AddPlaceForm({ draft, errors, onImageAdd, onChange }: FormProps) {
  return (
    <View style={styles.form}>
      <AddPlaceField label="Place name" error={errors.name}>
        <AddPlaceInput
          autoCapitalize="words"
          invalid={Boolean(errors.name)}
          maxLength={PLACE_NAME_MAX}
          placeholder="e.g. Café Neo"
          value={draft.name}
          onChangeText={(name) => onChange('name', name)}
        />
      </AddPlaceField>

      <AddPlaceField label="Category">
        <AddPlaceCategoryPicker
          value={draft.category}
          onChange={(category) => onChange('category', category)}
        />
      </AddPlaceField>

      <AddPlaceField label="Area" error={errors.area}>
        <AddPlaceInput
          autoCapitalize="words"
          invalid={Boolean(errors.area)}
          maxLength={PLACE_AREA_MAX}
          placeholder="e.g. Gidan Kwano"
          value={draft.area}
          onChangeText={(area) => onChange('area', area)}
        />
      </AddPlaceField>

      <AddPlaceField label="Description" error={errors.description} hint={`${draft.description.length}/${PLACE_DESCRIPTION_MAX}`}>
        <AddPlaceInput
          multiline
          invalid={Boolean(errors.description)}
          maxLength={PLACE_DESCRIPTION_MAX}
          placeholder="What makes this place worth visiting?"
          value={draft.description}
          onChangeText={(description) => onChange('description', description)}
        />
      </AddPlaceField>

      <View style={styles.imageSection}>
        <Pressable style={styles.addImageButton} onPress={onImageAdd}>
          <Ionicons name="add" size={20} color={DesignColors.primary} />
          <Text style={styles.addImageLabel}> Add Images</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
  },
  imageSection: {
    marginTop: 12,
  },
  addImageButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: DesignColors.glassSoft,
    borderRadius: 20,
  },
  addImageLabel: {
    fontSize: 12,
    color: DesignColors.primary,
  },
});