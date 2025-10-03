import type { FeedItem } from '@/features/feed/server/feed-service';

export const computeLatestUpdatedAt = (list: FeedItem[]): string | null =>
  list.reduce<string | null>((latest, item) => {
    if (!item.updatedAt) return latest;
    if (!latest || item.updatedAt > latest) {
      return item.updatedAt;
    }
    return latest;
  }, null);
