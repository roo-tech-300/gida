import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import type { TourBookingStatus } from '@/types/tour-booking';

export const TOUR_STATUS_META: Record<TourBookingStatus, { label: string; color: string; background: string }> = {
  booked: { label: 'Confirmed', color: DesignColors.success, background: DesignColors.successContainer },
  pending_payment: { label: 'Pending', color: DesignColors.warning, background: DesignColors.warningContainer },
  completed: { label: 'Completed', color: DesignColors.info, background: DesignColors.infoContainer },
  cancelled: { label: 'Cancelled', color: DesignColors.danger, background: DesignColors.dangerContainer },
  expired: { label: 'Expired', color: DesignColors.onSurfaceVariant, background: DesignColors.borderSoft },
};

export function TourStatusChip({ status }: { status: TourBookingStatus }) {
  const meta = TOUR_STATUS_META[status];
  return (
    <View style={[styles.chip, { backgroundColor: meta.background }]}>
      <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999 },
  chipText: { ...DesignTypography.labelSm, fontFamily, fontWeight: '600' },
});
