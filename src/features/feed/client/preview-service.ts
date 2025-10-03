'use client';

import { z } from 'zod';
import type { Creation } from '@/lib/types';

const PREVIEW_ENDPOINT = process.env.NEXT_PUBLIC_OMG_PREVIEW_ENDPOINT ?? '';

const standardPreviewResponseSchema = z.object({
  imageUrl: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  generatedAt: z.string().optional(),
  provider: z.string().optional(),
  cacheKey: z.string().optional(),
});

export type StandardPreviewResponse = z.infer<typeof standardPreviewResponseSchema>;

export interface StandardPreviewRequest {
  creationId: string;
  assetUri?: string | null;
  variant?: string | null;
  signal?: AbortSignal;
}

export const derivePreviewAssetUri = (creation: Creation): string | null => {
  if (creation.previewPatternUri) return creation.previewPatternUri;
  if (creation.patternUri) return creation.patternUri;
  const firstModelWithPreview = creation.models?.find((model) => Boolean(model.previewUri));
  if (firstModelWithPreview?.previewUri) return firstModelWithPreview.previewUri;
  if (firstModelWithPreview?.uri) return firstModelWithPreview.uri;
  return null;
};

export const fetchStandardPreview = async (
  params: StandardPreviewRequest,
): Promise<StandardPreviewResponse | null> => {
  if (!PREVIEW_ENDPOINT) {
    return null;
  }

  try {
    const response = await fetch(PREVIEW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creationId: params.creationId,
        assetUri: params.assetUri ?? null,
        variant: params.variant ?? null,
        context: 'omg-feed',
      }),
      signal: params.signal,
    });

    if (!response.ok) {
      console.warn('feed.preview.fetch_failed', {
        status: response.status,
        creationId: params.creationId,
      });
      return null;
    }

    const json = await response.json();
    const parsed = standardPreviewResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.warn('feed.preview.parse_failed', {
        creationId: params.creationId,
        issues: parsed.error.flatten(),
      });
      return null;
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    console.error('feed.preview.unexpected_error', error);
    return null;
  }
};

