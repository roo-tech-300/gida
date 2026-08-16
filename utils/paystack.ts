export function extractReference(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('reference') ?? parsed.searchParams.get('trxref');
  } catch {
    return null;
  }
}
