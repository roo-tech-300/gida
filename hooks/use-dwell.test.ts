import { act, renderHook } from '@testing-library/react-native';

import { useDwell } from '@/hooks/use-dwell';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useDwell', () => {
  it('turns true only after the delay, and resets when deactivated', async () => {
    const { result, rerender } = await renderHook(({ active }: { active: boolean }) => useDwell(active, 600), {
      initialProps: { active: true },
    });
    expect(result.current).toBe(false);
    await act(async () => { jest.advanceTimersByTime(600); });
    expect(result.current).toBe(true);
    await rerender({ active: false });
    expect(result.current).toBe(false);
  });

  it('never fires when the item scrolls away before the delay', async () => {
    const { result, rerender } = await renderHook(({ active }: { active: boolean }) => useDwell(active, 600), {
      initialProps: { active: true },
    });
    await act(async () => { jest.advanceTimersByTime(300); });
    await rerender({ active: false });
    await act(async () => { jest.advanceTimersByTime(1000); });
    expect(result.current).toBe(false);
  });
});
