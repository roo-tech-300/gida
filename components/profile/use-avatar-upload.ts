import { useCallback, useState } from 'react';
import { uploadAvatar } from '@/services/profileService';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from '@/utils/web-image-picker';

type ShowToast = (config: { title?: string; message: string; type: 'success' | 'error' | 'info' }) => void;

export function useAvatarUpload(
  profileId: string | undefined,
  refreshProfile: () => Promise<void>,
  showToast: ShowToast,
) {
  const [uploading, setUploading] = useState(false);

  const handleAvatarPress = useCallback(async () => {
    const permission = await requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ message: 'Photo access is required to change your avatar.', type: 'error' });
      return;
    }
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !profileId) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      await uploadAvatar(profileId, uri);
      await refreshProfile();
      showToast({ message: 'Profile picture updated.', type: 'success' });
    } catch (error) {
      console.error('[Profile] Avatar upload failed:', error);
      showToast({ message: error instanceof Error ? error.message : 'Failed to upload avatar.', type: 'error' });
    } finally {
      setUploading(false);
    }
  }, [profileId, refreshProfile, showToast]);

  return { uploading, handleAvatarPress };
}

