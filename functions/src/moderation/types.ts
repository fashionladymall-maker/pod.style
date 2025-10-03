export type ModerationStatus = 'pass' | 'warn' | 'reject';

export interface TextModerationMatch {
  /** Identifier for the matched rule */
  ruleId: string;
  /** Human readable description of the rule */
  label: string;
  /** Severity associated with the rule */
  severity: Exclude<ModerationStatus, 'pass'>;
  /** Raw matches that triggered the rule */
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

export type SafeSearchCategory = 'adult' | 'violence' | 'racy' | 'medical' | 'spoof';

export interface ImageModerationFlag {
  category: SafeSearchCategory;
  likelihood: SafeSearchLikelihood;
  severity: Exclude<ModerationStatus, 'pass'>;
  threshold: SafeSearchLikelihood;
}

export type SafeSearchLikelihood =
  | 'UNKNOWN'
  | 'VERY_UNLIKELY'
  | 'UNLIKELY'
  | 'POSSIBLE'
  | 'LIKELY'
  | 'VERY_LIKELY';

export interface ImageModerationResult {
  status: ModerationStatus;
  flags: ImageModerationFlag[];
  rawLikelihood?: Record<SafeSearchCategory, SafeSearchLikelihood>;
  providerState?: 'skipped' | 'ok' | 'error';
  errorMessage?: string;
}

export interface ModerationRecordInput {
  recordType: 'text' | 'image' | 'combined';
  userId?: string | null;
  referenceId?: string | null;
  context?: string | null;
  contentHash: string;
  textResult?: TextModerationResult;
  imageResult?: ImageModerationResult;
  status: ModerationStatus;
  source: 'preview' | 'prepublish' | 'postpublish';
  metadata?: Record<string, unknown>;
}

export interface ModerationRecord extends ModerationRecordInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  appealStatus: 'none' | 'submitted' | 'in_review' | 'approved' | 'rejected';
}

