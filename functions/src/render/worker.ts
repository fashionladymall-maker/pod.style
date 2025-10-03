import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onTaskDispatched, TaskQueueOptions } from 'firebase-functions/v2/tasks';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import { z } from 'zod';

type StorageBucket = ReturnType<admin.storage.Storage['bucket']>;

const MM_PER_INCH = 25.4;

const defaultQueueOptions: TaskQueueOptions = {
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

const colorSchema = z.object({
  r: z.number().min(0).max(255).default(255),
  g: z.number().min(0).max(255).default(255),
  b: z.number().min(0).max(255).default(255),
  alpha: z.number().min(0).max(1).default(1),
});

const specSchema = z.object({
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  dpi: z.number().min(300).default(300),
  bleedMm: z.number().nonnegative().default(3),
  safeZoneMm: z.number().nonnegative().default(3),
  iccProfile: z
    .object({
      bucket: z.string(),
      path: z.string(),
      name: z.string().optional(),
    })
    .optional(),
  background: colorSchema.optional(),
  outputFormat: z.enum(['tiff', 'pdf', 'both']).default('tiff'),
});

const safeAreaSchema = z.object({
  xMm: z.number().nonnegative(),
  yMm: z.number().nonnegative(),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
});

const payloadSchema = z.object({
  designId: z.string().min(1),
  orderId: z.string().min(1),
  lineItemId: z.string().min(1),
  source: z.object({
    bucket: z.string().min(1),
    path: z.string().min(1),
  }),
  output: z
    .object({
      bucket: z.string().min(1).optional(),
    })
    .optional(),
  printSpec: specSchema,
  safeArea: safeAreaSchema,
  metadata: z
    .object({
      designChecksum: z.string().optional(),
    })
    .optional(),
});

export type RenderPayload = z.infer<typeof payloadSchema>;

export interface RenderReport {
  designId: string;
  orderId: string;
  lineItemId: string;
  spec: RenderPayload['printSpec'];
  checks: {
    resolution: {
      requiredDpi: number;
      actualDpi: number;
      passed: boolean;
    };
    bleed: {
      requiredMm: number;
      actualMm: number;
      passed: boolean;
    };
    safeZone: {
      requiredMm: number;
      marginsMm: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
      passed: boolean;
    };
    icc: {
      applied: boolean;
      profileName?: string;
    };
  };
  assets: {
    printReadyPath: string;
    printReadyFormat: 'tiff' | 'pdf' | 'both';
    pdfPath?: string;
    reportPath: string;
  };
  generatedAt: string;
  warnings: string[];
}

export interface WorkerDeps {
  getStorage: () => admin.storage.Storage;
  getFirestore: () => admin.firestore.Firestore;
}

const defaultDeps: WorkerDeps = {
  getStorage: () => admin.storage(),
  getFirestore: () => admin.firestore(),
};

const mmToPixels = (mm: number, dpi: number): number => Math.round((mm / MM_PER_INCH) * dpi);

const clamp = (value: number, precision = 3) => Number(value.toFixed(precision));

function calculateSafeMarginsMm(spec: RenderPayload['printSpec'], safeArea: RenderPayload['safeArea']) {
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

async function downloadFile(bucket: StorageBucket, path: string): Promise<Buffer> {
  const [buffer] = await bucket.file(path).download();
  return buffer;
}

const createPdfFromImage = async (image: Buffer, widthPx: number, heightPx: number, dpi: number): Promise<Buffer> => {
  const widthPoints = (widthPx / dpi) * 72;
  const heightPoints = (heightPx / dpi) * 72;
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: [widthPoints, heightPoints], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.image(image, 0, 0, { width: widthPoints, height: heightPoints });
    doc.end();
  });
};

