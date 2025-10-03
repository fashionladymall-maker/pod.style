import { getFunctions } from 'firebase-admin/functions';
import type { TaskQueue } from 'firebase-admin/functions';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

import { getDb } from '@/server/firebase/admin';
import { logger } from '@/utils/logger';

const storageStringPattern = /^gs:\/\/([^/]+)\/(.+)$/;
const storageHttpsPattern = /^https:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/;

export interface StorageReference {
  bucket: string;
  path: string;
}

const colorSchema = z
  .object({
    r: z.number().min(0).max(255),
    g: z.number().min(0).max(255),
    b: z.number().min(0).max(255),
    alpha: z.number().min(0).max(1).optional(),
  })
  .partial();

const specCoreSchema = z.object({
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  dpi: z.number().positive().optional(),
  bleedMm: z.number().nonnegative().optional(),
  safeZoneMm: z.number().nonnegative().optional(),
  outputFormat: z.enum(['tiff', 'pdf', 'both']).optional(),
  background: colorSchema.optional(),
});

type SpecCore = z.infer<typeof specCoreSchema>;

const iccSchema = z
  .object({
    bucket: z.string().min(1),
    path: z.string().min(1),
    name: z.string().optional(),
  })
  .partial()
  .superRefine((val, ctx) => {
    if (!val.bucket || !val.path) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'iccProfile requires bucket and path' });
    }
  });

type ICCProfile = z.infer<typeof iccSchema>;

const printSpecPartialSchema = specCoreSchema.extend({
  iccProfile: iccSchema.optional(),
});

export interface PrintSpec {
  widthMm: number;
  heightMm: number;
  dpi: number;
  bleedMm: number;
  safeZoneMm: number;
  outputFormat: 'tiff' | 'pdf' | 'both';
  background?: z.infer<typeof colorSchema>;
  iccProfile?: ICCProfile;
}

const safeAreaPartialSchema = z
  .object({
    xMm: z.number().nonnegative().optional(),
    yMm: z.number().nonnegative().optional(),
    widthMm: z.number().positive().optional(),
    heightMm: z.number().positive().optional(),
  })
  .passthrough();

export interface SafeArea {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

const defaultPrintSpec: PrintSpec = {
  widthMm: 210,
  heightMm: 297,
  dpi: 300,
  bleedMm: 3,
  safeZoneMm: 3,
  outputFormat: 'tiff',
};

const defaultSafeArea = (spec: PrintSpec): SafeArea => {
  const margin = spec.safeZoneMm ?? 3;
  const width = Math.max(1, spec.widthMm - margin * 2);
  const height = Math.max(1, spec.heightMm - margin * 2);
  return {
    xMm: margin,
    yMm: margin,
    widthMm: width,
    heightMm: height,
  };
};

const parseStorageString = (value: string): StorageReference | null => {
  const matchGs = storageStringPattern.exec(value);
  if (matchGs) {
    return { bucket: matchGs[1], path: matchGs[2] };
  }
  const matchHttps = storageHttpsPattern.exec(value);
  if (matchHttps) {
    return { bucket: matchHttps[1], path: matchHttps[2] };
  }
  return null;
};

const toStorageReference = (value: unknown): StorageReference | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return parseStorageString(value);
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.bucket === 'string' && typeof record.path === 'string') {
      return { bucket: record.bucket, path: record.path };
    }
    if (typeof record.bucket === 'string' && typeof record.object === 'string') {
      return { bucket: record.bucket, path: record.object };
    }
    if (typeof record.gcsPath === 'string') {
      return parseStorageString(record.gcsPath);
    }
    if (typeof record.uri === 'string') {
      return parseStorageString(record.uri);
    }
    if (typeof record.storagePath === 'string') {
      return parseStorageString(record.storagePath);
    }
  }
  return null;
};

const normalizeSpec = (candidate: unknown): PrintSpec | null => {
  if (!candidate) {
    return null;
  }

  const parsed = printSpecPartialSchema.safeParse(candidate);
  if (!parsed.success) {
    return null;
  }
  const data = parsed.data as SpecCore & { iccProfile?: ICCProfile };

  if (typeof data.widthMm !== 'number' || typeof data.heightMm !== 'number') {
    return null;
  }

  const icc = data.iccProfile ? toStorageReference(data.iccProfile) : null;

  return {
    widthMm: data.widthMm,
    heightMm: data.heightMm,
    dpi: data.dpi ?? defaultPrintSpec.dpi,
    bleedMm: data.bleedMm ?? defaultPrintSpec.bleedMm,
    safeZoneMm: data.safeZoneMm ?? defaultPrintSpec.safeZoneMm,
    outputFormat: data.outputFormat ?? defaultPrintSpec.outputFormat,
    background: data.background,
    iccProfile: icc ?? undefined,
  };
};

const normalizeSafeArea = (candidate: unknown, spec: PrintSpec): SafeArea | null => {
  if (!candidate) {
    return null;
  }

  const parsed = safeAreaPartialSchema.safeParse(candidate);
  if (!parsed.success) {
    return null;
  }

  const margin = spec.safeZoneMm ?? defaultPrintSpec.safeZoneMm;
  const defaultArea = defaultSafeArea(spec);

  const xMm = parsed.data.xMm ?? margin;
  const yMm = parsed.data.yMm ?? margin;
  const widthMm = parsed.data.widthMm ?? Math.max(1, spec.widthMm - xMm - margin);
  const heightMm = parsed.data.heightMm ?? Math.max(1, spec.heightMm - yMm - margin);

  if (widthMm <= 0 || heightMm <= 0) {
    return defaultArea;
  }

  return {
    xMm,
    yMm,
    widthMm,
    heightMm,
  };
};

