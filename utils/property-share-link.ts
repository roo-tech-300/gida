const SITE_ORIGIN = 'https://gida.apartments';

export function getPropertyShareUrl(listingId: string): string {
  return `${SITE_ORIGIN}/property/${encodeURIComponent(listingId)}`;
}

export function getPropertyShareMessage(title: string, price: string, url: string): string {
  return `${title}\n${price}\n\nView this home on Gida: ${url}`;
}
