import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { useWebModalEscape } from '@/hooks/use-web-modal-escape';
import type { AppRelease } from '@/types/app-release';
import { UpdateReleaseDetails } from './update-release-details';

type Props = {
  release: AppRelease;
  installedVersion: string;
  onDownload: () => void;
  onLater: () => void;
};

export function UpdateAvailableSheet({ release, installedVersion, onDownload, onLater }: Props) {
  const insets = useSafeAreaInsets();
  useWebModalEscape(true, onLater);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onLater} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onLater} accessibilityLabel="Dismiss update">
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, DesignSpacing.lg) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.icon}>
              <Ionicons name="arrow-down-circle" size={28} color={DesignColors.primaryBright} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Update available</Text>
              <Text style={styles.subtitle}>
                Gida {release.versionName} is ready · you have {installedVersion}
              </Text>
            </View>
          </View>

          <UpdateReleaseDetails notes={release.releaseNotes} />

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.later]} onPress={onLater} accessibilityRole="button">
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.download]} onPress={onDownload} accessibilityRole="button">
              <Text style={styles.downloadText}>Download update</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: DesignColors.scrimHeavy },
  sheet: {
    gap: DesignSpacing.lg,
    paddingHorizontal: DesignSpacing.lg,
    paddingTop: DesignSpacing.sm,
    borderTopLeftRadius: DesignRadius.lg,
    borderTopRightRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.outlineVariant,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.md },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryTint,
  },
  headerText: { flex: 1, gap: 2 },
  title: { ...DesignTypography.headlineMd, color: DesignColors.onSurface, fontFamily },
  subtitle: { ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant, fontFamily },
  actions: { flexDirection: 'row', gap: DesignSpacing.sm },
  button: { alignItems: 'center', justifyContent: 'center', borderRadius: DesignRadius.md, paddingVertical: 14 },
  later: { flex: 1, backgroundColor: DesignColors.surfaceContainerHighest },
  laterText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  download: { flex: 2, backgroundColor: DesignColors.primaryContainer },
  downloadText: { ...DesignTypography.bodyMd, color: DesignColors.onPrimaryContainer, fontFamily, fontWeight: '700' },
});
