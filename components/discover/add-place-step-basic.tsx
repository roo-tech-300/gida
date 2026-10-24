import { StyleSheet, View } from 'react-native';

import { AddPlaceField, AddPlaceInput } from '@/components/discover/add-place-field';
import {
  PLACE_ADDRESS_MAX,
  PLACE_AREA_MAX,
  PLACE_DESCRIPTION_MAX,
  PLACE_NAME_MAX,
} from '@/constants/place-form';
import { DesignSpacing } from '@/constants/design';
import type { PlaceDraft, PlaceDraftErrors } from '@/types/place';

type Props = {
  draft: PlaceDraft;
  errors: PlaceDraftErrors;
  onChange: <K extends keyof PlaceDraft>(key: K, value: PlaceDraft[K]) => void;
};

export function AddPlaceStepBasic({ draft, errors, onChange }: Props) {
  return (
    <View style={styles.container}>
      <AddPlaceField label="Place Name *" error={errors.name}>
        <AddPlaceInput
          autoCapitalize="words"
          invalid={Boolean(errors.name)}
          maxLength={PLACE_NAME_MAX}
          placeholder="e.g. Kilimanjaro, The Study Room"
          value={draft.name}
          onChangeText={(v) => onChange('name', v)}
        />
      </AddPlaceField>

      <AddPlaceField label="Area / Neighbourhood *" error={errors.area}>
        <AddPlaceInput
          autoCapitalize="words"
          invalid={Boolean(errors.area)}
          maxLength={PLACE_AREA_MAX}
          placeholder="e.g. Gidan Kwano, Bosso, Tunga"
          value={draft.area}
          onChangeText={(v) => onChange('area', v)}
        />
      </AddPlaceField>

      <AddPlaceField label="Street Address (Optional)" error={errors.address}>
        <AddPlaceInput
          autoCapitalize="sentences"
          invalid={Boolean(errors.address)}
          maxLength={PLACE_ADDRESS_MAX}
          placeholder="e.g. 12 Bosso Road, near Campus Gate"
          value={draft.address}
          onChangeText={(v) => onChange('address', v)}
        />
      </AddPlaceField>

      <AddPlaceField
        label="Description *"
        error={errors.description}
        hint={`${draft.description.length}/${PLACE_DESCRIPTION_MAX}`}
      >
        <AddPlaceInput
          multiline
          invalid={Boolean(errors.description)}
          maxLength={PLACE_DESCRIPTION_MAX}
          placeholder="Describe what makes this place special, study vibe, seating, menu or crowd..."
          value={draft.description}
          onChangeText={(v) => onChange('description', v)}
        />
      </AddPlaceField>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    gap: DesignSpacing.md,
  },
});
