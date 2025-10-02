import { FieldValue } from 'firebase-admin/firestore';
import sharp from 'sharp';

import { processRenderJob, RenderPayload, type WorkerDeps } from '../worker';

const DPI = 300;
const defaultBucketName = 'default-bucket';

type SavedEntry = {
  data: Buffer;
  options?: unknown;
};

type StorageMap = Map<string, SavedEntry>;

const mmToPixels = (mm: number, dpi = DPI) => Math.ceil((mm / 25.4) * dpi);

type PayloadOverrides = Partial<Omit<RenderPayload, 'printSpec' | 'safeArea'>> & {
  printSpec?: Partial<RenderPayload['printSpec']>;
  safeArea?: Partial<RenderPayload['safeArea']>;
};

class FakeStorage {
  private readonly files = new Map<string, Buffer>();
  private readonly saved: StorageMap = new Map();

  constructor(private readonly defaultBucket = defaultBucketName) {}

  setFile(bucket: string, path: string, data: Buffer) {
    this.files.set(this.key(bucket, path), data);
  }

  getSavedEntries() {
    return this.saved;
  }

  bucket(name?: string) {
    const bucketName = name ?? this.defaultBucket;
    return {
      name: bucketName,
      file: (path: string) => ({
        download: async (): Promise<[Buffer]> => {
          const data = this.files.get(this.key(bucketName, path));
          if (!data) {
            throw new Error(`File not found: ${bucketName}/${path}`);
          }
          return [Buffer.from(data)];
        },
        save: async (data: Buffer, options?: unknown) => {
          this.saved.set(this.key(bucketName, path), {
            data: Buffer.from(data),
            options,
          });
        },
      }),
    };
  }

  private key(bucket: string, path: string) {
    return `${bucket}:${path}`;
  }
}

class FakeDocument {
  constructor(private readonly firestore: FakeFirestore, private readonly path: string) {}

  async set(data: unknown, options?: unknown) {
    this.firestore.writes.set(this.path, { data, options });
  }

  collection(name: string) {
    return new FakeCollection(this.firestore, `${this.path}/${name}`);
  }
}

class FakeCollection {
  constructor(private readonly firestore: FakeFirestore, private readonly path: string) {}

  doc(id: string) {
    return new FakeDocument(this.firestore, `${this.path}/${id}`);
  }
}

class FakeFirestore {
  readonly writes = new Map<string, { data: unknown; options?: unknown }>();

  collection(name: string) {
    return new FakeCollection(this, name);
  }
}

const createDeps = (storage: FakeStorage, firestore: FakeFirestore): WorkerDeps => ({
  getStorage: () => storage as unknown as ReturnType<WorkerDeps['getStorage']>,
  getFirestore: () => firestore as unknown as ReturnType<WorkerDeps['getFirestore']>,
});

