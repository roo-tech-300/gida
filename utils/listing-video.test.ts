import { parseListingVideoRows } from '@/utils/listing-video-mapper';
import { formatVideoDuration, mediaCdnUrl } from '@/utils/media-url';
import { validatePickedVideo } from '@/utils/pick-listing-video';
import { isReadyVideo } from '@/types/listing-video';
import {
  clearUpload,
  getUpload,
  setUploadProgress,
  subscribeToUploads,
} from '@/utils/listing-video-upload-store';

jest.mock('expo-image-picker', () => ({}));

const ORIGINAL_CDN = process.env.EXPO_PUBLIC_MEDIA_CDN_URL;

beforeEach(() => {
  process.env.EXPO_PUBLIC_MEDIA_CDN_URL = 'https://cdn.example.com/';
});

afterAll(() => {
  process.env.EXPO_PUBLIC_MEDIA_CDN_URL = ORIGINAL_CDN;
});

describe('mediaCdnUrl', () => {
  it('joins the CDN base and stored path without double slashes', () => {
    expect(mediaCdnUrl('v/abc/master.m3u8')).toBe('https://cdn.example.com/v/abc/master.m3u8');
    expect(mediaCdnUrl('/v/abc/poster.jpg')).toBe('https://cdn.example.com/v/abc/poster.jpg');
  });

  it('returns null for missing paths', () => {
    expect(mediaCdnUrl(null)).toBeNull();
  });
});

describe('formatVideoDuration', () => {
  it('formats as m:ss', () => {
    expect(formatVideoDuration(65)).toBe('1:05');
    expect(formatVideoDuration(9)).toBe('0:09');
    expect(formatVideoDuration(null)).toBe('');
  });
});

describe('parseListingVideoRows', () => {
  const readyRow = {
    id: 'v1',
    listing_id: 'l1',
    status: 'ready',
    hls_path: 'v/v1/master.m3u8',
    poster_path: 'v/v1/poster.jpg',
    preview_path: 'v/v1/preview.mp4',
    duration_seconds: 42,
    width: 720,
    height: 1280,
    display_order: 0,
    error: null,
    created_at: '2026-10-27T00:00:00Z',
  };

  it('maps rows to absolute URLs and an aspect ratio', () => {
    const [video] = parseListingVideoRows([readyRow]);
    expect(video.hlsUrl).toBe('https://cdn.example.com/v/v1/master.m3u8');
    expect(video.aspectRatio).toBeCloseTo(0.5625);
    expect(isReadyVideo(video)).toBe(true);
  });

  it('treats processing rows as not ready', () => {
    const [video] = parseListingVideoRows([{ ...readyRow, status: 'processing', hls_path: null }]);
    expect(video.hlsUrl).toBeNull();
    expect(isReadyVideo(video)).toBe(false);
  });

  it('skips malformed rows', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseListingVideoRows([{ ...readyRow, status: 'exploded' }, null])).toEqual([]);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});

describe('validatePickedVideo', () => {
  it('accepts clips within limits or with unknown metadata', () => {
    expect(validatePickedVideo(120_000, 80 * 1024 * 1024)).toBeNull();
    expect(validatePickedVideo(null, undefined)).toBeNull();
  });

  it('rejects clips that are too long or too large', () => {
    expect(validatePickedVideo(200_000, 1)).toMatch(/at most 3 minutes/);
    expect(validatePickedVideo(1000, 600 * 1024 * 1024)).toMatch(/at most 500 MB/);
  });
});

describe('upload store', () => {
  afterEach(() => clearUpload('l1'));

  it('only notifies on whole-percent progress changes', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToUploads(listener);

    setUploadProgress('l1', 'tour.mp4', 0.101);
    setUploadProgress('l1', 'tour.mp4', 0.105);
    setUploadProgress('l1', 'tour.mp4', 0.11);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(getUpload('l1')).toEqual({ status: 'uploading', fileName: 'tour.mp4', progress: 11 });
    unsubscribe();
  });
});
