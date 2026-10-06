import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

type TourEnablementToggleProps = {
  enableSelfGuided: boolean;
  enableGuided: boolean;
  onChange: (next: { enableSelfGuidedTour?: boolean; enableGuidedTour?: boolean }) => void;
};

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldCopy}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldDesc}>{description}</Text>
        </View>
        <TouchableOpacity
          style={[styles.switchContainer, enabled ? styles.switchOn : styles.switchOff]}
          onPress={onToggle}
          accessible={true}
          accessibilityRole="switch"
          accessibilityState={{ checked: enabled }}
          accessibilityLabel={`Toggle ${label}`}
        >
          <Text style={styles.switchText}>{enabled ? 'Enabled' : 'Disabled'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function TourEnablementToggle({
  enableSelfGuided,
  enableGuided,
  onChange,
}: TourEnablementToggleProps) {
  const toursDisabled = !enableSelfGuided && !enableGuided;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tour Availability</Text>
      <Text style={styles.sectionHint}>
        Choose how students can visit this listing. Tours are booked and paid in-app.
      </Text>

      <ToggleRow
        label="Self-guided Tour"
        description="Students visit on their own using the in-app map and property details."
        enabled={enableSelfGuided}
        onToggle={() => onChange({ enableSelfGuidedTour: !enableSelfGuided })}
      />
      <ToggleRow
        label="Guided Tour"
        description="A house admin walks the student through the property at a scheduled time."
        enabled={enableGuided}
        onToggle={() => onChange({ enableGuidedTour: !enableGuided })}
      />

      {toursDisabled && (
        <Text style={styles.warningText}>
          Both tour types are off — students will not be able to book any tour for this listing.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionTitle: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  sectionHint: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginTop: -8,
  },
  field: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    backgroundColor: DesignColors.surfaceContainer,
    padding: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldCopy: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  fieldDesc: {
    fontSize: 12,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
  },
  switchOn: {
    backgroundColor: DesignColors.successContainer,
  },
  switchOff: {
    backgroundColor: DesignColors.dangerContainer,
  },
  switchText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  warningText: {
    ...DesignTypography.bodyMd,
    fontSize: 13,
    color: DesignColors.danger,
    fontFamily,
  },
});