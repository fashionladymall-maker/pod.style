import type { PromptModerationInput, PromptModerationResponse } from '../types';
import { logger } from '@/utils/logger';

const DEFAULT_REGION = process.env.FIREBASE_FUNCTIONS_REGION ?? 'us-central1';
const DEFAULT_TIMEOUT_MS = Number(process.env.MODERATION_TIMEOUT_MS ?? '8000');

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const resolveFunctionsBaseUrl = () => {
  const explicit = process.env.MODERATION_FUNCTIONS_BASE_URL || process.env.FUNCTIONS_BASE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const emulatorHost = process.env.FIREBASE_FUNCTIONS_EMULATOR_ORIGIN || process.env.FUNCTIONS_EMULATOR_HOST;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error('Missing Firebase project id for moderation functions.');
  }

  const region = process.env.FIREBASE_FUNCTIONS_REGION || DEFAULT_REGION;

  if (emulatorHost) {
    return `${emulatorHost.replace(/\/$/, '')}/${projectId}/${region}`;
  }

  return `https://${region}-${projectId}.cloudfunctions.net`;
};

const buildModerationUrl = () => `${resolveFunctionsBaseUrl()}/previewModeration`;

export const runPromptModeration = async (
  input: PromptModerationInput,
  options: { signal?: AbortSignal } = {},
): Promise<PromptModerationResponse> => {
  const url = buildModerationUrl();

  const controller = new AbortController();
  const externalAbortHandler = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', externalAbortHandler, { once: true });
    }
  }

  const payload: PromptModerationInput = {
    ...input,
    context: input.context ?? 'prompt',
    source: input.source ?? 'preview',
  };

  logger.debug('moderation.prompt.request', {
    hasText: Boolean(payload.text),
    hasImage: Boolean(payload.imageUrl || payload.imageBase64),
    context: payload.context,
  });

  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      const fallback = await response.text();
      logger.error('moderation.prompt.failed', {
        status: response.status,
        body: fallback,
      });
      throw new Error(`Moderation request failed with status ${response.status}`);
    }

    const data = (await response.json()) as PromptModerationResponse;
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Moderation request failed: timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (options.signal) {
      options.signal.removeEventListener('abort', externalAbortHandler);
    }
  }
};
