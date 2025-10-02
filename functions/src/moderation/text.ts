import * as functions from 'firebase-functions';
import type { ModerationStatus, TextModerationMatch, TextModerationResult } from './types';
import { escapeRegExp, resolveStatus } from './utils';

type RuleSeverity = Exclude<ModerationStatus, 'pass'>;

interface SensitivePatternConfig {
  id: string;
  label: string;
  pattern: string;
  severity: RuleSeverity;
  isRegex?: boolean;
  hint?: string;
}

interface NormalizedPattern extends SensitivePatternConfig {
  regex: RegExp;
}

const DEFAULT_PATTERNS: SensitivePatternConfig[] = [
  {
    id: 'placeholder-profanity',
    label: 'Contains restricted vocabulary placeholder',
    pattern: 'bannedword',
    severity: 'reject',
  },
  {
    id: 'self-harm-risk',
    label: 'Potential self-harm intent',
    pattern: '(?:self-?harm|harm\s+myself|end\s+my\s+life)',
    severity: 'warn',
    isRegex: true,
  },
  {
    id: 'graphic-violence-placeholder',
    label: 'Describes graphic violence placeholder',
    pattern: '(?:graphic\s+violence|extreme\s+injury)',
    severity: 'warn',
    isRegex: true,
  },
];

let cachedPatterns: NormalizedPattern[] | null = null;

export const resetTextModerationCache = () => {
  cachedPatterns = null;
};

const compilePattern = (config: SensitivePatternConfig): NormalizedPattern | null => {
  try {
    const source = config.isRegex ? config.pattern : escapeRegExp(config.pattern);
    const flags = config.isRegex ? 'gi' : 'gi';
    return {
      ...config,
      regex: new RegExp(source, flags),
    };
  } catch (error) {
    functions.logger.warn('moderation.text.invalid_pattern', {
      id: config.id,
      error: (error as Error).message,
    });
    return null;
  }
};

const parseCustomPatterns = (): SensitivePatternConfig[] => {
  const raw = process.env.MODERATION_SENSITIVE_PATTERNS;
  if (!raw) {
    return [];
  }
  try {
    const values = JSON.parse(raw) as SensitivePatternConfig[];
    if (!Array.isArray(values)) {
      return [];
    }
    return values.filter((value) => typeof value?.id === 'string' && typeof value?.pattern === 'string');
  } catch (error) {
    functions.logger.error('moderation.text.patterns_parse_failed', {
      error: (error as Error).message,
    });
    return [];
  }
};

const loadPatterns = (): NormalizedPattern[] => {
  if (cachedPatterns) {
    return cachedPatterns;
  }
  const custom = parseCustomPatterns();
  const configs = [...DEFAULT_PATTERNS, ...custom];
  cachedPatterns = configs
    .map((config) => compilePattern(config))
    .filter((pattern): pattern is NormalizedPattern => Boolean(pattern));
  return cachedPatterns;
};

const buildMatch = (pattern: NormalizedPattern, text: string): TextModerationMatch | null => {
  const regex = new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : `${pattern.regex.flags}g`);
  const matches = [] as string[];
  let iteration = 0;
  let match: RegExpExecArray | null = regex.exec(text);
  while (match && iteration < 5) {
    matches.push(match[0]);
    iteration += 1;
    match = regex.exec(text);
  }

  if (matches.length === 0) {
    return null;
  }

  return {
    ruleId: pattern.id,
    label: pattern.label,
    severity: pattern.severity,
    matches,
  };
};

interface ModerateTextOptions {
  /** Optional additional patterns applied before the configured list. */
  overridePatterns?: SensitivePatternConfig[];
}

const sanitize = (value: string): { sanitized: string; truncated: boolean } => {
  const normalized = value.normalize('NFKC');
  const condensed = normalized.replace(/\s+/g, ' ').trim();
  const truncated = condensed.length !== value.length;
  return { sanitized: condensed, truncated };
};

export const moderateText = (input: string, options: ModerateTextOptions = {}): TextModerationResult => {
  if (!input || !input.trim()) {
    return {
      status: 'pass',
      matches: [],
      metrics: {
        totalRulesEvaluated: 0,
        totalMatches: 0,
        flaggedRules: 0,
        truncated: false,
      },
      sanitizedText: input,
    };
  }

  const { sanitized, truncated } = sanitize(input);
  const patterns = [...(options.overridePatterns ?? []), ...loadPatterns()]
    .map((pattern) => compilePattern(pattern) ?? null)
    .filter((pattern): pattern is NormalizedPattern => Boolean(pattern));

  const matches: TextModerationMatch[] = [];
  let totalMatches = 0;

  for (const pattern of patterns) {
    const match = buildMatch(pattern, sanitized);
    if (match) {
      matches.push(match);
      totalMatches += match.matches.length;
    }
  }

  const status = resolveStatus(...matches.map((item) => item.severity));

  return {
    status,
    matches,
    metrics: {
      totalRulesEvaluated: patterns.length,
      totalMatches,
      flaggedRules: matches.length,
      truncated,
    },
    sanitizedText: sanitized,
  };
};

export default moderateText;
