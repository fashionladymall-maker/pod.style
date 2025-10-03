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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewModerationHandler = void 0;
const functions = __importStar(require("firebase-functions"));
const zod_1 = require("zod");
const text_1 = __importDefault(require("../moderation/text"));
const image_1 = require("../moderation/image");
const record_1 = require("../moderation/record");
const utils_1 = require("../moderation/utils");
const requestSchema = zod_1.z.object({
    text: zod_1.z.string().max(4000).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    imageBase64: zod_1.z.string().max(10000000).optional(),
    userId: zod_1.z.string().optional().nullable(),
    referenceId: zod_1.z.string().optional().nullable(),
    context: zod_1.z.string().optional().nullable(),
    recordType: zod_1.z.enum(['text', 'image', 'combined']).optional(),
    source: zod_1.z.enum(['preview', 'prepublish', 'postpublish']).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
const buildContentHash = (text, imageUrl, imageBase64) => {
    const parts = [];
    if (text) {
        parts.push(`text:${(0, utils_1.hashContent)(text)}`);
    }
    if (imageUrl) {
        parts.push(`imageUrl:${(0, utils_1.hashContent)(imageUrl)}`);
    }
    if (imageBase64) {
        // Hash only the first 4kb to avoid large updates – ensures deterministic hash for identical uploads.
        const slice = imageBase64.slice(0, 4096);
        parts.push(`imageData:${(0, utils_1.hashContent)(slice)}`);
    }
    return parts.join('|') || (0, utils_1.hashContent)('empty-content');
};
const allowCors = (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};
const moderateContent = async (body) => {
    const textResult = body.text ? (0, text_1.default)(body.text) : undefined;
    const imageResult = body.imageUrl || body.imageBase64 ? await (0, image_1.moderateImage)({
        imageUrl: body.imageUrl ?? undefined,
        imageBase64: body.imageBase64 ?? undefined,
    }) : undefined;
    const status = (0, utils_1.resolveStatus)(textResult?.status ?? 'pass', imageResult?.status ?? 'pass');
    const record = await (0, record_1.createModerationRecord)({
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
    }, {
        textSample: body.text ?? null,
        imageSource: body.imageUrl ? 'url' : body.imageBase64 ? 'base64' : null,
        imageReference: body.imageUrl ?? null,
        upsertByHash: true,
    });
    functions.logger.info('moderation.result', {
        status,
        userId: body.userId ?? 'anonymous',
        recordId: record.id,
        referenceId: body.referenceId ?? null,
        hasText: Boolean(body.text),
        hasImage: Boolean(body.imageUrl || body.imageBase64),
    });
    const responseBody = {
        status,
        text: textResult,
        image: imageResult,
        recordId: record.id,
        appealStatus: record.appealStatus,
        metadata: record.metadata,
    };
    return responseBody;
};
exports.previewModerationHandler = functions.https.onRequest(async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'invalid_payload', details: error.flatten() });
            return;
        }
        functions.logger.error('moderation.preview.unhandled', {
            error: error.message,
        });
        res.status(500).json({ error: 'internal_error' });
    }
});
exports.default = exports.previewModerationHandler;
