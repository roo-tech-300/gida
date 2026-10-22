import { useCallback, useState } from 'react';

import { HelpSupportModal } from './help-support-modal';
import { ProfileRow } from './profile-row';

export function HelpSupportEntry() {
  const [modalOpen, setModalOpen] = useState(false);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const openModal = useCallback(() => setModalOpen(true), []);

  return (
    <>
      <ProfileRow
        icon="headset-outline"
        label="Help & Support"
        onPress={openModal}
      />
      <HelpSupportModal visible={modalOpen} onClose={closeModal} />
    </>
  );
}
