import { useEffect, useState } from 'react';

import { RegionField, RegionFormBody, RegionInput, RegionSubmitButton } from '@/components/admin/region-form-elements';
import { RegionModalShell } from '@/components/admin/region-modal-shell';
import { SearchableSelect, type SelectItem } from '@/components/ui/searchable-select';

const NONE = 'none';

type Props = {
  visible: boolean;
  initialParentId: string | null;
  regions: { id: string; name: string }[];
  adminItems: SelectItem[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (input: { name: string; parentId: string | null; adminId: string | null }) => void;
};

export function CreateRegionModal({ visible, initialParentId, regions, adminItems, isPending, onClose, onConfirm }: Props) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>(initialParentId ?? NONE);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setParentId(initialParentId ?? NONE);
      setAdminId(null);
    }
  }, [visible, initialParentId]);

  const parentItems: SelectItem[] = [
    { id: NONE, label: 'None - Make Root' },
    ...regions.map((region) => ({ id: region.id, label: region.name })),
  ];

  const canSubmit = name.trim().length > 0 && !isPending;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm({
      name: name.trim(),
      parentId: parentId === NONE ? null : parentId,
      adminId,
    });
  };

  return (
    <RegionModalShell
      visible={visible}
      title="Create Region"
      onClose={onClose}
      footer={<RegionSubmitButton label="Create Region" isPending={isPending} disabled={!canSubmit} onPress={handleConfirm} />}
    >
      <RegionFormBody>
        <RegionField label="Region name">
          <RegionInput placeholder="e.g. North America" value={name} onChangeText={setName} />
        </RegionField>

        <SearchableSelect
          icon="git-network-outline"
          placeholder="Select parent region"
          hint="Leave as root to make this a top-level region."
          selectedId={parentId}
          items={parentItems}
          onSelect={setParentId}
        />

        <SearchableSelect
          icon="person-outline"
          placeholder="Optional - assign a regional admin"
          hint="You can assign an admin later from the region menu."
          selectedId={adminId}
          items={adminItems}
          onSelect={setAdminId}
        />
      </RegionFormBody>
    </RegionModalShell>
  );
}
