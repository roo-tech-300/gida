import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignColors } from '@/constants/design';

// GitHub's "latest" release alias always resolves to the most recent
// successful Android build published by the build-android.yml workflow,
// so this link never needs updating when a new build ships.
const LATEST_APK_URL = 'https://github.com/roo-tech-300/gida/releases/latest/download/app-release.apk';

// Web-only: lets website visitors grab the native Android app.
// Renders nothing on native — there's no reason to download an APK
// from inside the app that already is the APK.
export function DownloadApkButton() {
  if (Platform.OS !== 'web') return null;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Download the Gida Android app"
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={() => window.open(LATEST_APK_URL, '_blank')}
    >
      <Ionicons name="download-outline" size={16} color={DesignColors.onPrimary} />
      <Text style={styles.label}>Get the app</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'fixed' as 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: DesignColors.primary,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  label: {
    color: DesignColors.onPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
