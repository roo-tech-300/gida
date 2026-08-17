import { Platform } from 'react-native';

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error('[Clipboard] Failed to copy text:', error);
  }
  return false;
}
