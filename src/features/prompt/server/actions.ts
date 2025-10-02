'use server';

import { z } from 'zod';
import { runPromptModeration } from './moderation-service';
import type { PromptModerationResponse } from '../types';

const moderationSchema = z.object({
  userId: z.string().optional().nullable(),
  text: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
  referenceId: z.string().optional().nullable(),
  context: z.string().optional().nullable(),
  source: z.enum(['preview', 'prepublish', 'postpublish']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ModeratePromptInput = z.infer<typeof moderationSchema>;

export const moderatePromptAction = async (input: ModeratePromptInput): Promise<PromptModerationResponse> => {
  const payload = moderationSchema.parse(input);
  return runPromptModeration(payload);
};

