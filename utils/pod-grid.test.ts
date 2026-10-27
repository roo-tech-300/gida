import { clampShelfCount, getPodGrid, takeShelfPods, MAX_SHELF_PODS, MIN_SHELF_PODS } from './pod-grid';

describe('pod shelf grid', () => {
  describe('getPodGrid', () => {
    it('renders a single pod as one hero tile', () => {
      expect(getPodGrid(1)).toEqual({ count: 1, columns: 1, rows: 1 });
    });

    it('lays out small shelves without orphans', () => {
      expect(getPodGrid(2)).toEqual({ count: 2, columns: 2, rows: 1 });
      expect(getPodGrid(3)).toEqual({ count: 3, columns: 3, rows: 1 });
    });

    it('uses 2x2 for four pods so tiles stay roomy', () => {
      expect(getPodGrid(4)).toEqual({ count: 4, columns: 2, rows: 2 });
    });

    it('uses two rows of three for five and six pods', () => {
      expect(getPodGrid(5)).toEqual({ count: 5, columns: 3, rows: 2 });
      expect(getPodGrid(6)).toEqual({ count: 6, columns: 3, rows: 2 });
    });

    it('never renders more than six pods', () => {
      expect(getPodGrid(9).count).toBe(MAX_SHELF_PODS);
      expect(getPodGrid(9).rows).toBe(2);
    });

    it('returns an empty grid for zero or invalid counts', () => {
      expect(getPodGrid(0)).toEqual({ count: 0, columns: 1, rows: 0 });
      expect(getPodGrid(-3)).toEqual({ count: 0, columns: 1, rows: 0 });
      expect(getPodGrid(Number.NaN)).toEqual({ count: 0, columns: 1, rows: 0 });
    });
  });

  describe('clampShelfCount', () => {
    it('clamps into the supported range', () => {
      expect(clampShelfCount(0)).toBe(MIN_SHELF_PODS);
      expect(clampShelfCount(-2)).toBe(MIN_SHELF_PODS);
      expect(clampShelfCount(100)).toBe(MAX_SHELF_PODS);
      expect(clampShelfCount(Number.POSITIVE_INFINITY)).toBe(MIN_SHELF_PODS);
      expect(clampShelfCount(3.8)).toBe(3);
    });
  });

  describe('takeShelfPods', () => {
    it('caps the slice at six items', () => {
      const pods = Array.from({ length: 10 }, (_, index) => index);
      expect(takeShelfPods(pods)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('keeps a short list intact so a lone pod still shows', () => {
      expect(takeShelfPods(['only-one'])).toEqual(['only-one']);
    });
  });
});
