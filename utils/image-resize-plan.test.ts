import { planResize } from './image-resize-plan';

describe('planResize', () => {
  it('shrinks a wide photo by width', () => {
    expect(planResize(4032, 3024, 1600)).toEqual({ width: 1600 });
  });

  it('shrinks a tall photo by height', () => {
    expect(planResize(3024, 4032, 1600)).toEqual({ height: 1600 });
  });

  it('never upscales a small image', () => {
    expect(planResize(800, 600, 1600)).toBeNull();
    expect(planResize(1600, 1200, 1600)).toBeNull();
  });

  it('treats a square image as wide', () => {
    expect(planResize(3000, 3000, 512)).toEqual({ width: 512 });
  });

  it('ignores invalid dimensions', () => {
    expect(planResize(0, 100, 512)).toBeNull();
    expect(planResize(100, 100, 0)).toBeNull();
  });
});
