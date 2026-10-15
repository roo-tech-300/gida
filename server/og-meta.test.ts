import { buildListingHead, escapeHtml, injectListingHead } from './og-meta';
import type { ListingPreview } from './listing-preview';

const CANONICAL_URL = 'https://www.gida.apartments/property/abc-123';

const SHELL_HTML = [
  '<!DOCTYPE html><html lang="en"><head>',
  '<meta charSet="utf-8" />',
  '<title data-rh="true">Gida - The real estate spot for Nigerian Students</title>',
  '<meta data-rh="true" name="description" content="Generic build-time description." />',
  '<meta data-rh="true" property="og:type" content="website" />',
  '<meta data-rh="true" property="og:title" content="Gida - The real estate spot for Nigerian Students" />',
  '<meta data-rh="true" property="og:image" content="https://gida.apartments/landing/gida.png" />',
  '<meta data-rh="true" name="twitter:card" content="summary_large_image" />',
  '</head><body><div id="root"></div></body></html>',
].join('');

const PREVIEW: ListingPreview = {
  id: 'abc-123',
  title: 'Cozy Self Contain Near Campus',
  description: null,
  priceAmount: 250000,
  locationLandmark: 'Km 2 Bida Road',
  city: 'Minna',
  campus: 'Bosso Campus',
  primaryImage: 'https://supabase.example.com/storage/v1/object/public/listings/hero.jpg',
  bedrooms: 1,
  bathrooms: 1,
};

describe('escapeHtml', () => {
  it('escapes markup and quotes', () => {
    expect(escapeHtml(`<a href='x'>&"&</a>`)).toBe(
      '&lt;a href=&#39;x&#39;&gt;&amp;&quot;&amp;&lt;/a&gt;'
    );
  });
});

describe('buildListingHead', () => {
  it('renders title, price and absolute primary_image as og tags', () => {
    const head = buildListingHead(PREVIEW, CANONICAL_URL);

    expect(head).toContain('<title>Cozy Self Contain Near Campus — ₦250,000/year</title>');
    expect(head).toContain(`property="og:url" content="${CANONICAL_URL}"`);
    expect(head).toContain(`property="og:image" content="${PREVIEW.primaryImage}"`);
    expect(head).toContain('name="twitter:card" content="summary_large_image"');
    expect(head).toContain('Km 2 Bida Road, Minna');
    expect(head).toContain('near Bosso Campus');
  });

  it('makes a relative primary_image absolute against the request origin', () => {
    const head = buildListingHead({ ...PREVIEW, primaryImage: '/storage/hero.jpg' }, CANONICAL_URL);

    expect(head).toContain('property="og:image" content="https://www.gida.apartments/storage/hero.jpg"');
  });

  it('falls back to the generic Gida image when primary_image is null', () => {
    const head = buildListingHead({ ...PREVIEW, primaryImage: null }, CANONICAL_URL);

    expect(head).toContain('property="og:image" content="https://www.gida.apartments/landing/gida.png"');
  });

  it('composes a description from listing details when none is stored', () => {
    const head = buildListingHead(PREVIEW, CANONICAL_URL);

    expect(head).toContain('Km 2 Bida Road, Minna · 1 bed · 1 bath · near Bosso Campus');
  });

  it('escapes user-provided title content', () => {
    const head = buildListingHead({ ...PREVIEW, title: 'Room "A" & <B>' }, CANONICAL_URL);

    expect(head).toContain('Room &quot;A&quot; &amp; &lt;B&gt; — ₦250,000/year');
    expect(head).not.toContain('Room "A" & <B>');
  });
});

describe('injectListingHead', () => {
  it('replaces generic tags with listing-specific ones', () => {
    const head = buildListingHead(PREVIEW, CANONICAL_URL);
    const result = injectListingHead(SHELL_HTML, head);

    expect(result).not.toBeNull();
    const html = result as string;

    expect(html).toContain('</head>');
    expect(html.match(/<title/g)).toHaveLength(1);
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html.match(/name="twitter:card"/g)).toHaveLength(1);
    expect(html).not.toContain('Gida - The real estate spot for Nigerian Students');
    expect(html).toContain('Cozy Self Contain Near Campus — ₦250,000/year');
    expect(html).toContain('<div id="root"></div>');
  });

  it('returns null when the shell has no </head> marker', () => {
    expect(injectListingHead('<html><body></body></html>', '<title>x</title>')).toBeNull();
  });
});
