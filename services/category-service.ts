import { supabase } from '@/lib/supabase';

export type DbPlaceCategory = {
  key: string;
  label: string;
  icon_key: string;
  accent_color: string;
};

export async function fetchCategories({
  from,
  to,
}: {
  from: number;
  to: number;
}): Promise<DbPlaceCategory[]> {
  const { data, error } = await supabase
    .from('place_categories')
    .select('key, label, icon_key, accent_color')
    .order('"order"', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('[category-service] Failed to fetch categories:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    key: row.key,
    label: row.label,
    icon_key: row.icon_key,
    accent_color: row.accent_color,
  }));
}

/**
 * Search categories by matching the query against both:
 * 1. category_synonyms.synonym (free-form terms like "restaurant", "coffee shop")
 * 2. place_categories.key and place_categories.label (canonical keys and labels)
 *
 * Returns deduplicated category rows ordered by "order".
 */
export async function searchCategories(query: string): Promise<DbPlaceCategory[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Step 1: Find matching category keys from synonyms
  const { data: synonymMatches } = await supabase
    .from('category_synonyms')
    .select('key')
    .ilike('synonym', `%${trimmed}%`);

  // Step 2: Find matching category keys from the categories table itself
  const { data: categoryMatches } = await supabase
    .from('place_categories')
    .select('key')
    .or(`key.ilike.%${trimmed}%,label.ilike.%${trimmed}%`);

  // Combine distinct keys
  const matchedKeys = new Set<string>();
  synonymMatches?.forEach((r) => matchedKeys.add(r.key));
  categoryMatches?.forEach((r) => matchedKeys.add(r.key));

  if (matchedKeys.size === 0) return [];

  // Step 3: Fetch full category rows for resolved keys
  const { data, error } = await supabase
    .from('place_categories')
    .select('key, label, icon_key, accent_color')
    .in('key', Array.from(matchedKeys))
    .order('"order"', { ascending: true });

  if (error) {
    console.error('[category-service] Failed to search categories:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    key: row.key,
    label: row.label,
    icon_key: row.icon_key,
    accent_color: row.accent_color,
  }));
}

