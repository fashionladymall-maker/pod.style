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
exports.renderQueueWorker = exports.processRenderJob = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const node_crypto_1 = __importDefault(require("node:crypto"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const tasks_1 = require("firebase-functions/v2/tasks");
const sharp_1 = __importDefault(require("sharp"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const zod_1 = require("zod");
const MM_PER_INCH = 25.4;
const defaultQueueOptions = {
    rateLimits: {
        maxDispatchesPerSecond: 2,
        maxConcurrentDispatches: 1,
    },
    retryConfig: {
        maxAttempts: 5,
        minBackoffSeconds: 10,
        maxBackoffSeconds: 600,
        maxDoublings: 3,
    },
};
const colorSchema = zod_1.z.object({
    r: zod_1.z.number().min(0).max(255).default(255),
    g: zod_1.z.number().min(0).max(255).default(255),
    b: zod_1.z.number().min(0).max(255).default(255),
    alpha: zod_1.z.number().min(0).max(1).default(1),
});
const specSchema = zod_1.z.object({
    widthMm: zod_1.z.number().positive(),
    heightMm: zod_1.z.number().positive(),
    dpi: zod_1.z.number().min(300).default(300),
    bleedMm: zod_1.z.number().nonnegative().default(3),
    safeZoneMm: zod_1.z.number().nonnegative().default(3),
    iccProfile: zod_1.z
        .object({
        bucket: zod_1.z.string(),
        path: zod_1.z.string(),
        name: zod_1.z.string().optional(),
    })
        .optional(),
    background: colorSchema.optional(),
    outputFormat: zod_1.z.enum(['tiff', 'pdf', 'both']).default('tiff'),
});
const safeAreaSchema = zod_1.z.object({
    xMm: zod_1.z.number().nonnegative(),
    yMm: zod_1.z.number().nonnegative(),
    widthMm: zod_1.z.number().positive(),
    heightMm: zod_1.z.number().positive(),
});
const payloadSchema = zod_1.z.object({
    designId: zod_1.z.string().min(1),
    orderId: zod_1.z.string().min(1),
    lineItemId: zod_1.z.string().min(1),
    source: zod_1.z.object({
        bucket: zod_1.z.string().min(1),
        path: zod_1.z.string().min(1),
    }),
    output: zod_1.z
        .object({
        bucket: zod_1.z.string().min(1).optional(),
    })
        .optional(),
    printSpec: specSchema,
    safeArea: safeAreaSchema,
    metadata: zod_1.z
        .object({
        designChecksum: zod_1.z.string().optional(),
    })
        .optional(),
});
const defaultDeps = {
    getStorage: () => admin.storage(),
    getFirestore: () => admin.firestore(),
};
const mmToPixels = (mm, dpi) => Math.round((mm / MM_PER_INCH) * dpi);
const clamp = (value, precision = 3) => Number(value.toFixed(precision));
function calculateSafeMarginsMm(spec, safeArea) {
    const left = safeArea.xMm;
    const top = safeArea.yMm;
    const right = spec.widthMm - (safeArea.xMm + safeArea.widthMm);
    const bottom = spec.heightMm - (safeArea.yMm + safeArea.heightMm);
    return {
        top,
        right,
        bottom,
        left,
    };
}
async function downloadFile(bucket, path) {
    const [buffer] = await bucket.file(path).download();
    return buffer;
}
const createPdfFromImage = async (image, widthPx, heightPx, dpi) => {
    const widthPoints = (widthPx / dpi) * 72;
    const heightPoints = (heightPx / dpi) * 72;
    return await new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ size: [widthPoints, heightPoints], margin: 0 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('error', reject);
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.image(image, 0, 0, { width: widthPoints, height: heightPoints });
        doc.end();
    });
};
async function maybeWriteTempIcc(buffer, suggestedName) {
    const extension = suggestedName?.split('.').pop() ?? 'icc';
    const filePath = (0, node_path_1.join)((0, node_os_1.tmpdir)(), `render-icc-${node_crypto_1.default.randomUUID()}.${extension}`);
    await node_fs_1.promises.writeFile(filePath, buffer);
    return filePath;
}
async function removeTemp(path) {
    if (!path)
        return;
    try {
        await node_fs_1.promises.unlink(path);
    }
    catch (error) {
        firebase_functions_1.logger.warn('render.worker.temp_cleanup_failed', { path, error: error.message });
    }
}
const processRenderJob = async (rawPayload, deps = defaultDeps) => {
    const payload = payloadSchema.parse(rawPayload);
    const storage = deps.getStorage();
    const firestore = deps.getFirestore();
    const sourceBucket = storage.bucket(payload.source.bucket);
    const targetBucket = payload.output?.bucket ? storage.bucket(payload.output.bucket) : storage.bucket();
    const sourceBuffer = await downloadFile(sourceBucket, payload.source.path);
    const metadata = await (0, sharp_1.default)(sourceBuffer).metadata();
    if (!metadata.width || !metadata.height) {
        throw new Error('Unable to determine source image dimensions');
    }
    const spec = payload.printSpec;
    const bleedMm = spec.bleedMm ?? 3;
    const safeZoneMm = spec.safeZoneMm ?? 3;
    const dpi = spec.dpi ?? 300;
    const requiredWidthPx = mmToPixels(spec.widthMm + bleedMm * 2, dpi);
    const requiredHeightPx = mmToPixels(spec.heightMm + bleedMm * 2, dpi);
    if (metadata.width < requiredWidthPx || metadata.height < requiredHeightPx) {
        throw new Error('Source image resolution is insufficient for requested print size with bleed');
    }
    const estimatedDpiWidth = (metadata.width * MM_PER_INCH) / (spec.widthMm + bleedMm * 2);
    const estimatedDpiHeight = (metadata.height * MM_PER_INCH) / (spec.heightMm + bleedMm * 2);
    const actualDpi = Math.min(estimatedDpiWidth, estimatedDpiHeight);
    if (actualDpi < 300) {
        throw new Error(`Source image DPI is below minimum threshold: ${actualDpi.toFixed(1)}dpi`);
    }
    const safeMargins = calculateSafeMarginsMm(spec, payload.safeArea);
    const tolerance = 0.1;
    const safeZonePassed = safeMargins.left + tolerance >= safeZoneMm &&
        safeMargins.right + tolerance >= safeZoneMm &&
        safeMargins.top + tolerance >= safeZoneMm &&
        safeMargins.bottom + tolerance >= safeZoneMm;
    if (!safeZonePassed) {
        throw new Error('Safe zone requirements not satisfied');
    }
    const actualBleedMm = ((metadata.width * MM_PER_INCH) / dpi - spec.widthMm) / 2;
    if (actualBleedMm + tolerance < bleedMm) {
        throw new Error('Bleed area is smaller than required 3mm');
    }
    let iccTempPath = null;
    let iccApplied = false;
    let iccProfileName;
    let pipeline = (0, sharp_1.default)(sourceBuffer, { failOn: 'none', limitInputPixels: false }).rotate();
    if (spec.background) {
        pipeline = pipeline.flatten({
            background: {
                r: spec.background.r,
                g: spec.background.g,
                b: spec.background.b,
                alpha: spec.background.alpha,
            },
        });
    }
    if (spec.iccProfile) {
        const iccBuffer = await downloadFile(storage.bucket(spec.iccProfile.bucket), spec.iccProfile.path);
        iccTempPath = await maybeWriteTempIcc(iccBuffer, spec.iccProfile.name);
        pipeline = pipeline.withMetadata({ density: dpi, icc: iccTempPath });
        iccApplied = true;
        iccProfileName = spec.iccProfile.name ?? spec.iccProfile.path.split('/').pop();
    }
    else {
        pipeline = pipeline.withMetadata({ density: dpi });
    }
    pipeline = pipeline.resize(requiredWidthPx, requiredHeightPx, {
        fit: 'cover',
        position: 'centre',
        kernel: sharp_1.default.kernel.lanczos3,
        withoutEnlargement: false,
    });
    const format = spec.outputFormat ?? 'tiff';
    const tiffBuffer = await pipeline
        .clone()
        .tiff({
        compression: 'lzw',
        predictor: 'horizontal',
        xres: dpi,
        yres: dpi,
    })
        .toBuffer();
    let pdfBuffer;
    if (format === 'pdf' || format === 'both') {
        const pdfImage = await pipeline.clone().png().toBuffer();
        pdfBuffer = await createPdfFromImage(pdfImage, requiredWidthPx, requiredHeightPx, dpi);
    }
    await removeTemp(iccTempPath);
    const checksum = node_crypto_1.default.createHash('sha256').update(tiffBuffer).digest('hex');
    const timestamp = new Date().toISOString();
    const basePath = `prints/${payload.orderId}/${payload.lineItemId}`;
    const tiffPath = `${basePath}/print-ready.tif`;
    const pdfPath = pdfBuffer ? `${basePath}/print-ready.pdf` : undefined;
    const reportPath = `${basePath}/render-report.json`;
    await targetBucket.file(tiffPath).save(tiffBuffer, {
        contentType: 'image/tiff',
        metadata: {
            metadata: {
                dpi: dpi.toString(),
                bleedMm: bleedMm.toString(),
                safeZoneMm: safeZoneMm.toString(),
            },
        },
    });
    if (pdfBuffer && pdfPath) {
        await targetBucket.file(pdfPath).save(pdfBuffer, {
            contentType: 'application/pdf',
        });
    }
    const report = {
        designId: payload.designId,
        orderId: payload.orderId,
        lineItemId: payload.lineItemId,
        spec,
        checks: {
            resolution: {
                requiredDpi: dpi,
                actualDpi: clamp(actualDpi),
                passed: actualDpi >= dpi,
            },
            bleed: {
                requiredMm: bleedMm,
                actualMm: clamp(actualBleedMm),
                passed: actualBleedMm + tolerance >= bleedMm,
            },
            safeZone: {
                requiredMm: safeZoneMm,
                marginsMm: {
                    top: clamp(safeMargins.top),
                    right: clamp(safeMargins.right),
                    bottom: clamp(safeMargins.bottom),
                    left: clamp(safeMargins.left),
                },
                passed: safeZonePassed,
            },
            icc: {
                applied: iccApplied,
                profileName: iccProfileName,
            },
        },
        assets: {
            printReadyPath: tiffPath,
            printReadyFormat: format,
            pdfPath,
            reportPath,
        },
        generatedAt: timestamp,
        warnings: [],
    };
    await targetBucket
        .file(reportPath)
        .save(Buffer.from(JSON.stringify(report, null, 2)), { contentType: 'application/json' });
    const docRef = firestore.collection('designs').doc(payload.designId);
    await docRef.set({
        printAsset: {
            url: `gs://${targetBucket.name}/${tiffPath}`,
            format,
            dpi,
            icc: iccProfileName ?? (iccApplied ? 'embedded' : 'default'),
            checksum,
            reportId: `gs://${targetBucket.name}/${reportPath}`,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            metadata: {
                bleedMm,
                safeZoneMm,
                reportGeneratedAt: timestamp,
            },
        },
    }, { merge: true });
    const orderItemRef = firestore.collection('orders').doc(payload.orderId).collection('items').doc(payload.lineItemId);
    await orderItemRef.set({
        renderStatus: 'completed',
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        printAsset: {
            url: `gs://${targetBucket.name}/${tiffPath}`,
            format,
            dpi,
            checksum,
            reportId: `gs://${targetBucket.name}/${reportPath}`,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        },
        renderReportPath: `gs://${targetBucket.name}/${reportPath}`,
        outputFiles: {
            tiff: `gs://${targetBucket.name}/${tiffPath}`,
            pdf: pdfPath ? `gs://${targetBucket.name}/${pdfPath}` : null,
        },
    }, { merge: true });
    firebase_functions_1.logger.info('render.worker.completed', {
        designId: payload.designId,
        orderId: payload.orderId,
        lineItemId: payload.lineItemId,
        bucket: targetBucket.name,
        tiffPath,
        pdfPath,
    });
    return {
        report,
        checksum,
        outputUrl: `gs://${targetBucket.name}/${tiffPath}`,
    };
};
exports.processRenderJob = processRenderJob;
exports.renderQueueWorker = (0, tasks_1.onTaskDispatched)(defaultQueueOptions, async (event) => {
    const payload = payloadSchema.parse(event.data ?? {});
    firebase_functions_1.logger.info('render.worker.dispatch', {
        designId: payload.designId,
        orderId: payload.orderId,
        lineItemId: payload.lineItemId,
    });
    await (0, exports.processRenderJob)(payload, defaultDeps);
});
