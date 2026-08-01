import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/context/auth-context';
import { uploadAvatar } from '@/services/profileService';
import { useAppToast } from '@/components/ui/toast-card';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() ?? '?';
}

export function RoommateAvatarSection() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useAppToast();
  const [uploading, setUploading] = useState(false);

  const handlePress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ message: 'Photo access is required to set your profile picture.', type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !profile) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      await uploadAvatar(profile.id, uri);
      await refreshProfile();
      showToast({ message: 'Profile picture set!', type: 'success' });
    } catch (err: any) {
      console.error('[RoommateAvatar] Upload failed:', err);
      showToast({ message: err?.message || 'Failed to upload avatar.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const name = profile?.full_name ?? 'Student';

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} disabled={uploading} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.initialsWrap}>
            {uploading ? (
              <ActivityIndicator size="large" color={DesignColors.onSurface} />
            ) : (
              <Text style={styles.initials}>{getInitials(name)}</Text>
            )}
          </View>
        )}
        {!uploading && (
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color={DesignColors.onSurface} />
          </View>
        )}
      </Pressable>
      <Text style={styles.label}>Add a profile photo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: DesignSpacing.sm },
  pressable: { position: 'relative' },
  pressed: { opacity: 0.85 },
  image: { width: 80, height: 80, borderRadius: 40 },
  initialsWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onPrimary, fontFamily, fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: DesignColors.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: DesignColors.surface,
  },
  label: {
    ...DesignTypography.bodyMd, color: DesignColors.onSurfaceVariant,
    fontFamily, textAlign: 'center',
  },
});
