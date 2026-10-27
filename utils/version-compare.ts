const VERSION_PATTERN = /^\d+(\.\d+)*$/;

export function isValidVersion(version: string | null | undefined): version is string {
  return typeof version === 'string' && VERSION_PATTERN.test(version);
}

/** Numeric dotted-version compare: negative if a < b, 0 if equal, positive if a > b. "1.10" > "1.9". */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
