export const SLEEP_OPTIONS = [
  { id: 'early_bird', label: 'Early Bird' },
  { id: 'night_owl', label: 'Night Owl' },
  { id: 'flexible', label: 'Flexible' },
];

export const CLEANLINESS_OPTIONS = [
  { id: 'neat_freak', label: 'Neat Freak' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'relaxed', label: 'Relaxed' },
];

export const GUEST_OPTIONS = [
  { id: 'quiet', label: 'Quiet' },
  { id: 'occasional_guests', label: 'Occasional' },
  { id: 'social_hub', label: 'Social' },
];

export const STUDY_OPTIONS = [
  { id: 'room_silent', label: 'Silent' },
  { id: 'room_music', label: 'Music OK' },
  { id: 'library_outside', label: 'Library' },
];

export const PERSONALITY_OPTIONS = [
  { id: 'introvert', label: 'Introvert' },
  { id: 'extrovert', label: 'Extrovert' },
  { id: 'ambivert', label: 'Ambivert' },
];

export const LEVEL_OPTIONS = [
  { id: '100', label: '100L' },
  { id: '200', label: '200L' },
  { id: '300', label: '300L' },
  { id: '400', label: '400L' },
  { id: '500', label: '500L' },
];

export const RELIGION_OPTIONS = [
  { id: 'christianity', label: 'Christianity' },
  { id: 'islam', label: 'Islam' },
];

export const RELIGION_PREFERENCE_OPTIONS = [
  { id: 'same', label: 'Same as mine' },
  { id: 'flexible', label: 'Flexible' },
  { id: 'christianity', label: 'Christianity' },
  { id: 'islam', label: 'Islam' },
];

/**
 * Canonical display label for a stored religion value.
 * New profiles store the option id ('christianity' | 'islam');
 * legacy profiles may hold free text like "Christian" or "Islam ".
 */
export function religionLabel(value: string | null | undefined): string | undefined {
  return formatOptionLabel(value);
}

const ALL_OPTIONS = [
  ...SLEEP_OPTIONS,
  ...CLEANLINESS_OPTIONS,
  ...GUEST_OPTIONS,
  ...STUDY_OPTIONS,
  ...PERSONALITY_OPTIONS,
  ...LEVEL_OPTIONS,
  ...RELIGION_OPTIONS,
  ...RELIGION_PREFERENCE_OPTIONS,
];

/**
 * Formats a stored preference value ('early_bird', 'room_music', …)
 * into a human-readable label. Known option ids map to their canonical
 * label; anything else falls back to Title Case ('some_value' → 'Some Value').
 */
export function formatOptionLabel(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const match = ALL_OPTIONS.find((opt) => opt.id === trimmed.toLowerCase());
  if (match) return match.label;
  return trimmed
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
