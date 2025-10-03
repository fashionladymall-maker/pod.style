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
exports.moderateText = void 0;
const functions = __importStar(require("firebase-functions"));
const utils_1 = require("./utils");
const DEFAULT_PATTERNS = [
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
let cachedPatterns = null;
const compilePattern = (config) => {
    try {
        const source = config.isRegex ? config.pattern : (0, utils_1.escapeRegExp)(config.pattern);
        const flags = config.isRegex ? 'gi' : 'gi';
        return {
            ...config,
            regex: new RegExp(source, flags),
        };
    }
    catch (error) {
        functions.logger.warn('moderation.text.invalid_pattern', {
            id: config.id,
            error: error.message,
        });
        return null;
    }
};
const parseCustomPatterns = () => {
    const raw = process.env.MODERATION_SENSITIVE_PATTERNS;
    if (!raw) {
        return [];
    }
    try {
        const values = JSON.parse(raw);
        if (!Array.isArray(values)) {
            return [];
        }
        return values.filter((value) => typeof value?.id === 'string' && typeof value?.pattern === 'string');
    }
    catch (error) {
        functions.logger.error('moderation.text.patterns_parse_failed', {
            error: error.message,
        });
        return [];
    }
};
const loadPatterns = () => {
    if (cachedPatterns) {
        return cachedPatterns;
    }
    const custom = parseCustomPatterns();
    const configs = [...DEFAULT_PATTERNS, ...custom];
    cachedPatterns = configs
        .map((config) => compilePattern(config))
        .filter((pattern) => Boolean(pattern));
    return cachedPatterns;
};
const buildMatch = (pattern, text) => {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : `${pattern.regex.flags}g`);
    const matches = [];
    let iteration = 0;
    let match = regex.exec(text);
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
const sanitize = (value) => {
    const normalized = value.normalize('NFKC');
    const condensed = normalized.replace(/\s+/g, ' ').trim();
    const truncated = condensed.length !== value.length;
    return { sanitized: condensed, truncated };
};
const moderateText = (input, options = {}) => {
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
        .filter((pattern) => Boolean(pattern));
    const matches = [];
    let totalMatches = 0;
    for (const pattern of patterns) {
        const match = buildMatch(pattern, sanitized);
        if (match) {
            matches.push(match);
            totalMatches += match.matches.length;
        }
    }
    const status = (0, utils_1.resolveStatus)(...matches.map((item) => item.severity));
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
exports.moderateText = moderateText;
exports.default = exports.moderateText;
