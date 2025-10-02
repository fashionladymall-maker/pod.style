import * as functions from 'firebase-functions';
import type { ImageModerationFlag, ImageModerationResult, SafeSearchCategory, SafeSearchLikelihood } from './types';
import { resolveStatus } from './utils';

const SAFE_SEARCH_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

const LIKELIHOOD_SCORE: Record<SafeSearchLikelihood, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5,
};

const DEFAULT_THRESHOLDS: Record<SafeSearchCategory, SafeSearchLikelihood> = {
  adult: 'LIKELY',
  violence: 'LIKELY',
  racy: 'VERY_LIKELY',
  medical: 'VERY_LIKELY',
  spoof: 'VERY_LIKELY',
};

const parseThresholds = (): Record<SafeSearchCategory, SafeSearchLikelihood> => {
  const raw = process.env.MODERATION_IMAGE_THRESHOLDS;
  if (!raw) {
    return DEFAULT_THRESHOLDS;
  }
  try {
    const parsed: Partial<Record<SafeSearchCategory, SafeSearchLikelihood>> = JSON.parse(raw);
    return { ...DEFAULT_THRESHOLDS, ...parsed };
  } catch (error) {
    functions.logger.error('moderation.image.threshold_parse_failed', {
      error: (error as Error).message,
    });
    return DEFAULT_THRESHOLDS;
  }
};

const meetsThreshold = (value: SafeSearchLikelihood, threshold: SafeSearchLikelihood) =>
  LIKELIHOOD_SCORE[value] >= LIKELIHOOD_SCORE[threshold];

const severityForLikelihood = (likelihood: SafeSearchLikelihood): 'warn' | 'reject' =>
  LIKELIHOOD_SCORE[likelihood] >= LIKELIHOOD_SCORE.VERY_LIKELY ? 'reject' : 'warn';

interface ModerateImageInput {
  imageUrl?: string;
  imageBase64?: string;
  skipIfUnavailable?: boolean;
}

const getApiKey = () =>
  process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_API_KEY;

const extractBase64 = (value: string) => {
  const match = value.match(/^data:[^;]+;base64,(.+)$/);
  if (match) {
    return match[1];
  }
  return value;
};

export const moderateImage = async (input: ModerateImageInput): Promise<ImageModerationResult> => {
  if (!input.imageUrl && !input.imageBase64) {
    return {
      status: 'pass',
      flags: [],
      providerState: 'skipped',
      errorMessage: 'no_image_supplied',
    };
  }

  const mode = process.env.MODERATION_IMAGE_MODE;
  if (mode === 'mock') {
    return {
      status: 'pass',
      flags: [],
      providerState: 'skipped',
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    functions.logger.warn('moderation.image.api_key_missing');
    return {
      status: 'pass',
      flags: [],
      providerState: 'skipped',
      errorMessage: 'vision_api_key_missing',
    };
  }

  const requestImage = input.imageUrl
    ? { source: { imageUri: input.imageUrl } }
    : { content: extractBase64(input.imageBase64 as string) };

  try {
    const response = await fetch(`${SAFE_SEARCH_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: requestImage,
            features: [
              {
                type: 'SAFE_SEARCH_DETECTION',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      functions.logger.error('moderation.image.provider_error', {
        status: response.status,
        body: text,
      });
      return {
        status: 'warn',
        flags: [],
        providerState: 'error',
        errorMessage: `vision_api_error_${response.status}`,
      };
    }

    const json = (await response.json()) as {
      responses?: Array<{ safeSearchAnnotation?: Partial<Record<SafeSearchCategory, SafeSearchLikelihood>> | null }>;
    };

    const annotation = json.responses?.[0]?.safeSearchAnnotation;
    if (!annotation) {
      return {
        status: 'pass',
        flags: [],
        providerState: 'ok',
        rawLikelihood: {
          adult: 'UNKNOWN',
          medical: 'UNKNOWN',
          racy: 'UNKNOWN',
          violence: 'UNKNOWN',
          spoof: 'UNKNOWN',
        },
      };
    }

    const thresholds = parseThresholds();
    const flags: ImageModerationFlag[] = Object.entries(annotation).flatMap(([category, likelihood]) => {
      const cat = category as SafeSearchCategory;
      const value = likelihood ?? 'UNKNOWN';
      const threshold = thresholds[cat];
      if (!threshold || !meetsThreshold(value, threshold)) {
        return [];
      }

      return [
        {
          category: cat,
          likelihood: value,
          severity: severityForLikelihood(value),
          threshold,
        },
      ];
    });

    const status = resolveStatus(...flags.map((flag) => flag.severity));

    const rawLikelihood: Record<SafeSearchCategory, SafeSearchLikelihood> = {
      adult: annotation.adult ?? 'UNKNOWN',
      violence: annotation.violence ?? 'UNKNOWN',
      racy: annotation.racy ?? 'UNKNOWN',
      medical: annotation.medical ?? 'UNKNOWN',
      spoof: annotation.spoof ?? 'UNKNOWN',
    };

    return {
      status,
      flags,
      rawLikelihood,
      providerState: 'ok',
    };
  } catch (error) {
    functions.logger.error('moderation.image.moderation_failed', {
      error: (error as Error).message,
    });
    return {
      status: 'warn',
      flags: [],
      providerState: 'error',
      errorMessage: (error as Error).message,
    };
  }
};

export default moderateImage;

