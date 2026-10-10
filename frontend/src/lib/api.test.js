import { afterEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_ALGORITHMS, getAlgorithms, runRemote } from './api';

const respond = (body, status = 200) => vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(body, { status }))));

afterEach(() => vi.unstubAllGlobals());

describe('getAlgorithms', () => {
  it('uses the API list when it is valid', async () => {
    respond(JSON.stringify({ encoding: [{ id: 'base64' }] }));
    expect(await getAlgorithms()).toEqual({ algorithms: { encoding: [{ id: 'base64' }] }, online: true });
  });

  // A misconfigured VITE_API_URL can hit the SPA's index.html, which answers 200.
  it.each([['HTML', '<!doctype html><html></html>'], ['empty JSON', '{}'], ['wrong shape', '{"a": 1}']])(
    'falls back to the bundled list on %s',
    async (_label, body) => {
      respond(body);
      expect(await getAlgorithms()).toEqual({ algorithms: FALLBACK_ALGORITHMS, online: false });
    },
  );
});

describe('runRemote', () => {
  it('surfaces the API error detail', async () => {
    respond(JSON.stringify({ detail: 'Decryption failed: wrong key or tampered ciphertext' }), 400);
    await expect(runRemote('decode', {})).rejects.toThrow('wrong key');
  });

  it('rejects a non-JSON success response', async () => {
    respond('<!doctype html>');
    await expect(runRemote('encode', {})).rejects.toThrow(/unexpected response/);
  });
});
