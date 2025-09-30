/** @jest-environment jsdom */

import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { useFeedRefresh } from '@/features/feed/hooks/use-feed-refresh';

const TestComponent = ({ enabled, fetchUpdates }: { enabled: boolean; fetchUpdates: () => Promise<number> }) => {
  useFeedRefresh({ enabled, fetchUpdates, baseIntervalMs: 10, maxIntervalMs: 40 });
  return null;
};

describe('useFeedRefresh', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
    jest.useRealTimers();
  });

  it('invokes fetchUpdates on schedule and backs off on failure', async () => {
    const fetchUpdates = jest
      .fn(async () => 0)
      .mockResolvedValueOnce(0)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(1);

    await act(async () => {
      root.render(<TestComponent enabled fetchUpdates={fetchUpdates} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(10);
      await Promise.resolve();
    });

    expect(fetchUpdates).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(10);
      await Promise.resolve();
    });

    expect(fetchUpdates).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(20);
      await Promise.resolve();
    });

    expect(fetchUpdates).toHaveBeenCalledTimes(3);
  });
});
