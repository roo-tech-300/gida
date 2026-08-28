import { useEffect, useState } from 'react';

import { RegionField, RegionFormBody, RegionInput, RegionSubmitButton } from '@/components/admin/region-form-elements';
import { RegionModalShell } from '@/components/admin/region-modal-shell';
import { SearchableSelect, type SelectItem } from '@/components/ui/searchable-select';

const NONE = 'none';

type Props = {
  visible: boolean;
  regionName: string;
  initialParentId: string | null;
  parentItems: SelectItem[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (input: { name: string; parentId: string | null }) => void;
};

export function EditRegionModal({ visible, regionName, initialParentId, parentItems, isPending, onClose, onConfirm }: Props) {
  const [name, setName] = useState(regionName);
  const [parentId, setParentId] = useState<string>(initialParentId ?? NONE);

  useEffect(() => {
    if (visible) {
      setName(regionName);
      setParentId(initialParentId ?? NONE);
    }
  }, [visible, regionName, initialParentId]);

  const canSubmit = name.trim().length > 0 && !isPending;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm({ name: name.trim(), parentId: parentId === NONE ? null : parentId });
  };

  return (
    <RegionModalShell
      visible={visible}
      title="Edit Region"
      onClose={onClose}
      footer={<RegionSubmitButton label="Save Changes" isPending={isPending} disabled={!canSubmit} onPress={handleConfirm} />}
    >
      <RegionFormBody>
        <RegionField label="Region name">
          <RegionInput placeholder="e.g. North America" value={name} onChangeText={setName} />
        </RegionField>

        <SearchableSelect
          icon="git-network-outline"
          placeholder="Select parent region"
          hint="Moving a region also moves its sub-regions and updates all admin access."
          selectedId={parentId}
          items={parentItems}
          onSelect={setParentId}
        />
      </RegionFormBody>
    </RegionModalShell>
  );
}
