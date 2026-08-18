import { Platform } from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }
    await ExpoClipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('[Clipboard] Failed to copy text:', error);
    return false;
  }
}
