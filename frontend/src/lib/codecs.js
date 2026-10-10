// Browser-side codecs. These run instantly without the backend and must
// produce byte-for-byte the same output as backend/crypto_ops.py.

export class CodecError extends Error {}

const enc = new TextEncoder();
const utf8 = bytes => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new CodecError('Decoded bytes are not valid UTF-8 text');
  }
};
const stripWs = s => s.replace(/\s+/g, '');
const tokens = s => s.trim().split(/\s+/).filter(Boolean);

function parseBytes(text, base, label, pattern) {
  const values = tokens(text).map(t => (pattern.test(t) ? parseInt(t, base) : NaN));
  if (values.some(v => Number.isNaN(v) || v > 255)) {
    throw new CodecError(`Input is not valid ${label} (expected space-separated byte values 0–255)`);
  }
  return Uint8Array.from(values);
}

// ─── Base64 ──────────────────────────────────────────────────────
export function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function base64ToBytes(text) {
  const clean = stripWs(text);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) throw new CodecError('Input is not valid Base64');
  try {
    return Uint8Array.from(atob(clean), c => c.charCodeAt(0));
  } catch {
    throw new CodecError('Input is not valid Base64');
  }
}

export const bytesToHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export const bytesToBinary = bytes => Array.from(bytes, b => b.toString(2).padStart(8, '0')).join(' ');

// ─── Classical ───────────────────────────────────────────────────
const shiftLetters = (text, shiftAt) => {
  let i = 0;
  return text.replace(/[A-Za-z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    const s = shiftAt(i++);
    return String.fromCharCode(((((c.charCodeAt(0) - base + s) % 26) + 26) % 26) + base);
  });
};

export function parseShift(key) {
  return /^\s*[-+]?\d+\s*$/.test(key ?? '') ? ((parseInt(key, 10) % 26) + 26) % 26 : 3;
}

function vigenereShifts(key) {
  const shifts = Array.from((key ?? '').toUpperCase()).filter(c => c >= 'A' && c <= 'Z').map(c => c.charCodeAt(0) - 65);
  if (!shifts.length) throw new CodecError('Vigenère key must contain at least one letter');
  return shifts;
}

const atbash = t => t.replace(/[A-Za-z]/g, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode(b + 25 - (c.charCodeAt(0) - b)); });
const rot13 = t => shiftLetters(t, () => 13);

const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---',
  3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-',
  ',': '--..--', '?': '..--..', '!': '-.-.--', "'": '.----.', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '"': '.-..-.', '@': '.--.-.',
};
const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

const morseEncode = t => tokens(t.toUpperCase()).map(w => Array.from(w, c => MORSE[c] ?? '?').join(' ')).join(' / ');
const morseDecode = t => t.trim().split('/').filter(w => w.trim()).map(w => tokens(w).map(c => MORSE_REV[c] ?? '?').join('')).join(' ');

// ─── Text encodings ──────────────────────────────────────────────
const urlEncode = t => encodeURIComponent(t).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const urlDecode = t => {
  try { return decodeURIComponent(t); } catch { throw new CodecError('Input is not valid URL encoding'); }
};

const htmlEncode = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const htmlDecode = t => { const el = document.createElement('textarea'); el.innerHTML = t; return el.value; };

function hexDecode(text) {
  const clean = stripWs(text);
  if (clean.length % 2 || /[^0-9a-fA-F]/.test(clean)) throw new CodecError('Input is not valid hexadecimal');
  return utf8(Uint8Array.from(clean.match(/../g) ?? [], h => parseInt(h, 16)));
}

const codePoints = t => Array.from(t, c => c.codePointAt(0));
function fromCodePoints(values, label) {
  try {
    if (values.some(v => Number.isNaN(v))) throw new RangeError();
    return String.fromCodePoint(...values);
  } catch {
    throw new CodecError(`Input is not valid ${label}`);
  }
}

// ─── Registry ────────────────────────────────────────────────────
// id -> [encode(text, key), decode(text, key)]. Algorithms not listed here
// (AES, Fernet, 3DES, RSA, Base32, Base85, SHA-3, BLAKE2, MD5) use the backend.
const CODECS = {
  base64: [t => bytesToBase64(enc.encode(t)), t => utf8(base64ToBytes(t))],
  hex: [t => bytesToHex(enc.encode(t)), hexDecode],
  binary: [t => bytesToBinary(enc.encode(t)), t => utf8(parseBytes(t, 2, 'binary', /^[01]{1,8}$/))],
  octal: [t => Array.from(enc.encode(t), b => b.toString(8)).join(' '), t => utf8(parseBytes(t, 8, 'octal', /^[0-7]{1,3}$/))],
  decimal: [t => codePoints(t).join(' '), t => fromCodePoints(tokens(t).map(x => (/^\d+$/.test(x) ? Number(x) : NaN)), 'decimal character codes')],
  unicode: [
    t => codePoints(t).map(c => `U+${c.toString(16).toUpperCase().padStart(4, '0')}`).join(' '),
    t => fromCodePoints(tokens(t).map(x => { const m = /^(?:U\+)?([0-9a-f]+)$/i.exec(x); return m ? parseInt(m[1], 16) : NaN; }), 'Unicode notation (expected tokens like U+0041)'),
  ],
  url: [urlEncode, urlDecode],
  html: [htmlEncode, htmlDecode],
  caesar: [(t, k) => shiftLetters(t, () => parseShift(k)), (t, k) => shiftLetters(t, () => -parseShift(k))],
  vigenere: [
    (t, k) => { const s = vigenereShifts(k); return shiftLetters(t, i => s[i % s.length]); },
    (t, k) => { const s = vigenereShifts(k); return shiftLetters(t, i => -s[i % s.length]); },
  ],
  atbash: [atbash, atbash],
  rot13: [rot13, rot13],
  morse: [morseEncode, morseDecode],
};

const WEB_HASHES = { sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512' };

export const runsInBrowser = id => id in CODECS || id in WEB_HASHES;

/** Run an algorithm locally. Returns null when it needs the backend. */
export async function runLocal(id, operation, text, key) {
  if (id in WEB_HASHES) {
    if (operation === 'decode') throw new CodecError('Hash functions are one-way and cannot be reversed');
    return bytesToHex(new Uint8Array(await crypto.subtle.digest(WEB_HASHES[id], enc.encode(text))));
  }
  const codec = CODECS[id];
  if (!codec) return null;
  return codec[operation === 'encode' ? 0 : 1](text, key);
}

/** Encode raw file bytes locally. Returns null when it needs the backend. */
export async function encodeBytesLocal(id, bytes) {
  if (id === 'base64') return bytesToBase64(bytes);
  if (id === 'hex') return bytesToHex(bytes);
  if (id === 'binary') return bytesToBinary(bytes);
  if (id in WEB_HASHES) return bytesToHex(new Uint8Array(await crypto.subtle.digest(WEB_HASHES[id], bytes)));
  return null;
}
