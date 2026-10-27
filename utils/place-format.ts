import type { PlaceOpenStatus, PriceRange } from '@/types/place';

export function formatPriceRange(range: PriceRange): string {
  return '₦'.repeat(range);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatRatingCount(count: number): string {
  if (count >= 1000) {
    const thousands = count / 1000;
    return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1)}k`;
  }
  return String(count);
}

export function formatOpenStatus(status: PlaceOpenStatus): string {
  if (status === 'open') return 'Open now';
  if (status === 'closed') return 'Closed';
  return '';
}
