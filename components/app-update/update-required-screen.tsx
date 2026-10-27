import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { AppRelease } from '@/types/app-release';
import { UpdateReleaseDetails } from './update-release-details';

type Props = {
  release: AppRelease;
  installedVersion: string;
  onDownload: () => void;
};

/** Blocks the whole app: this version is no longer supported. Back does nothing. */
export function UpdateRequiredScreen({ release, installedVersion, onDownload }: Props) {
  return (
    <Modal visible animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <View style={styles.icon}>
            <Ionicons name="cloud-download-outline" size={40} color={DesignColors.primaryBright} />
          </View>
          <Text style={styles.title}>Update required</Text>
          <Text style={styles.message}>
            Gida {installedVersion} is no longer supported. Install version {release.versionName} to keep using the app.
          </Text>
          <View style={styles.details}>
            <UpdateReleaseDetails notes={release.releaseNotes} />
          </View>
        </View>
        <Pressable style={styles.download} onPress={onDownload} accessibilityRole="button">
          <Ionicons name="download-outline" size={20} color={DesignColors.onPrimaryContainer} />
          <Text style={styles.downloadText}>Download Gida {release.versionName}</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    padding: DesignSpacing.lg,
    backgroundColor: DesignColors.surfaceContainerLowest,
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DesignSpacing.md },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  title: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily, textAlign: 'center' },
  message: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
    maxWidth: 340,
  },
  details: { alignSelf: 'stretch', marginTop: DesignSpacing.sm },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSpacing.sm,
    paddingVertical: 16,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.primaryContainer,
  },
  downloadText: { ...DesignTypography.bodyLg, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
});
