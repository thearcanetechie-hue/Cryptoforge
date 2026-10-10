import FALLBACK_ALGORITHMS from './algorithms.json';

export { FALLBACK_ALGORITHMS };

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new ApiError('Cannot reach the CryptoForge API. Start the backend (see README) or check VITE_API_URL.');
  }
  const data = await res.json().catch(() => null);
  if (res.ok && data === null) throw new ApiError('The API returned an unexpected response. Check VITE_API_URL.');
  if (!res.ok) {
    const detail = Array.isArray(data?.detail) ? data.detail.map(d => d.msg).join('; ') : data?.detail;
    throw new ApiError(detail || `Request failed (${res.status})`);
  }
  return data;
}

const postJson = (path, body) =>
  request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** Resolves to { algorithms, online }. Never rejects: falls back to the bundled list. */
export async function getAlgorithms() {
  try {
    const algorithms = await request('/algorithms', { signal: AbortSignal.timeout(4000) });
    const valid = Object.values(algorithms ?? {}).some(list => Array.isArray(list) && list.length);
    if (!valid) throw new ApiError('Unexpected /algorithms response');
    return { algorithms, online: true };
  } catch {
    return { algorithms: FALLBACK_ALGORITHMS, online: false };
  }
}

export const runRemote = (operation, payload) => postJson(`/${operation}`, payload);
export const generateKey = algorithm => request(`/generate-key/${encodeURIComponent(algorithm)}`, { method: 'POST' });

export function encodeFileRemote(file, algorithm) {
  const form = new FormData();
  form.append('file', file);
  return request(`/encode-file?algorithm=${encodeURIComponent(algorithm)}`, { method: 'POST', body: form });
}