const designDocSchema = z
  .object({
    ownerUid: z.string().optional(),
    source: z.unknown().optional(),
    assets: z
      .object({
        source: z.unknown().optional(),
        master: z.unknown().optional(),
      })
      .optional(),
    render: z
      .object({
        source: z.unknown().optional(),
        spec: z.unknown().optional(),
        safeArea: z.unknown().optional(),
        iccProfile: z.unknown().optional(),
        checksum: z.string().optional(),
        outputBucket: z.string().optional(),
      })
      .optional(),
    printSpec: z.unknown().optional(),
    safeArea: z.unknown().optional(),
    skuConfigs: z.record(
      z.object({
        spec: z.unknown().optional(),
        safeArea: z.unknown().optional(),
      }),
    ).optional(),
    defaultSku: z.string().optional(),
    checksums: z
      .object({
        source: z.string().optional(),
        master: z.string().optional(),
      })
      .optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough();

type DesignDoc = z.infer<typeof designDocSchema>;

type RawSkuDoc = Record<string, unknown> | undefined;

export interface RenderQueuePayload {
  designId: string;
  orderId: string;
  lineItemId: string;
  source: StorageReference;
  output?: { bucket?: string };
  printSpec: PrintSpec;
  safeArea: SafeArea;
  metadata?: {
    designChecksum?: string;
    queuedAt?: string;
  };
}

interface PrepareRenderTaskParams {
  designId: string;
  sku: string;
  orderId: string;
  lineItemId: string;
}

export interface RenderPreparationResult {
  payload: RenderQueuePayload;
  printSpec: PrintSpec;
  safeArea: SafeArea;
  source: StorageReference;
  designOwner?: string;
  designChecksum?: string;
}

const resolveSpec = (design: DesignDoc, skuDoc: RawSkuDoc, sku: string): Pick<RenderPreparationResult, 'printSpec' | 'safeArea'> => {
  const spec =
    normalizeSpec(design.render?.spec) ??
    normalizeSpec(design.printSpec) ??
    normalizeSpec(design.skuConfigs?.[sku]?.spec) ??
    normalizeSpec(design.skuConfigs?.[design.defaultSku ?? '']?.spec) ??
    normalizeSpec((skuDoc?.attributes as Record<string, unknown> | undefined)?.printSpec) ??
    normalizeSpec((skuDoc?.production as Record<string, unknown> | undefined)?.spec) ??
    normalizeSpec((skuDoc?.render as Record<string, unknown> | undefined)?.spec) ??
    defaultPrintSpec;

  const safeArea =
    normalizeSafeArea(design.render?.safeArea, spec) ??
    normalizeSafeArea(design.safeArea, spec) ??
    normalizeSafeArea(design.skuConfigs?.[sku]?.safeArea, spec) ??
    normalizeSafeArea(design.skuConfigs?.[design.defaultSku ?? '']?.safeArea, spec) ??
    normalizeSafeArea((skuDoc?.attributes as Record<string, unknown> | undefined)?.printSafeArea, spec) ??
    normalizeSafeArea((skuDoc?.render as Record<string, unknown> | undefined)?.safeArea, spec) ??
    defaultSafeArea(spec);

  return {
    printSpec: spec,
    safeArea,
  };
};

const resolveSource = (design: DesignDoc): StorageReference | null => {
  return (
    toStorageReference(design.render?.source) ??
    toStorageReference(design.source) ??
    toStorageReference(design.assets?.source) ??
    toStorageReference(design.assets?.master) ??
    null
  );
};

let cachedQueue: TaskQueue<RenderQueuePayload> | null = null;

const getRenderQueue = (): TaskQueue<RenderQueuePayload> => {
  if (!cachedQueue) {
    cachedQueue = getFunctions().taskQueue<RenderQueuePayload>('renderPrintReadyWorker');
  }
  return cachedQueue;
};

export const prepareRenderTask = async (
  params: PrepareRenderTaskParams,
): Promise<RenderPreparationResult> => {
  const { designId, sku, orderId, lineItemId } = params;
  const db = getDb();

  const [designSnapshot, skuSnapshot] = await Promise.all([
    db.collection('designs').doc(designId).get(),
    db.collection('skus').doc(sku).get(),
  ]);

  if (!designSnapshot.exists) {
    throw new Error(`Design ${designId} not found`);
  }

  const design = designDocSchema.parse(designSnapshot.data());
  const skuDoc = skuSnapshot.exists ? (skuSnapshot.data() as RawSkuDoc) : undefined;

  const source = resolveSource(design);
  if (!source) {
    throw new Error(`Design ${designId} missing source asset reference`);
  }

  const { printSpec, safeArea } = resolveSpec(design, skuDoc, sku);
  const checksum = design.render?.checksum ?? design.checksums?.source ?? undefined;

  const payload: RenderQueuePayload = {
    designId,
    orderId,
    lineItemId,
    source,
    printSpec,
    safeArea,
    metadata: {
      designChecksum: checksum,
      queuedAt: Timestamp.now().toDate().toISOString(),
    },
  };

  if (design.render?.outputBucket) {
    payload.output = { bucket: design.render.outputBucket };
  }

  return {
    payload,
    printSpec,
    safeArea,
    source,
    designOwner: design.ownerUid,
    designChecksum: checksum,
  };
};

export const enqueueRenderTask = async (payload: RenderQueuePayload) => {
  const queue = getRenderQueue();
  await queue.enqueue(payload);
  logger.info('orders.render.task_enqueued', {
    orderId: payload.orderId,
    lineItemId: payload.lineItemId,
    designId: payload.designId,
    bucket: payload.source.bucket,
    path: payload.source.path,
  });
};
