import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('fetchStandardPreview', () => {
  const originalEndpoint = process.env.NEXT_PUBLIC_OMG_PREVIEW_ENDPOINT;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    if (typeof originalEndpoint === 'undefined') {
      delete process.env.NEXT_PUBLIC_OMG_PREVIEW_ENDPOINT;
    } else {
      process.env.NEXT_PUBLIC_OMG_PREVIEW_ENDPOINT = originalEndpoint;
    }
    jest.restoreAllMocks();
  });

  it('returns null without calling fetch when endpoint is not configured', async () => {
    delete process.env.NEXT_PUBLIC_OMG_PREVIEW_ENDPOINT;
    const fetchSpy = jest.spyOn(global, 'fetch');

    const { fetchStandardPreview } = await import('../preview-service');
    const result = await fetchStandardPreview({ creationId: 'c1', assetUri: 'https://cdn.example/base.jpg' });

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns parsed response when Functions endpoint provides valid payload', async () => {
    process.env.NEXT_PUBLIC_OMG_PREVIEW_ENDPOINT = 'https://functions.example/preview';
    const payload = {
      imageUrl: 'https://cdn.example/preview.jpg',
      width: 320,
      height: 320,
      provider: 'functions',
    };

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    } as unknown as Response);

    const { fetchStandardPreview } = await import('../preview-service');
    const result = await fetchStandardPreview({ creationId: 'c2', assetUri: 'https://cdn.example/base.jpg' });

    expect(result).toEqual(payload);
  });

  it('returns null and logs parse failure when payload is invalid', async () => {
    process.env.NEXT_PUBLIC_OMG_PREVIEW_ENDPOINT = 'https://functions.example/preview';

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ imageUrl: 123 }),
    } as unknown as Response);

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { fetchStandardPreview } = await import('../preview-service');
    const result = await fetchStandardPreview({ creationId: 'c3', assetUri: 'https://cdn.example/base.jpg' });

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('returns null when Functions call fails', async () => {
    process.env.NEXT_PUBLIC_OMG_PREVIEW_ENDPOINT = 'https://functions.example/preview';

    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { fetchStandardPreview } = await import('../preview-service');
    const result = await fetchStandardPreview({ creationId: 'c4', assetUri: 'https://cdn.example/base.jpg' });

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
