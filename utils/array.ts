/**
 * Utility functions for array operations.
 * 
 * Used by: profile-chunking.ts, and other modules needing array utilities.
 */

export const MAX_CHUNK_SIZE = 50;

/**
 * Chunk an array into smaller pieces of maxSize.
 * Useful for Supabase .in() queries which have practical row limits.
 * 
 * @param array - The array to chunk
 * @param maxSize - Maximum size of each chunk (default: 50)
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], maxSize = MAX_CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += maxSize) {
    chunks.push(array.slice(i, i + maxSize));
  }
  return chunks;
}

/**
 * Group array items by a key function.
 * Useful for organizing data by categories.
 * 
 * @param array - The array to group
 * @keyFn - Function that returns the grouping key for each item
 * @returns Object mapping keys to arrays of items
 */
export function groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const grouped = {} as Record<K, T[]>;
  for (const item of array) {
    const key = keyFn(item);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  return grouped;
}

/**
 * Safe get by index that returns undefined instead of throwing.
 * 
 * @param array - The array to access
 * @param index - The index to get
 * @returns The element at index, or undefined if out of bounds
 */
export function safeGet<T>(array: T[], index: number): T | undefined {
  return index >= 0 && index < array.length ? array[index] : undefined;
}

/**
 * Get the last element of an array safely.
 * 
 * @param array - The array to get last element from
 * @returns The last element, or undefined if array is empty
 */
export function safeLast<T>(array: T[]): T | undefined {
  return array.length > 0 ? array[array.length - 1] : undefined;
}

/**
 * Remove duplicate values from an array, preserving order.
 * 
 * @param array - The array to deduplicate
 * @returns New array with duplicates removed
 */
export function removeDuplicates<T>(array: T[]): T[] {
  const seen = new Set<T>();
  return array.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

/**
 * Check if a value exists in an array using strict equality.
 * 
 * @param array - The array to search
 * @param value - The value to find
 * @returns True if value exists in array
 */
export function includes<T>(array: T[], value: T): boolean {
  return array.indexOf(value) !== -1;
}