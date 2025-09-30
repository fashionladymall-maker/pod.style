import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Validate that the URL is from Firebase Storage
  if (!url.includes('storage.googleapis.com') && !url.includes('firebasestorage.app')) {
    return new NextResponse('Invalid image source', { status: 400 });
  }

  try {
    // Set a reasonable timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'POD.STYLE/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return new NextResponse('Invalid content type', { status: 400 });
    }

    const imageBuffer = await response.arrayBuffer();

    // Set appropriate cache headers
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Length': imageBuffer.byteLength.toString(),
    });

    // Copy some headers from the original response
    const etag = response.headers.get('etag');
    if (etag) {
      headers.set('ETag', etag);
    }

    const lastModified = response.headers.get('last-modified');
    if (lastModified) {
      headers.set('Last-Modified', lastModified);
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new NextResponse('Request timeout', { status: 504 });
    }
    
    return new NextResponse('Internal server error', { status: 500 });
  }
}
