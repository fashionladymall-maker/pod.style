import * as functions from 'firebase-functions';
import type { Request, Response } from 'express';
import { z } from 'zod';
import moderateText from '../moderation/text';
import { moderateImage } from '../moderation/image';
import { createModerationRecord } from '../moderation/record';
import type { ImageModerationResult, ModerationStatus, TextModerationResult } from '../moderation/types';
import { hashContent, resolveStatus } from '../moderation/utils';

const requestSchema = z.object({
  text: z.string().max(4000).optional(),
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().max(10_000_000).optional(),
  userId: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
  context: z.string().optional().nullable(),
  recordType: z.enum(['text', 'image', 'combined']).optional(),
  source: z.enum(['preview', 'prepublish', 'postpublish']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

interface ModerationResponseBody {
  status: ModerationStatus;
  text?: TextModerationResult;
  image?: ImageModerationResult;
  recordId: string;
  appealStatus: 'none' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  metadata?: Record<string, unknown>;
}

const buildContentHash = (text?: string | null, imageUrl?: string | null, imageBase64?: string | null) => {
  const parts: string[] = [];
  if (text) {
    parts.push(`text:${hashContent(text)}`);
  }
  if (imageUrl) {
    parts.push(`imageUrl:${hashContent(imageUrl)}`);
  }
  if (imageBase64) {
    // Hash only the first 4kb to avoid large updates – ensures deterministic hash for identical uploads.
    const slice = imageBase64.slice(0, 4096);
    parts.push(`imageData:${hashContent(slice)}`);
  }
  return parts.join('|') || hashContent('empty-content');
};

const allowCors = (res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const moderateContent = async (body: z.infer<typeof requestSchema>) => {
  const textResult = body.text ? moderateText(body.text) : undefined;
  const imageResult = body.imageUrl || body.imageBase64 ? await moderateImage({
    imageUrl: body.imageUrl ?? undefined,
    imageBase64: body.imageBase64 ?? undefined,
  }) : undefined;

  const status = resolveStatus(textResult?.status ?? 'pass', imageResult?.status ?? 'pass');

  const record = await createModerationRecord(
    {
      recordType: body.recordType ?? (body.text && (body.imageUrl || body.imageBase64) ? 'combined' : body.text ? 'text' : 'image'),
      status,
      userId: body.userId ?? null,
      referenceId: body.referenceId ?? null,
      context: body.context ?? 'prompt',
      contentHash: buildContentHash(body.text, body.imageUrl, body.imageBase64),
      textResult,
      imageResult,
      source: body.source ?? 'preview',
      metadata: {
        ...(body.metadata ?? {}),
        textLength: body.text?.length ?? 0,
        imageSource: body.imageUrl ? 'url' : body.imageBase64 ? 'base64' : 'none',
      },
    },
    {
      textSample: body.text ?? null,
      imageSource: body.imageUrl ? 'url' : body.imageBase64 ? 'base64' : null,
      imageReference: body.imageUrl ?? null,
      upsertByHash: true,
    },
  );

  functions.logger.info('moderation.result', {
    status,
    userId: body.userId ?? 'anonymous',
    recordId: record.id,
    referenceId: body.referenceId ?? null,
    hasText: Boolean(body.text),
    hasImage: Boolean(body.imageUrl || body.imageBase64),
  });

  const responseBody: ModerationResponseBody = {
    status,
    text: textResult,
    image: imageResult,
    recordId: record.id,
    appealStatus: record.appealStatus,
    metadata: record.metadata,
  };

  return responseBody;
};

export const previewModerationHandler = functions.https.onRequest(async (req: Request, res: Response) => {
  allowCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const parsed = requestSchema.parse(req.body ?? {});
    const result = await moderateContent(parsed);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'invalid_payload', details: error.flatten() });
      return;
    }
    functions.logger.error('moderation.preview.unhandled', {
      error: (error as Error).message,
    });
    res.status(500).json({ error: 'internal_error' });
  }
});

export default previewModerationHandler;

