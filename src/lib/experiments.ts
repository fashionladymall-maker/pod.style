import { logger } from "@/utils/logger";
import { logAnalyticsEvent } from "./analytics";
import { getRemoteConfigJSON } from "./remote-config";
import { z } from "zod";

const EXPERIMENTS_REMOTE_CONFIG_KEY = "experiments_config";
const FEATURE_FLAGS_REMOTE_CONFIG_KEY = "feature_flags";
const REMOTE_CONFIG_CACHE_TTL_MS = 60_000;

const experimentVariantSchema = z.object({
  id: z.string().min(1),
  weight: z.number().nonnegative().default(0),
  name: z.string().optional(),
  description: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

const experimentDefinitionSchema = z.object({
  key: z.string().min(1),
  version: z.string().optional(),
  description: z.string().optional(),
  defaultVariant: z.string().min(1),
  variants: z.array(experimentVariantSchema).min(1),
  metrics: z.array(z.string().min(1)).optional(),
  featureFlag: z.string().optional(),
  overrides: z.record(z.string().min(1)).optional(),
  guardrailMetrics: z.array(z.string().min(1)).optional(),
});

const experimentsConfigSchema = z.object({
  updatedAt: z.string().optional(),
  version: z.string().optional(),
  experiments: z.array(experimentDefinitionSchema).default([]),
});

const featureFlagsSchema = z.record(z.boolean()).default({});

export type ExperimentVariant = z.infer<typeof experimentVariantSchema>;
export type ExperimentDefinition = z.infer<typeof experimentDefinitionSchema>;
export type ExperimentsConfig = z.infer<typeof experimentsConfigSchema>;
export type FeatureFlagsConfig = z.infer<typeof featureFlagsSchema>;

type ExperimentCacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type ExperimentAssignmentReason = "default" | "override" | "weighted";

type RemoteConfigSource = "remote-config" | "env" | "none";

interface RemoteConfigPayload<T> {
  value: T;
  source: RemoteConfigSource;
}

export type FeatureFlagSource = "remote-config" | "env" | "default";

export interface FeatureFlagEvaluation {
  value: boolean;
  source: FeatureFlagSource;
}

export interface ExperimentAssignment {
  experiment: ExperimentDefinition;
  variant: ExperimentVariant;
  bucket: number;
  hash: number;
  reason: ExperimentAssignmentReason;
}

export interface AssignmentOptions {
  fallbackVariantId?: string;
  seed?: string;
}

export interface ExperimentExposureContext {
  userId?: string;
  sessionId?: string;
  attributes?: Record<string, unknown>;
}

const ENV_OVERRIDE_KEYS: Record<string, string[]> = {
  [EXPERIMENTS_REMOTE_CONFIG_KEY]: [
    "EXPERIMENTS_CONFIG",
    "REMOTE_CONFIG_EXPERIMENTS_CONFIG",
    "NEXT_PUBLIC_REMOTE_CONFIG_EXPERIMENTS_CONFIG",
  ],
  [FEATURE_FLAGS_REMOTE_CONFIG_KEY]: [
    "FEATURE_FLAGS",
    "FEATURE_FLAGS_CONFIG",
    "REMOTE_CONFIG_FEATURE_FLAGS",
    "NEXT_PUBLIC_REMOTE_CONFIG_FEATURE_FLAGS",
  ],
};

const DEFAULT_EXPERIMENTS_CONFIG: ExperimentsConfig = { experiments: [] };
const DEFAULT_FEATURE_FLAGS_CONFIG: FeatureFlagsConfig = {};

let experimentsCache: ExperimentCacheEntry<RemoteConfigPayload<ExperimentsConfig>> | null = null;
let featureFlagsCache: ExperimentCacheEntry<RemoteConfigPayload<FeatureFlagsConfig>> | null = null;

const toEnvKey = (key: string) => key.replace(/[^a-z0-9]+/gi, "_").toUpperCase();

const readJsonStringFromEnv = (parameterKey: string): string | null => {
  const explicitKeys = ENV_OVERRIDE_KEYS[parameterKey] ?? [];
  const derivedKeys = [
    parameterKey.toUpperCase(),
    `REMOTE_CONFIG_${toEnvKey(parameterKey)}`,
    `NEXT_PUBLIC_REMOTE_CONFIG_${toEnvKey(parameterKey)}`,
  ];

  const candidates = [...explicitKeys, ...derivedKeys];
  for (const candidate of candidates) {
    const value = process.env[candidate];
    if (value) {
      return value;
    }
  }
  return null;
};

const parseJson = (value: string | null, context: string): unknown | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    logger.warn("experiments.json_parse_failed", {
      context,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
};

const extractRemoteConfigValue = (input: unknown): string | null => {
  if (input && typeof input === 'object' && 'value' in input) {
    const { value } = input as { value?: unknown };
    return typeof value === 'string' ? value : null;
  }
  return null;
};

const fetchServerRemoteConfigString = async (parameterKey: string): Promise<string | null> => {
  if (typeof window !== "undefined") {
    return null;
  }

  try {
    const adminModule = await import("./firebase-admin");
    if (!adminModule.isFirebaseAdminConfigured()) {
      return null;
    }

    try {
      const template = await adminModule.default.remoteConfig().getTemplate();
      const parameter = template.parameters?.[parameterKey];
      if (!parameter) {
        return null;
      }

      const defaultValue = extractRemoteConfigValue(parameter.defaultValue);
      if (defaultValue) {
        return defaultValue;
      }

      const conditionalValues = parameter.conditionalValues;
      if (conditionalValues) {
        for (const entry of Object.values(conditionalValues)) {
          const conditionalValue = extractRemoteConfigValue(entry);
          if (conditionalValue) {
            return conditionalValue;
          }
        }
      }
    } catch (error) {
      logger.warn("experiments.remote_config_template_failed", {
        parameterKey,
        error: error instanceof Error ? error.message : error,
      });
    }
  } catch (error) {
    logger.warn("experiments.remote_config_admin_unavailable", {
      parameterKey,
      error: error instanceof Error ? error.message : error,
    });
  }

  return null;
};

const loadRemoteConfigPayload = async (
  parameterKey: string,
): Promise<RemoteConfigPayload<unknown>> => {
  if (typeof window === "undefined") {
    const serverValue = await fetchServerRemoteConfigString(parameterKey);
    const parsedServerValue = parseJson(serverValue, `remote-config.server.${parameterKey}`);
    if (parsedServerValue !== null) {
      return { value: parsedServerValue, source: "remote-config" };
    }
  } else {
    const clientValue = await getRemoteConfigJSON<unknown>(parameterKey);
    if (clientValue !== null) {
      return { value: clientValue, source: "remote-config" };
    }
  }

  const envValue = parseJson(readJsonStringFromEnv(parameterKey), `env.${parameterKey}`);
  if (envValue !== null) {
    return { value: envValue, source: "env" };
  }

  return { value: null, source: "none" };
};

const parseExperimentsConfig = (raw: unknown): ExperimentsConfig => {
  if (!raw) {
    return DEFAULT_EXPERIMENTS_CONFIG;
  }

  const result = experimentsConfigSchema.safeParse(raw);
  if (!result.success) {
    logger.warn("experiments.config.invalid", {
      issues: result.error.issues,
    });
    return DEFAULT_EXPERIMENTS_CONFIG;
  }

  return result.data;
};

const parseFeatureFlagsConfig = (raw: unknown): FeatureFlagsConfig => {
  if (!raw) {
    return DEFAULT_FEATURE_FLAGS_CONFIG;
  }

  const result = featureFlagsSchema.safeParse(raw);
  if (!result.success) {
    logger.warn("experiments.feature_flags.invalid", {
      issues: result.error.issues,
    });
    return DEFAULT_FEATURE_FLAGS_CONFIG;
  }

  return result.data;
};

const now = () => Date.now();

const hashString = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const selectVariant = (
  experiment: ExperimentDefinition,
  hash: number,
): ExperimentVariant => {
  const variants = experiment.variants.filter((variant) => variant.weight > 0);
  if (variants.length === 0) {
    const fallback = experiment.variants.find(
      (variant) => variant.id === experiment.defaultVariant,
    );
    return fallback ?? experiment.variants[0];
  }

  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
  const bucketValue = (hash / 0xffffffff) * totalWeight;
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucketValue < cumulative) {
      return variant;
    }
  }

  return variants[variants.length - 1];
};

const resolveOverrideVariant = (
  experiment: ExperimentDefinition,
  identifier: string,
): ExperimentVariant | null => {
  const overrides = experiment.overrides;
  if (!overrides) {
    return null;
  }

  const overrideId = overrides[identifier];
  if (!overrideId) {
    return null;
  }

  return (
    experiment.variants.find((variant) => variant.id === overrideId) ??
    experiment.variants.find((variant) => variant.id === experiment.defaultVariant) ??
    null
  );
};

const getCache = <T>(cache: ExperimentCacheEntry<T> | null): T | null => {
  if (!cache) {
    return null;
  }

  if (cache.expiresAt < now()) {
    return null;
  }

  return cache.value;
};

const setCache = <T>(value: T): ExperimentCacheEntry<T> => ({
  value,
  expiresAt: now() + REMOTE_CONFIG_CACHE_TTL_MS,
});

export const getExperimentsConfig = async (options?: {
  forceRefresh?: boolean;
}): Promise<ExperimentsConfig> => {
  if (!options?.forceRefresh) {
    const cached = getCache(experimentsCache);
    if (cached) {
      return cached.value;
    }
  }

  const payload = await loadRemoteConfigPayload(EXPERIMENTS_REMOTE_CONFIG_KEY);
  const parsedConfig = parseExperimentsConfig(payload.value);
  experimentsCache = setCache({ value: parsedConfig, source: payload.source });
  return parsedConfig;
};

export const getFeatureFlagsConfig = async (options?: {
  forceRefresh?: boolean;
}): Promise<FeatureFlagsConfig> => {
  if (!options?.forceRefresh) {
    const cached = getCache(featureFlagsCache);
    if (cached) {
      return cached.value;
    }
  }

  const payload = await loadRemoteConfigPayload(FEATURE_FLAGS_REMOTE_CONFIG_KEY);
  const parsedConfig = parseFeatureFlagsConfig(payload.value);
  featureFlagsCache = setCache({ value: parsedConfig, source: payload.source });
  return parsedConfig;
};

export const findExperiment = async (
  experimentKey: string,
  options?: { forceRefresh?: boolean },
): Promise<ExperimentDefinition | null> => {
  const config = await getExperimentsConfig(options);
  return config.experiments.find((experiment) => experiment.key === experimentKey) ?? null;
};

const resolveDefaultVariant = (
  experiment: ExperimentDefinition,
  fallbackVariantId?: string,
): ExperimentVariant => {
  const defaultVariant = experiment.variants.find(
    (variant) => variant.id === (fallbackVariantId ?? experiment.defaultVariant),
  );
  return defaultVariant ?? experiment.variants[0];
};

export const assignUserToExperiment = (
  experiment: ExperimentDefinition,
  userIdentifier: string | null | undefined,
  options?: AssignmentOptions,
): ExperimentAssignment => {
  const effectiveIdentifier = options?.seed ?? userIdentifier;

  if (effectiveIdentifier) {
    const overrideVariant = resolveOverrideVariant(experiment, effectiveIdentifier);
    if (overrideVariant) {
      const overrideHash = hashString(`${experiment.key}:${effectiveIdentifier}:override`);
      return {
        experiment,
        variant: overrideVariant,
        bucket: 1,
        hash: overrideHash,
        reason: "override",
      };
    }

    const hash = hashString(`${experiment.key}:${effectiveIdentifier}`);
    const variant = selectVariant(experiment, hash);
    return {
      experiment,
      variant,
      bucket: hash / 0xffffffff,
      hash,
      reason: "weighted",
    };
  }

  return {
    experiment,
    variant: resolveDefaultVariant(experiment, options?.fallbackVariantId),
    bucket: 0,
    hash: 0,
    reason: "default",
  };
};

const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "t", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "f", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return undefined;
};

