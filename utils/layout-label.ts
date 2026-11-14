const LABELS: Record<string, string> = {
  flat: 'Flat',
  self_contain: 'Self-contain',
  single_room: 'Single room',
};

/** Display name for a listing's layout type; unknown values are title-cased rather than hidden. */
export function layoutLabel(layoutType: string | null | undefined): string {
  if (!layoutType) return '';
  if (LABELS[layoutType]) return LABELS[layoutType];
  const words = layoutType.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
