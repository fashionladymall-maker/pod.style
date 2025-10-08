'use server';

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { fetchInitialFeed, fetchMoreFeed, fetchFeedUpdates, type FeedResponse } from './feed-service';
import { FEED_PAGE_SIZE } from '../config';
import { mockBuildFeedResponse } from '@/server/mock/mock-store';

const baseFeedOptionsSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
  region: z.string().min(1).max(10).optional(),
  locale: z.string().min(2).max(10).optional(),
  updatedAfter: z.string().optional(),
});

const initialFeedSchema = baseFeedOptionsSchema;

const moreFeedSchema = baseFeedOptionsSchema.extend({
  cursor: z.string().optional(),
});

export type FeedActionInput = z.infer<typeof initialFeedSchema>;
export type FeedMoreActionInput = z.infer<typeof moreFeedSchema>;
export type FeedUpdatesActionInput = z.infer<typeof baseFeedOptionsSchema>;

export const getInitialFeedAction = async (input?: FeedActionInput): Promise<FeedResponse> => {
  const params = initialFeedSchema.parse(input ?? {});
  if (!isFirebaseAdminConfigured()) {
    return mockBuildFeedResponse(params.limit ?? FEED_PAGE_SIZE);
  }
  return fetchInitialFeed({
    ...params,
    limit: params.limit ?? FEED_PAGE_SIZE,
  });
};

export const getMoreFeedAction = async (input: FeedMoreActionInput): Promise<FeedResponse> => {
  const params = moreFeedSchema.parse(input ?? {});
  if (!isFirebaseAdminConfigured()) {
    return mockBuildFeedResponse(params.limit ?? FEED_PAGE_SIZE);
  }
  return fetchMoreFeed({
    ...params,
    limit: params.limit ?? FEED_PAGE_SIZE,
  });
};

export const getFeedUpdatesAction = async (input?: FeedUpdatesActionInput): Promise<FeedResponse> => {
  const params = baseFeedOptionsSchema.parse(input ?? {});
  if (!isFirebaseAdminConfigured()) {
    return mockBuildFeedResponse(params.limit ?? FEED_PAGE_SIZE);
  }
  return fetchFeedUpdates({
    ...params,
    limit: params.limit ?? FEED_PAGE_SIZE,
  });
};