async function maybeWriteTempIcc(buffer: Buffer, suggestedName?: string): Promise<string> {
  const extension = suggestedName?.split('.').pop() ?? 'icc';
  const filePath = join(tmpdir(), `render-icc-${crypto.randomUUID()}.${extension}`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function removeTemp(path: string | null | undefined) {
  if (!path) return;
  try {
    await fs.unlink(path);
  } catch (error) {
    logger.warn('render.worker.temp_cleanup_failed', { path, error: (error as Error).message });
  }
}

export interface ProcessResult {
  report: RenderReport;
  checksum: string;
  outputUrl: string;
}

export const processRenderJob = async (rawPayload: RenderPayload, deps: WorkerDeps = defaultDeps): Promise<ProcessResult> => {
  const payload = payloadSchema.parse(rawPayload);
  const storage = deps.getStorage();
  const firestore = deps.getFirestore();

  const sourceBucket = storage.bucket(payload.source.bucket);
  const targetBucket = payload.output?.bucket ? storage.bucket(payload.output.bucket) : storage.bucket();

  const sourceBuffer = await downloadFile(sourceBucket, payload.source.path);
  const metadata = await sharp(sourceBuffer).metadata();

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
  const safeZonePassed =
    safeMargins.left + tolerance >= safeZoneMm &&
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

  let iccTempPath: string | null = null;
  let iccApplied = false;
  let iccProfileName: string | undefined;

  let pipeline = sharp(sourceBuffer, { failOn: 'none', limitInputPixels: false }).rotate();

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
  } else {
    pipeline = pipeline.withMetadata({ density: dpi });
  }

  pipeline = pipeline.resize(requiredWidthPx, requiredHeightPx, {
    fit: 'cover',
    position: 'centre',
    kernel: sharp.kernel.lanczos3,
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

  let pdfBuffer: Buffer | undefined;
  if (format === 'pdf' || format === 'both') {
    const pdfImage = await pipeline.clone().png().toBuffer();
    pdfBuffer = await createPdfFromImage(pdfImage, requiredWidthPx, requiredHeightPx, dpi);
  }

  await removeTemp(iccTempPath);

  const checksum = crypto.createHash('sha256').update(tiffBuffer).digest('hex');
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

  const report: RenderReport = {
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
  await docRef.set(
    {
      printAsset: {
        url: `gs://${targetBucket.name}/${tiffPath}`,
        format,
        dpi,
        icc: iccProfileName ?? (iccApplied ? 'embedded' : 'default'),
        checksum,
        reportId: `gs://${targetBucket.name}/${reportPath}`,
        updatedAt: FieldValue.serverTimestamp(),
        metadata: {
          bleedMm,
          safeZoneMm,
          reportGeneratedAt: timestamp,
        },
      },
    },
    { merge: true },
  );

  const orderItemRef = firestore.collection('orders').doc(payload.orderId).collection('items').doc(payload.lineItemId);
  await orderItemRef.set(
    {
      renderStatus: 'completed',
      updatedAt: FieldValue.serverTimestamp(),
      printAsset: {
        url: `gs://${targetBucket.name}/${tiffPath}`,
        format,
        dpi,
        checksum,
        reportId: `gs://${targetBucket.name}/${reportPath}`,
        updatedAt: FieldValue.serverTimestamp(),
      },
      renderReportPath: `gs://${targetBucket.name}/${reportPath}`,
      outputFiles: {
        tiff: `gs://${targetBucket.name}/${tiffPath}`,
        pdf: pdfPath ? `gs://${targetBucket.name}/${pdfPath}` : null,
      },
    },
    { merge: true },
  );

  logger.info('render.worker.completed', {
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

export const renderQueueWorker = onTaskDispatched(defaultQueueOptions, async (event) => {
  const payload = payloadSchema.parse(event.data ?? {});
  logger.info('render.worker.dispatch', {
    designId: payload.designId,
    orderId: payload.orderId,
    lineItemId: payload.lineItemId,
  });

  await processRenderJob(payload, defaultDeps);
});
