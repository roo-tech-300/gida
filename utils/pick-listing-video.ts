import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { LISTING_VIDEO_LIMITS } from '@/constants/listing-video';

/** What tus-js-client accepts: a File on web, a `{ uri }` object on native. */
export type UploadableFile = File | { uri: string; name: string; type: string };

export interface PickedVideo {
  file: UploadableFile;
  fileName: string;
  mimeType: string;
}

export type PickVideoResult =
  | { kind: 'picked'; video: PickedVideo }
  | { kind: 'canceled' }
  | { kind: 'denied' }
  | { kind: 'invalid'; message: string };

export function validatePickedVideo(durationMs: number | null | undefined, sizeBytes: number | null | undefined): string | null {
  const maxMinutes = LISTING_VIDEO_LIMITS.maxDurationSeconds / 60;
  if (durationMs != null && durationMs / 1000 > LISTING_VIDEO_LIMITS.maxDurationSeconds + 1) {
    return `Videos can be at most ${maxMinutes} minutes long. Trim it and try again.`;
  }
  if (sizeBytes != null && sizeBytes > LISTING_VIDEO_LIMITS.maxBytes) {
    return `Videos can be at most ${LISTING_VIDEO_LIMITS.maxBytes / 1024 / 1024} MB.`;
  }
  return null;
}

export async function pickListingVideo(): Promise<PickVideoResult> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return { kind: 'denied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    // On iOS this opens the trimmer and enforces videoMaxDuration.
    allowsEditing: Platform.OS === 'ios',
    videoMaxDuration: LISTING_VIDEO_LIMITS.maxDurationSeconds,
  });
  if (result.canceled || result.assets.length === 0) return { kind: 'canceled' };

  const asset = result.assets[0];
  const sizeBytes = asset.file?.size ?? asset.fileSize;
  const problem = validatePickedVideo(asset.duration, sizeBytes);
  if (problem) return { kind: 'invalid', message: problem };

  const mimeType = asset.mimeType ?? asset.file?.type ?? 'video/mp4';
  const fileName = asset.fileName ?? asset.file?.name ?? `walkthrough-${Date.now()}.mp4`;
  const file: UploadableFile = asset.file ?? { uri: asset.uri, name: fileName, type: mimeType };
  return { kind: 'picked', video: { file, fileName, mimeType } };
}
