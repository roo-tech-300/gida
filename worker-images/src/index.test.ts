import { cacheControlFor, toOriginUrl } from './index';

describe('toOriginUrl', () => {
  const base = 'https://proj.supabase.co/';

  it('maps allowed buckets to the public storage URL', () => {
    expect(toOriginUrl(base, '/avatars/u1/avatar-x.jpg')).toBe(
      'https://proj.supabase.co/storage/v1/object/public/avatars/u1/avatar-x.jpg',
    );
    expect(toOriginUrl(base, '/listing-images/l1/gallery/0-ab.jpg')).not.toBeNull();
    expect(toOriginUrl(base, '/place-photos/p1/1_0.jpg')).not.toBeNull();
  });

  it('rejects other buckets, bare buckets and traversal', () => {
    expect(toOriginUrl(base, '/secrets/x.jpg')).toBeNull();
    expect(toOriginUrl(base, '/avatars/')).toBeNull();
    expect(toOriginUrl(base, '/avatars/../x.jpg')).toBeNull();
    expect(toOriginUrl(base, '/')).toBeNull();
  });
});

describe('cacheControlFor', () => {
  it('caches immutable unique names for a year', () => {
    expect(cacheControlFor('/avatars/u1/avatar-lx4k2.jpg')).toContain('31536000');
    expect(cacheControlFor('/listing-images/l1/hero-lx4k2-ab12.jpg')).toContain('immutable');
    expect(cacheControlFor('/place-photos/p1/1793253072407_0.jpg')).toContain('31536000');
  });

  it('caches overwritable legacy names for one hour only', () => {
    expect(cacheControlFor('/avatars/u1/avatar.jpg')).toBe('public, max-age=3600');
    expect(cacheControlFor('/listing-images/l1/hero.jpg')).toBe('public, max-age=3600');
    expect(cacheControlFor('/listing-images/l1/gallery/3.jpg')).toBe('public, max-age=3600');
  });
});
