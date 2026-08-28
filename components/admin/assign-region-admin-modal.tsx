import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RegionField, RegionFormBody, RegionReadonlyValue, RegionSubmitButton } from '@/components/admin/region-form-elements';
import { RegionModalShell } from '@/components/admin/region-modal-shell';
import { SearchableSelect, type SelectItem } from '@/components/ui/searchable-select';
import { DesignColors, fontFamily } from '@/constants/design';

type Props = {
  visible: boolean;
  regionName: string;
  currentAdminName: string | null;
  adminItems: SelectItem[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (adminId: string) => void;
};

export function AssignRegionAdminModal({ visible, regionName, currentAdminName, adminItems, isPending, onClose, onConfirm }: Props) {
  const [adminId, setAdminId] = useState<string | null>(null);

  const canSubmit = !!adminId && !isPending;

  const handleConfirm = () => {
    if (!adminId) return;
    onConfirm(adminId);
  };

  return (
    <RegionModalShell
      visible={visible}
      title="Assign Admin"
      onClose={onClose}
      footer={
        <RegionSubmitButton
          label={currentAdminName ? 'Assign & Swap' : 'Assign Admin'}
          isPending={isPending}
          disabled={!canSubmit}
          onPress={handleConfirm}
        />
      }
    >
      <RegionFormBody>
        <RegionField label="Region">
          <RegionReadonlyValue value={regionName} />
        </RegionField>

        {currentAdminName && (
          <View style={styles.notice}>
            <Ionicons name="swap-horizontal-outline" size={16} color={DesignColors.warning} />
            <Text style={styles.noticeText}>
              Currently managed by <Text style={styles.noticeBold}>{currentAdminName}</Text>. Assigning a new admin will
              release them from this region.
            </Text>
          </View>
        )}

        <SearchableSelect
          icon="person-add-outline"
          placeholder="Select an admin to assign"
          hint="Select the admin who will manage this region."
          selectedId={adminId}
          items={adminItems}
          onSelect={setAdminId}
        />
      </RegionFormBody>
    </RegionModalShell>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row', gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: DesignColors.warningContainer,
    borderWidth: 1, borderColor: DesignColors.primaryTintBorder,
  },
  noticeText: { flex: 1, fontSize: 13, fontWeight: '500', color: DesignColors.onSurfaceVariant, fontFamily, lineHeight: 18 },
  noticeBold: { fontWeight: '700', color: DesignColors.onSurface },
});
