import { useCallback, useState } from 'react';
import { useNotificationPermission } from '@/src/use-notification-permission-platform';

const PROMPT_STORAGE_PREFIX = 'gida.notification_prompted.';

function isPromptDismissed(contextKey: string): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(`${PROMPT_STORAGE_PREFIX}${contextKey}`) === '1';
  } catch {
    return false;
  }
}

function persistPromptDismissed(contextKey: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${PROMPT_STORAGE_PREFIX}${contextKey}`, '1');
    }
  } catch {
    // Best effort persistence
  }
}

export function useContextualNotificationPrompt(contextKey: string) {
  const { status } = useNotificationPermission();
  const [modalVisible, setModalVisible] = useState(false);

  const triggerPromptIfAppropriate = useCallback(() => {
    if (status !== 'undetermined') return;
    if (isPromptDismissed(contextKey)) return;

    persistPromptDismissed(contextKey);
    setModalVisible(true);
  }, [contextKey, status]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  return {
    modalVisible,
    triggerPromptIfAppropriate,
    closeModal,
  };
}
