import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { getInitials } from '@/utils/initials';

type Props = {
  displayName: string;
  schoolLabel: string;
  avatarUrl?: string | null;
  uploading: boolean;
  onAvatarPress: () => void;
};

export function ProfileHeader({ displayName, schoolLabel, avatarUrl, uploading, onAvatarPress }: Props) {
  return (
    <View style={styles.profileHeader}>
      <Pressable style={styles.avatarWrap} onPress={onAvatarPress} disabled={uploading}>
        <View style={styles.avatarBorder}>
          <View style={styles.avatarInner}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.initialsFallback}>
                {uploading ? <ActivityIndicator size="large" color={DesignColors.onSurface} /> : <Text style={styles.initialsText}>{getInitials(displayName)}</Text>}
              </View>
            )}
          </View>
        </View>
        {!uploading && (
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={14} color={DesignColors.onSurface} />
          </View>
        )}
      </Pressable>
      <Text style={styles.name}>{displayName}</Text>
      <View style={styles.schoolTags}>
        <View style={styles.schoolTag}>
          <Ionicons name="school-outline" size={12} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.schoolTagText}>{schoolLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: 'center', gap: DesignSpacing.sm },
  avatarWrap: { position: 'relative', marginBottom: DesignSpacing.xs },
  avatarBorder: { width: 96, height: 96, borderRadius: 48, padding: 1.5, backgroundColor: DesignColors.glassBorder },
  avatarInner: { width: '100%', height: '100%', borderRadius: 47, overflow: 'hidden', backgroundColor: DesignColors.surfaceContainerHigh },
  initialsFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignColors.primaryContainer },
  initialsText: { fontSize: 32, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: DesignColors.surfaceContainerHigh, borderRadius: 14, padding: 5, borderWidth: 2, borderColor: DesignColors.surface },
  name: { ...DesignTypography.headlineLg, color: DesignColors.onSurface, fontFamily },
  schoolTags: { flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.xs, marginTop: DesignSpacing.xs },
  schoolTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: DesignColors.surfaceContainerHigh, paddingHorizontal: 10, paddingVertical: 4, borderRadius: DesignRadius.full, borderWidth: 1, borderColor: DesignColors.glassBorder },
  schoolTagText: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
});