export const getFeatureFlagValue = async (
  flagKey: string,
  defaultValue = false,
  options?: { forceRefresh?: boolean },
): Promise<FeatureFlagEvaluation> => {
  const featureFlags = await getFeatureFlagsConfig(options);
  const cachePayload = featureFlagsCache ? featureFlagsCache.value : null;
  const configSource = cachePayload?.source ?? "none";

  if (flagKey in featureFlags) {
    const value = featureFlags[flagKey];
    const source: FeatureFlagSource =
      configSource === "remote-config"
        ? "remote-config"
        : configSource === "env"
          ? "env"
          : "remote-config";
    return { value, source };
  }

  const envKey = toEnvKey(flagKey);
  const envCandidates = [
    `NEXT_PUBLIC_FEATURE_FLAG_${envKey}`,
    `FEATURE_FLAG_${envKey}`,
  ];

  for (const candidate of envCandidates) {
    const envValue = parseBoolean(process.env[candidate]);
    if (envValue !== undefined) {
      return { value: envValue, source: "env" };
    }
  }

  return { value: defaultValue, source: "default" };
};

export const recordExperimentExposure = async (
  assignment: ExperimentAssignment,
  context?: ExperimentExposureContext,
): Promise<void> => {
  const params = {
    experiment_key: assignment.experiment.key,
    experiment_version: assignment.experiment.version ?? "unversioned",
    variant_id: assignment.variant.id,
    reason: assignment.reason,
    bucket: assignment.bucket,
    user_id: context?.userId ?? null,
    session_id: context?.sessionId ?? null,
    ...context?.attributes,
  } as Record<string, unknown>;

  const logged = await logAnalyticsEvent("experiment_exposure", params);
  if (!logged) {
    logger.info("experiments.exposure", params);
  }
};

