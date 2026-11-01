import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { pickedVideoFromAsset, validatePickedVideo, videoDurationMs } from '@/utils/pick-listing-video';
import type { WizardMedia } from '@/types/wizard-media';

export type PickMediaResult =
  | { kind: 'picked'; media: WizardMedia[] }
  | { kind: 'canceled' }
  | { kind: 'denied' }
  | { kind: 'invalid'; message: string };

type PickMediaOptions = {
  /** The cover picker only needs one file; the gallery allows a batch. */
  multiple?: boolean;
};

function isVideoAsset(asset: ImagePicker.ImagePickerAsset): boolean {
  return asset.type === 'video' || (asset.mimeType?.startsWith('video/') ?? false);
}

function toMedia(asset: ImagePicker.ImagePickerAsset): WizardMedia {
  if (!isVideoAsset(asset)) return { kind: 'photo', uri: asset.uri };
  return { kind: 'video', video: pickedVideoFromAsset(asset) };
}

/**
 * One picker for photos and videos. On web, expo-image-picker renders a file
 * input that accepts both; on native it opens the media library with both
 * media types enabled. Throws only on unexpected picker failures.
 */
export async function pickListingMedia({ multiple = true }: PickMediaOptions = {}): Promise<PickMediaResult> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { kind: 'denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: multiple,
    quality: 0.9,
  });

  if (result.canceled || result.assets.length === 0) return { kind: 'canceled' };

  for (const asset of result.assets) {
    if (!isVideoAsset(asset)) continue;
    const sizeBytes = asset.file?.size ?? asset.fileSize;
    const problem = validatePickedVideo(videoDurationMs(asset), sizeBytes);
    if (problem) return { kind: 'invalid', message: problem };
  }

  return { kind: 'picked', media: result.assets.map(toMedia) };
}
