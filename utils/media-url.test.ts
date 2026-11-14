import { formatVideoDuration, mediaCdnUrl, posterPathFromPreview } from '@/utils/media-url';

const ORIGINAL = process.env.EXPO_PUBLIC_MEDIA_CDN_URL;
afterEach(() => {
  process.env.EXPO_PUBLIC_MEDIA_CDN_URL = ORIGINAL;
});

describe('mediaCdnUrl', () => {
  it('joins base and path without double slashes', () => {
    process.env.EXPO_PUBLIC_MEDIA_CDN_URL = 'https://cdn.example.com/';
    expect(mediaCdnUrl('v/abc/master.m3u8')).toBe('https://cdn.example.com/v/abc/master.m3u8');
    expect(mediaCdnUrl('/v/abc/poster.jpg')).toBe('https://cdn.example.com/v/abc/poster.jpg');
  });

  it('returns null for a missing path or an unconfigured CDN (no broken relative URLs)', () => {
    process.env.EXPO_PUBLIC_MEDIA_CDN_URL = 'https://cdn.example.com';
    expect(mediaCdnUrl(null)).toBeNull();
    process.env.EXPO_PUBLIC_MEDIA_CDN_URL = '';
    expect(mediaCdnUrl('v/abc/preview.mp4')).toBeNull();
  });
});

describe('posterPathFromPreview', () => {
  it('derives the sibling poster path', () => {
    expect(posterPathFromPreview('v/abc/preview.mp4')).toBe('v/abc/poster.jpg');
  });
  it('returns null for anything that is not a preview clip', () => {
    expect(posterPathFromPreview(null)).toBeNull();
    expect(posterPathFromPreview('v/abc/master.m3u8')).toBeNull();
  });
});

describe('formatVideoDuration', () => {
  it('formats as m:ss', () => {
    expect(formatVideoDuration(65)).toBe('1:05');
    expect(formatVideoDuration(null)).toBe('');
  });
});