export const recordExperimentConversion = async (
  experimentKey: string,
  variantId: string,
  conversionEvent: string,
  context?: ExperimentExposureContext,
): Promise<void> => {
  const params = {
    experiment_key: experimentKey,
    variant_id: variantId,
    conversion_event: conversionEvent,
    user_id: context?.userId ?? null,
    session_id: context?.sessionId ?? null,
    ...context?.attributes,
  } as Record<string, unknown>;

  const logged = await logAnalyticsEvent("experiment_conversion", params);
  if (!logged) {
    logger.info("experiments.conversion", params);
  }
};

export interface ExperimentReport {
  generatedAt: string;
  experiments: Array<{
    key: string;
    version?: string;
    defaultVariant: string;
    variants: Array<{
      id: string;
      weight: number;
    }>;
    status: "pending";
  }>;
  notes: string[];
}

export const generateExperimentReportPlaceholder = async (): Promise<ExperimentReport> => {
  const config = await getExperimentsConfig();
  return {
    generatedAt: new Date().toISOString(),
    experiments: config.experiments.map((experiment) => ({
      key: experiment.key,
      version: experiment.version,
      defaultVariant: experiment.defaultVariant,
      variants: experiment.variants.map((variant) => ({
        id: variant.id,
        weight: variant.weight,
      })),
      status: "pending",
    })),
    notes: [
      "Experiment analytics integration pending full data export pipeline.",
      "Update report generator once BigQuery export is connected.",
    ],
  };
};

export const resetExperimentsCacheForTests = () => {
  experimentsCache = null;
  featureFlagsCache = null;
};
