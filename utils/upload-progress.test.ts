import { createUploadProgressTracker } from '@/utils/upload-progress';

const MB = 1024 * 1024;

function track(chunkBytes: number) {
  const fractions: number[] = [];
  const tracker = createUploadProgressTracker(chunkBytes, (fraction) => fractions.push(fraction));
  return { tracker, fractions };
}

describe('createUploadProgressTracker', () => {
  it('reports plain progress when the platform counts bytes correctly', () => {
    const { tracker, fractions } = track(5 * MB);
    tracker.onProgress(2 * MB, 10 * MB);
    expect(fractions).toEqual([0.2]);
  });

  it('caps double-counted bytes at the end of the in-flight chunk', () => {
    const { tracker, fractions } = track(5 * MB);
    // Halfway through chunk 1, Android already claims the whole chunk was sent.
    tracker.onProgress(5 * MB, 12 * MB);
    // Then it claims twice the chunk.
    tracker.onProgress(10 * MB, 12 * MB);
    expect(fractions.at(-1)).toBeCloseTo(5 / 12);
  });

  it('never moves backwards when the next chunk starts', () => {
    const { tracker, fractions } = track(5 * MB);
    tracker.onProgress(5 * MB, 12 * MB);
    tracker.onChunkComplete(5 * MB);
    // tus restarts at the chunk's start offset with a small in-flight count.
    tracker.onProgress(5 * MB + 1, 12 * MB);
    expect(fractions).toEqual([...fractions].sort((a, b) => a - b));
  });

  it('never exceeds 100% on the final chunk', () => {
    const { tracker, fractions } = track(5 * MB);
    tracker.onChunkComplete(10 * MB);
    tracker.onProgress(10 * MB + 4 * MB, 12 * MB);
    expect(Math.max(...fractions)).toBe(1);
  });

  it('ignores progress before the total size is known', () => {
    const { tracker, fractions } = track(5 * MB);
    tracker.onProgress(MB, 0);
    expect(fractions).toEqual([]);
  });
});
