"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateImage = void 0;
const functions = __importStar(require("firebase-functions"));
const utils_1 = require("./utils");
const SAFE_SEARCH_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const LIKELIHOOD_SCORE = {
    UNKNOWN: 0,
    VERY_UNLIKELY: 1,
    UNLIKELY: 2,
    POSSIBLE: 3,
    LIKELY: 4,
    VERY_LIKELY: 5,
};
const DEFAULT_THRESHOLDS = {
    adult: 'LIKELY',
    violence: 'LIKELY',
    racy: 'VERY_LIKELY',
    medical: 'VERY_LIKELY',
    spoof: 'VERY_LIKELY',
};
const parseThresholds = () => {
    const raw = process.env.MODERATION_IMAGE_THRESHOLDS;
    if (!raw) {
        return DEFAULT_THRESHOLDS;
    }
    try {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_THRESHOLDS, ...parsed };
    }
    catch (error) {
        functions.logger.error('moderation.image.threshold_parse_failed', {
            error: error.message,
        });
        return DEFAULT_THRESHOLDS;
    }
};
const meetsThreshold = (value, threshold) => LIKELIHOOD_SCORE[value] >= LIKELIHOOD_SCORE[threshold];
const severityForLikelihood = (likelihood) => LIKELIHOOD_SCORE[likelihood] >= LIKELIHOOD_SCORE.VERY_LIKELY ? 'reject' : 'warn';
const getApiKey = () => process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.GOOGLE_API_KEY;
const extractBase64 = (value) => {
    const match = value.match(/^data:[^;]+;base64,(.+)$/);
    if (match) {
        return match[1];
    }
    return value;
};
const moderateImage = async (input) => {
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
        : { content: extractBase64(input.imageBase64) };
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
        const json = (await response.json());
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
        const flags = Object.entries(annotation).flatMap(([category, likelihood]) => {
            const cat = category;
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
        const status = (0, utils_1.resolveStatus)(...flags.map((flag) => flag.severity));
        const rawLikelihood = {
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
    }
    catch (error) {
        functions.logger.error('moderation.image.moderation_failed', {
            error: error.message,
        });
        return {
            status: 'warn',
            flags: [],
            providerState: 'error',
            errorMessage: error.message,
        };
    }
};
exports.moderateImage = moderateImage;
exports.default = exports.moderateImage;
