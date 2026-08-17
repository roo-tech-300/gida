import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { Pod } from '@/types/liquidity';

type Props = {
  code: string;
  validating: boolean;
  error: string | null;
  pod: Pod | null;
  onChangeCode: (value: string) => void;
  onValidate: () => void;
  onExitJoin: () => void;
};

export function InviteCodeInput({ code, validating, error, pod, onChangeCode, onValidate, onExitJoin }: Props) {
  const canValidate = code.trim().length >= 6 && !validating;
  const seatNumber = pod ? pod.current_total_intent + 1 : 0;
  const totalSeats = pod?.target_occupancy ?? 0;
  const seatsLeft = pod ? Math.max(0, totalSeats - pod.current_total_intent) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.fieldRow}>
        <TextInput
          style={styles.input}
          placeholder="GIDA-POD-XXXXXXXXXXXX"
          placeholderTextColor={DesignColors.onSurfaceVariant}
          value={code}
          onChangeText={onChangeCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={21}
          onSubmitEditing={onValidate}
          returnKeyType="go"
          testID="join-code-input"
        />
        <Pressable
          style={[styles.validateBtn, !canValidate && styles.validateBtnDisabled]}
          onPress={onValidate}
          disabled={!canValidate}
          testID="join-code-validate"
        >
          {validating ? (
            <ActivityIndicator color={DesignColors.onPrimary} size="small" />
          ) : (
            <Text style={styles.validateText}>Validate</Text>
          )}
        </Pressable>
      </View>

      {validating && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={DesignColors.primaryBright} />
          <Text style={styles.statusText}>Checking your code…</Text>
        </View>
      )}

      {!validating && error && (
        <View style={[styles.statusRow, styles.errorRow]}>
          <Ionicons name="alert-circle-outline" size={16} color={DesignColors.error} />
          <Text style={[styles.statusText, styles.errorText]}>{error}</Text>
        </View>
      )}

      {!validating && !error && pod && (
        <View style={styles.previewCard} testID="join-preview-card">
          <View style={styles.previewHeader}>
            <View style={styles.previewIcon}>
              <Ionicons name="checkmark" size={14} color={DesignColors.onPrimary} />
            </View>
            <Text style={styles.previewTitle}>Group found</Text>
          </View>
          <Text style={styles.previewSeat}>
            Joining as seat <Text style={styles.previewSeatStrong}>{seatNumber}</Text> of {totalSeats}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { flex: seatNumber }]} />
            <View style={{ flex: Math.max(0, totalSeats - seatNumber) }} />
          </View>
          <Text style={styles.previewHint}>
            {seatsLeft === 1 ? 'You\'re taking the last seat in the group.' : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} still open.`}
          </Text>
        </View>
      )}

      <Pressable style={styles.backLink} onPress={onExitJoin} hitSlop={8} testID="join-exit">
        <Ionicons name="arrow-back" size={15} color={DesignColors.onSurfaceVariant} />
        <Text style={styles.backText}>Not joining a group? Start your own</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: DesignSpacing.md },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  input: {
    flex: 1,
    backgroundColor: DesignColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    borderRadius: DesignRadius.md,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 12,
    color: DesignColors.onSurface,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily,
  },
  validateBtn: {
    backgroundColor: DesignColors.primary,
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: 12,
    borderRadius: DesignRadius.md,
    justifyContent: 'center',
  },
  validateBtnDisabled: { opacity: 0.5 },
  validateText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimary, fontWeight: '700', fontFamily },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  statusText: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontFamily },
  errorRow: { paddingHorizontal: 2 },
  errorText: { color: DesignColors.error, lineHeight: 18 },
  previewCard: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
    borderRadius: DesignRadius.md,
    padding: DesignSpacing.md,
    gap: DesignSpacing.sm,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm },
  previewIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DesignColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontWeight: '700', fontFamily },
  previewSeat: { fontSize: 14, color: DesignColors.onSurfaceVariant, fontFamily },
  previewSeatStrong: { color: DesignColors.primaryBright, fontWeight: '800' },
  progressTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: DesignColors.primaryBright, borderRadius: DesignRadius.full },
  previewHint: { fontSize: 12, color: DesignColors.onSurfaceVariant, fontFamily },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 13, color: DesignColors.onSurfaceVariant, fontWeight: '600', fontFamily },
});
