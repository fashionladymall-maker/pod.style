import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { createFeedRefreshScheduler } from '@/features/feed/hooks/use-feed-refresh';

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('createFeedRefreshScheduler', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('resets interval after success and backs off on failure', async () => {
    const fetchUpdates = jest
      .fn(async () => 0)
      .mockResolvedValueOnce(0)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(2);

    const scheduler = createFeedRefreshScheduler({
      baseIntervalMs: 10,
      maxIntervalMs: 80,
      fetchUpdates,
    });

    scheduler.start();

    jest.advanceTimersByTime(10);
    await flushMicrotasks();
    expect(fetchUpdates).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(10);
    await flushMicrotasks();
    expect(fetchUpdates).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(20);
    await flushMicrotasks();
    expect(fetchUpdates).toHaveBeenCalledTimes(3);

    scheduler.stop();
  });
});