describe('processRenderJob', () => {
  beforeEach(() => {
    const sentinel = FieldValue.serverTimestamp();
    jest.spyOn(FieldValue, 'serverTimestamp').mockReturnValue(sentinel);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createImageBuffer = async (widthPx: number, heightPx: number) => {
    return sharp({
      create: {
        width: widthPx,
        height: heightPx,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  };

  const buildPayload = (overrides: PayloadOverrides = {}): RenderPayload => {
    const baseSpec = {
      widthMm: 210,
      heightMm: 297,
      dpi: DPI,
      bleedMm: 3,
      safeZoneMm: 3,
      outputFormat: 'tiff' as const,
    };

    const printSpec = {
      ...baseSpec,
      ...(overrides.printSpec ?? {}),
    };

    const safeArea = {
      xMm: overrides.safeArea?.xMm ?? 5,
      yMm: overrides.safeArea?.yMm ?? 5,
      widthMm: overrides.safeArea?.widthMm ?? printSpec.widthMm - 10,
      heightMm: overrides.safeArea?.heightMm ?? printSpec.heightMm - 10,
    };

    return {
      designId: overrides.designId ?? 'design-123',
      orderId: overrides.orderId ?? 'order-456',
      lineItemId: overrides.lineItemId ?? 'line-789',
      source: overrides.source ?? {
        bucket: 'design-source',
        path: 'inputs/source.png',
      },
      output: overrides.output,
      metadata: overrides.metadata,
      printSpec: printSpec as RenderPayload['printSpec'],
      safeArea: safeArea as RenderPayload['safeArea'],
    };
  };

  it('creates print-ready TIFF and report assets', async () => {
    const payload = buildPayload();
    const requiredWidthPx = mmToPixels(payload.printSpec.widthMm + payload.printSpec.bleedMm * 2, payload.printSpec.dpi);
    const requiredHeightPx = mmToPixels(
      payload.printSpec.heightMm + payload.printSpec.bleedMm * 2,
      payload.printSpec.dpi,
    );

    const sourceBuffer = await createImageBuffer(requiredWidthPx, requiredHeightPx);

    const storage = new FakeStorage();
    storage.setFile(payload.source.bucket, payload.source.path, sourceBuffer);
    const firestore = new FakeFirestore();

    const result = await processRenderJob(payload, createDeps(storage, firestore));

    expect(result.outputUrl).toBe(`gs://${defaultBucketName}/prints/${payload.orderId}/${payload.lineItemId}/print-ready.tif`);

    const saved = storage.getSavedEntries();
    expect(saved.has(`${defaultBucketName}:prints/${payload.orderId}/${payload.lineItemId}/print-ready.tif`)).toBe(true);
    expect(saved.has(`${defaultBucketName}:prints/${payload.orderId}/${payload.lineItemId}/render-report.json`)).toBe(true);

    const reportEntry = saved.get(`${defaultBucketName}:prints/${payload.orderId}/${payload.lineItemId}/render-report.json`);
    expect(reportEntry).toBeDefined();
    const report = JSON.parse(reportEntry!.data.toString());
    expect(report.checks.resolution.passed).toBe(true);
    expect(report.checks.safeZone.passed).toBe(true);

    const doc = firestore.writes.get(`designs/${payload.designId}`);
    expect(doc).toBeDefined();
    const docData = doc!.data as { printAsset: { url: string; dpi: number; reportId: string } };
    const printAsset = docData.printAsset;
    expect(printAsset.url).toContain('gs://');
    expect(printAsset.dpi).toBe(payload.printSpec.dpi);
    expect(printAsset.reportId).toContain('render-report.json');

    const orderItemDoc = firestore.writes.get(`orders/${payload.orderId}/items/${payload.lineItemId}`);
    expect(orderItemDoc).toBeDefined();
    const orderData = orderItemDoc!.data as {
      printAsset: { url: string; reportId: string };
      renderStatus: string;
    };
    expect(orderData.renderStatus).toBe('completed');
    expect(orderData.printAsset.url).toContain(`prints/${payload.orderId}/${payload.lineItemId}/print-ready.tif`);
    expect(orderData.printAsset.reportId).toContain('render-report.json');
  });

  it('throws when safe zone requirements are not met', async () => {
    const payload = buildPayload({
      safeArea: {
        xMm: 0,
        yMm: 0,
        widthMm: 210,
        heightMm: 280,
      },
    });

    const requiredWidthPx = mmToPixels(payload.printSpec.widthMm + payload.printSpec.bleedMm * 2, payload.printSpec.dpi);
    const requiredHeightPx = mmToPixels(
      payload.printSpec.heightMm + payload.printSpec.bleedMm * 2,
      payload.printSpec.dpi,
    );
    const sourceBuffer = await createImageBuffer(requiredWidthPx, requiredHeightPx);

    const storage = new FakeStorage();
    storage.setFile(payload.source.bucket, payload.source.path, sourceBuffer);
    const firestore = new FakeFirestore();

    await expect(
      processRenderJob(payload, createDeps(storage, firestore)),
    ).rejects.toThrow('Safe zone requirements not satisfied');
  });

  it('writes both TIFF and PDF when requested', async () => {
    const payload = buildPayload({
      printSpec: {
        outputFormat: 'both',
      },
    });

    const requiredWidthPx = mmToPixels(payload.printSpec.widthMm + payload.printSpec.bleedMm * 2, payload.printSpec.dpi);
    const requiredHeightPx = mmToPixels(
      payload.printSpec.heightMm + payload.printSpec.bleedMm * 2,
      payload.printSpec.dpi,
    );
    const sourceBuffer = await createImageBuffer(requiredWidthPx, requiredHeightPx);

    const storage = new FakeStorage();
    storage.setFile(payload.source.bucket, payload.source.path, sourceBuffer);
    const firestore = new FakeFirestore();

    await processRenderJob(payload, createDeps(storage, firestore));

    const saved = storage.getSavedEntries();
    const basePath = `prints/${payload.orderId}/${payload.lineItemId}`;
    expect(saved.has(`${defaultBucketName}:${basePath}/print-ready.tif`)).toBe(true);
    expect(saved.has(`${defaultBucketName}:${basePath}/print-ready.pdf`)).toBe(true);
  });
});
