export type ModerationStatus = 'pass' | 'warn' | 'reject';

export interface TextModerationMatch {
  ruleId: string;
  label: string;
  severity: Exclude<ModerationStatus, 'pass'>;
  matches: string[];
}

export interface TextModerationMetrics {
  totalRulesEvaluated: number;
  totalMatches: number;
  flaggedRules: number;
  truncated: boolean;
}

export interface TextModerationResult {
  status: ModerationStatus;
  matches: TextModerationMatch[];
  metrics: TextModerationMetrics;
  sanitizedText?: string;
}

export interface ImageModerationFlag {
  category: 'adult' | 'violence' | 'racy' | 'medical' | 'spoof';
  likelihood: 'UNKNOWN' | 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  severity: Exclude<ModerationStatus, 'pass'>;
  threshold: 'UNKNOWN' | 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
}

export interface ImageModerationResult {
  status: ModerationStatus;
  flags: ImageModerationFlag[];
  rawLikelihood?: Record<ImageModerationFlag['category'], ImageModerationFlag['likelihood']>;
  providerState?: 'skipped' | 'ok' | 'error';
  errorMessage?: string;
}

export interface PromptModerationResponse {
  status: ModerationStatus;
  text?: TextModerationResult;
  image?: ImageModerationResult;
  recordId: string;
  appealStatus: 'none' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  metadata?: Record<string, unknown>;
}

export interface PromptModerationInput {
  text?: string;
  imageUrl?: string;
  imageBase64?: string;
  userId?: string | null;
  referenceId?: string | null;
  context?: string | null;
  source?: 'preview' | 'prepublish' | 'postpublish';
  metadata?: Record<string, unknown>;
}

