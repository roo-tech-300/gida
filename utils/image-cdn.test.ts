import { toCdnImageUrl } from './image-cdn';

const CDN = 'https://gida-images.gidamedia.workers.dev';
const SUPABASE = 'https://proj.supabase.co/storage/v1/object/public';

describe('toCdnImageUrl', () => {
  it('rewrites storage URLs for each image bucket', () => {
    expect(toCdnImageUrl(`${SUPABASE}/avatars/u1/avatar-x.jpg`, CDN)).toBe(`${CDN}/avatars/u1/avatar-x.jpg`);
    expect(toCdnImageUrl(`${SUPABASE}/listing-images/l1/gallery/0-a.jpg`, CDN)).toBe(`${CDN}/listing-images/l1/gallery/0-a.jpg`);
    expect(toCdnImageUrl(`${SUPABASE}/place-photos/p1/1_0.jpg`, CDN)).toBe(`${CDN}/place-photos/p1/1_0.jpg`);
  });

  it('tolerates a trailing slash on the CDN base', () => {
    expect(toCdnImageUrl(`${SUPABASE}/avatars/u/a.jpg`, `${CDN}/`)).toBe(`${CDN}/avatars/u/a.jpg`);
  });

  it('leaves the URL alone when no CDN is configured', () => {
    const url = `${SUPABASE}/avatars/u/a.jpg`;
    expect(toCdnImageUrl(url, '')).toBe(url);
    expect(toCdnImageUrl(url, undefined)).toBe(url);
  });

  it('leaves non-storage and other-bucket URLs alone', () => {
    expect(toCdnImageUrl('https://example.com/pic.jpg', CDN)).toBe('https://example.com/pic.jpg');
    expect(toCdnImageUrl(`${SUPABASE}/private-docs/x.pdf`, CDN)).toBe(`${SUPABASE}/private-docs/x.pdf`);
  });
});
