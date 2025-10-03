import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

const ALLOWED_HOSTNAMES = new Set([
  'storage.googleapis.com',
  'firebasestorage.googleapis.com',
  'firebasestorage.app',
  'images.unsplash.com',
  'picsum.photos',
  'placehold.co',
  'lh3.googleusercontent.com',
]);

const PLACEHOLDER_CACHE = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

const buildCacheKey = (src: string) => `lqip:${src}`;

const getCachedPlaceholder = (key: string) => {
  const cached = PLACEHOLDER_CACHE.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt < Date.now()) {
    PLACEHOLDER_CACHE.delete(key);
    return null;
  }
  return cached.value;
};

const setCachedPlaceholder = (key: string, value: string) => {
  PLACEHOLDER_CACHE.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const isSrcAllowed = (src: string) => {
  try {
    const url = new URL(src);
    return ALLOWED_HOSTNAMES.has(url.hostname);
  } catch (error) {
    console.warn('Invalid image src for LQIP', error);
    return false;
  }
};

const createPlaceholder = async (src: string) => {
  const response = await fetch(src, {
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image for LQIP: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const resized = await sharp(buffer)
    .resize(24, 24, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFormat('webp', { quality: 50 })
    .toBuffer();

  const base64 = resized.toString('base64');
  return `data:image/webp;base64,${base64}`;
};

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src');
  if (!src) {
    return NextResponse.json(
      { error: 'src query parameter is required' },
      { status: 400 },
    );
  }

  if (!isSrcAllowed(src)) {
    return NextResponse.json(
      { error: 'Image host is not allowed for LQIP generation' },
      { status: 400 },
    );
  }

  const cacheKey = buildCacheKey(src);
  const cached = getCachedPlaceholder(cacheKey);
  if (cached) {
    return NextResponse.json(
      { placeholder: cached, cached: true },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      },
    );
  }

  try {
    const placeholder = await createPlaceholder(src);
    setCachedPlaceholder(cacheKey, placeholder);
    return NextResponse.json(
      { placeholder, cached: false },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      },
    );
  } catch (error) {
    console.error('Failed to generate LQIP placeholder', error);
    return NextResponse.json(
      { error: 'Failed to generate placeholder' },
      { status: 500 },
    );
  }
}
