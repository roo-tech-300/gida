import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { planResize } from '@/utils/image-resize-plan';

export type CompressPreset = { maxEdge: number; quality: number };

/** Feed cards and the gallery never show more than ~1600px wide. */
export const LISTING_PHOTO_PRESET: CompressPreset = { maxEdge: 1600, quality: 0.72 };
/** Avatars are shown at 40-120px; 512px stays sharp on 3x screens. */
export const AVATAR_PRESET: CompressPreset = { maxEdge: 512, quality: 0.75 };

/**
 * Shrinks and re-encodes a local image as JPEG. Phone photos are typically
 * 3-5 MB, and every download counts against Supabase egress, so we upload
 * a ~200-400 KB version instead.
 *
 * Falls back to the original file when compression fails, so an upload
 * is never blocked by this optimisation.
 */
export async function compressImage(uri: string, preset: CompressPreset): Promise<string> {
  try {
    const probe = await ImageManipulator.manipulate(uri).renderAsync();
    const target = planResize(probe.width, probe.height, preset.maxEdge);

    const context = ImageManipulator.manipulate(uri);
    if (target) context.resize(target);
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: preset.quality });
    return saved.uri;
  } catch (error) {
    console.error('[compressImage] Compression failed, uploading original:', error);
    return uri;
  }
}
