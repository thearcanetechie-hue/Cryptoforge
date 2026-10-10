// CryptoForge Design Sync — Figma development plugin.
// "Build" recreates the CryptoForge UI (frontend/src) as an editable Figma design. It only creates what is
// missing, so it is safe to run again: delete a screen or component and re-run to regenerate it.
// "Export" writes the current design (structure, tokens, notes and screen PNGs) to cryptoforge-design.json.

// ─── Source data (mirrors frontend/src) ─────────────────────────────────────────────────────────────
const TOKENS = {
  'bg': ['#f4f3ef', '#111110'], 'surface': ['#ffffff', '#1c1b1a'], 'surface-2': ['#f0eeea', '#252422'], 'border': ['#e0ddd7', '#2e2c2a'],
  'text': ['#1a1917', '#f0ede8'], 'text-2': ['#5c574f', '#a09890'], 'text-3': ['#9c9389', '#5c5750'],
  'accent': ['#1a1917', '#f0ede8'], 'accent-fg': ['#f4f3ef', '#111110'],
  'blue': ['#2563eb', '#60a5fa'], 'green': ['#16a34a', '#4ade80'], 'purple': ['#7c3aed', '#c084fc'], 'orange': ['#ea580c', '#fb923c'], 'red': ['#dc2626', '#f87171'], 'yellow': ['#ca8a04', '#fbbf24'],
  'sidebar/bg': ['#1a1917', '#0d0d0c'], 'sidebar/text': ['#c8c3ba', '#7a746c'], 'sidebar/active': ['#f4f3ef', '#f0ede8'], 'sidebar/label': ['#6f6a63', '#6f6a63'], 'sidebar/logo-text': ['#f0ede8', '#f0ede8'], 'sidebar/toggle-track': ['#2e2c2a', '#4f9cf9'],
  'category/symmetric': ['#4f9cf9', '#4f9cf9'], 'category/asymmetric': ['#a855f7', '#a855f7'], 'category/classic': ['#eab308', '#eab308'], 'category/encoding': ['#22c55e', '#22c55e'], 'category/hashing': ['#f97316', '#f97316'],
  'white': ['#ffffff', '#ffffff'],
};
const RADII = { 'radius/xs': 6, 'radius/sm': 8, 'radius/md': 12, 'radius/pill': 100 };
// [name, family, style, size(px), line-height %, letter-spacing %]   (html font-size is 15px)
const TEXT_STYLES = [
  ['Display/Hero', 'Syne', 'ExtraBold', 56, 110, -4], ['Heading/H1', 'Syne', 'ExtraBold', 26, 120, -3], ['Heading/H2 Section', 'Syne', 'Bold', 19, 130, -2],
  ['Heading/H3 Lesson group', 'Syne', 'Bold', 16.5, 130, -1], ['Title/Card', 'Syne', 'Bold', 13.5, 140, 0], ['Title/Accordion', 'Syne', 'SemiBold', 13.5, 140, 0],
  ['Body/Lead', 'Syne', 'Regular', 15.75, 170, 0], ['Body/Default', 'Syne', 'Regular', 14.25, 160, 0], ['Body/Small', 'Syne', 'Regular', 12.3, 160, 0], ['Body/Caption', 'Syne', 'Regular', 11.25, 150, 0],
  ['Label/Button', 'Syne', 'SemiBold', 13.5, 120, 0], ['Label/Run', 'Syne', 'Bold', 13.8, 120, 1], ['Label/Nav', 'Syne', 'Medium', 13, 120, 0], ['Label/Small', 'Syne', 'SemiBold', 12, 120, 0], ['Label/Tiny', 'Syne', 'SemiBold', 10.2, 120, 0],
  ['Overline/Default', 'Syne', 'SemiBold', 11.25, 120, 4], ['Overline/Small', 'Syne', 'SemiBold', 9.75, 120, 10],
  ['Mono/Stat', 'Space Mono', 'Bold', 22.5, 120, -3], ['Mono/Code', 'Space Mono', 'Regular', 12.3, 160, 0], ['Mono/Small', 'Space Mono', 'Regular', 11.7, 170, 0],
];
const ICONS = {"shield":"<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/>","house":"<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>","lock":"<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>","lock-open":"<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 9.9-1\"/>","book-open":"<path d=\"M12 5v16\"/><path d=\"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z\"/>","chevron-right":"<path d=\"m9 18 6-6-6-6\"/>","chevron-down":"<path d=\"m6 9 6 6 6-6\"/>","moon":"<path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"/>","sun":"<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.93 4.93 1.41 1.41\"/><path d=\"m17.66 17.66 1.41 1.41\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.34 17.66-1.41 1.41\"/><path d=\"m19.07 4.93-1.41 1.41\"/>","menu":"<path d=\"M4 5h16\"/><path d=\"M4 12h16\"/><path d=\"M4 19h16\"/>","x":"<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>","code-xml":"<path d=\"m18 16 4-4-4-4\"/><path d=\"m6 8-4 4 4 4\"/><path d=\"m14.5 4-5 16\"/>","cpu":"<path d=\"M12 20v2\"/><path d=\"M12 2v2\"/><path d=\"M17 20v2\"/><path d=\"M17 2v2\"/><path d=\"M2 12h2\"/><path d=\"M2 17h2\"/><path d=\"M2 7h2\"/><path d=\"M20 12h2\"/><path d=\"M20 17h2\"/><path d=\"M20 7h2\"/><path d=\"M7 20v2\"/><path d=\"M7 2v2\"/><rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"8\" rx=\"1\"/>","hash":"<line x1=\"4\" x2=\"20\" y1=\"9\" y2=\"9\"/><line x1=\"4\" x2=\"20\" y1=\"15\" y2=\"15\"/><line x1=\"10\" x2=\"8\" y1=\"3\" y2=\"21\"/><line x1=\"16\" x2=\"14\" y1=\"3\" y2=\"21\"/>","key":"<path d=\"m2 21 9.6-9.6\"/><path d=\"m7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19\"/><circle cx=\"15.5\" cy=\"7.5\" r=\"5.5\"/>","zap":"<path d=\"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z\"/>","circle-alert":"<circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"/><line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"/>","arrow-right":"<path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/>","check":"<path d=\"M20 6 9 17l-5-5\"/>","copy":"<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"/><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"/>","download":"<path d=\"M12 15V3\"/><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><path d=\"m7 10 5 5 5-5\"/>","loader":"<path d=\"M12 2v4\"/><path d=\"m16.2 7.8 2.9-2.9\"/><path d=\"M18 12h4\"/><path d=\"m16.2 16.2 2.9 2.9\"/><path d=\"M12 18v4\"/><path d=\"m4.9 19.1 2.9-2.9\"/><path d=\"M2 12h4\"/><path d=\"m4.9 4.9 2.9 2.9\"/>","refresh-cw":"<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>","server":"<rect width=\"20\" height=\"8\" x=\"2\" y=\"2\" rx=\"2\" ry=\"2\"/><rect width=\"20\" height=\"8\" x=\"2\" y=\"14\" rx=\"2\" ry=\"2\"/><line x1=\"6\" x2=\"6.01\" y1=\"6\" y2=\"6\"/><line x1=\"6\" x2=\"6.01\" y1=\"18\" y2=\"18\"/>","wifi":"<path d=\"M12 20h.01\"/><path d=\"M2 8.82a15 15 0 0 1 20 0\"/><path d=\"M5 12.859a10 10 0 0 1 14 0\"/><path d=\"M8.5 16.429a5 5 0 0 1 7 0\"/>","wifi-off":"<path d=\"M12 20h.01\"/><path d=\"M8.5 16.429a5 5 0 0 1 7 0\"/><path d=\"M5 12.859a10 10 0 0 1 5.17-2.69\"/><path d=\"M19 12.859a10 10 0 0 0-2.007-1.523\"/><path d=\"M2 8.82a15 15 0 0 1 4.177-2.643\"/><path d=\"M22 8.82a15 15 0 0 0-11.288-3.764\"/><path d=\"m2 2 20 20\"/>","upload":"<path d=\"M12 3v12\"/><path d=\"m17 8-5-5-5 5\"/><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/>","play":"<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\"/>"};

const ALGOS = [
  ['AES-256-GCM', 'symmetric', 'Authenticated encryption; key derived from your passphrase with PBKDF2'],
  ['Fernet', 'symmetric', 'AES-128-CBC + HMAC-SHA256 with a random 32-byte key'],
  ['Triple DES', 'symmetric', 'Legacy block cipher — included for learning, not for new systems'],
  ['RSA-2048 (OAEP)', 'asymmetric', 'Public-key encryption for short messages (≤190 bytes)'],
  ['Caesar Cipher', 'classic'], ['Vigenère Cipher', 'classic'], ['Atbash Cipher', 'classic'], ['ROT13', 'classic'], ['Morse Code', 'classic'],
  ['Base64', 'encoding'], ['Base32', 'encoding'], ['Base85', 'encoding'], ['Hexadecimal', 'encoding'], ['Binary', 'encoding'], ['Octal', 'encoding'], ['Decimal Codes', 'encoding'], ['Unicode Points', 'encoding'], ['URL Encoding', 'encoding'], ['HTML Entities', 'encoding'],
  ['SHA-256', 'hashing', '256-bit SHA-2 digest'], ['SHA-512', 'hashing'], ['SHA3-256', 'hashing'], ['SHA3-512', 'hashing'], ['BLAKE2b', 'hashing'], ['BLAKE2s', 'hashing'], ['SHA-1', 'hashing'], ['MD5', 'hashing'],
];
const CHIPS = ['⚡ All', '🔒 Symmetric', '🔑 Asymmetric', '📜 Classic', '💻 Encoding', '#️⃣ Hashing'];
const CATEGORIES = [
  ['Symmetric', 'lock', 'category/symmetric', 3, ['AES-256-GCM', 'Fernet', 'Triple DES']],
  ['Asymmetric', 'key', 'category/asymmetric', 1, ['RSA-2048 (OAEP)']],
  ['Classic', 'zap', 'category/classic', 5, ['Caesar Cipher', 'Vigenère Cipher', 'Atbash Cipher']],
  ['Encoding', 'code-xml', 'category/encoding', 10, ['Base64', 'Base32', 'Base85']],
  ['Hashing', 'hash', 'category/hashing', 8, ['SHA-256', 'SHA-512', 'SHA3-256']],
];
const FEATURES = [
  ['lock', 'Encode & Encrypt', 'AES-256-GCM, RSA, Fernet, classical ciphers, encodings and hashes — for text or files.', 'Start encoding →'],
  ['lock-open', 'Decode & Decrypt', 'Reverse any encoding or decrypt with the right key. Wrong keys get a clear error, not garbage.', 'Start decoding →'],
  ['book-open', 'Learn how it works', 'Step-by-step explanations, worked examples and real-world use cases for every technique.', 'Open lessons →'],
  ['cpu', 'Private by default', 'Encodings, classical ciphers and SHA hashes run entirely in your browser. Nothing is stored.', 'Try it →'],
];
const LESSONS = {
  encode: {
    icon: 'book-open', title: 'Learn to Encode', stepsTitle: 'How it works',
    subtitle: 'How each encoding and encryption technique works, where it is used, and when to choose it.',
    sections: [
      ['💻 Encoding Schemes', 'category/encoding', ['Base64', 'Hexadecimal', 'Binary', 'URL Encoding', 'HTML Entities']],
      ['🔒 Symmetric Encryption', 'category/symmetric', ['AES-256-GCM', 'Fernet', 'Triple DES (legacy)']],
      ['🔑 Asymmetric Encryption', 'category/asymmetric', ['RSA-2048 with OAEP']],
      ['📜 Classical Ciphers', 'category/classic', ['Caesar Cipher', 'Vigenère Cipher', 'Morse Code']],
      ['#️⃣ Hash Functions', 'category/hashing', ['SHA-256 / SHA-512', 'MD5 (broken)']],
    ],
    open: {
      name: 'Base64',
      overview: 'Base64 represents arbitrary bytes using 64 printable ASCII characters. It is an encoding, not encryption — anyone can reverse it.',
      how: ['Convert the text to bytes (CryptoForge uses UTF-8).', 'Take 3 bytes (24 bits) at a time and split them into four 6-bit groups.', 'Map each 6-bit value to A–Z, a–z, 0–9, + or /.', 'Pad with = when the input length is not a multiple of 3.'],
      example: ['Man', 'TWFu'],
      useCases: ['Email attachments (MIME)', 'Data URIs', 'JWT tokens', 'HTTP Basic Auth'],
    },
  },
  decode: {
    icon: 'lock-open', title: 'Learn to Decode', stepsTitle: 'Step by step',
    subtitle: 'The reverse process — how encoded or encrypted data is turned back into its original form, and what can go wrong.',
    sections: [
      ['💻 Decoding Encodings', 'category/encoding', ['Decoding Base64', 'Decoding Hexadecimal', 'Decoding Binary', 'URL Decoding']],
      ['🔒 Decrypting Symmetric Ciphers', 'category/symmetric', ['Decrypting AES-GCM', 'Breaking Classical Ciphers', 'Decoding Morse']],
      ['🔑 Decrypting Asymmetric Ciphers', 'category/asymmetric', ['Decrypting RSA']],
      ['#️⃣ Why Hashes Cannot Be Decoded', 'category/hashing', ['One-way by design']],
    ],
    open: {
      name: 'Decoding Base64',
      overview: 'Every 4 Base64 characters map back to 3 bytes. Trailing = signs tell you how much padding was added.',
      how: ['Map each character back to its 6-bit value.', 'Join groups of four 6-bit values into three bytes.', 'Drop the padding bytes.', 'Interpret the bytes as UTF-8 text (or as a file).'],
      tip: 'A length that is a multiple of 4 and a trailing = or == are strong hints that text is Base64.',
      example: ['SGVsbG8=', 'Hello'],
      pitfalls: ['URL-safe Base64 uses - and _ instead of + and /.', 'Decoded bytes may be binary data, not text.'],
    },
  },
};
const SAMPLE = {
  plain: 'Meet me at the old bridge at midnight.',
  cipher: 'Xq3vN8sJm2LpR7wT0bYc4KfZ9eHd1Ua6VgOi5nQlE2rWk8yPx0tSj3MhB7oCz4FaG9uDn6Iv1Le5Rs8Tw2Ym0Kb3Xp7Qd==',
  key: 'correct-horse-battery-staple',
  digest: '9f2c6a1e4b7d03c58e1f6a2b9c4d7e0f13a5b8c2d6e9f0a1b4c7d2e5f8a3b6c9',
};

const PAGE_DS = '🎨 Design System', PAGE_SCREENS = '🖥 Screens', PAGE_NOTES = '📝 Change Notes';

// ─── Helpers ───────────────────────────────────────────────────────────────────────────────────
const hex = h => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }; };
const toHex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
let V = {}, VD = {}, R = {}, TS = {}, ICON = {}, COMP = {}, PAGES = {};

const P = (c, op = 1, src = V) => c.startsWith('#')
  ? { type: 'SOLID', color: hex(c), opacity: op }
  : Object.assign({}, figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', src[c]), { opacity: op });
const W = op => ({ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: op });
const SHADOW = { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' };

async function T(chars, style, color = 'text', name) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(TS[style].id);
  t.characters = chars;
  t.fills = [P(color)];
  if (name) t.name = name;
  return t;
}
const recolor = (node, color) => node.findAll(x => 'strokes' in x && x.strokes.length > 0).forEach(x => { x.strokes = [P(color)]; });
const icon = (n, size = 24, color = 'text', name = 'Icon') => { const i = ICON[n].createInstance(); if (size !== 24) i.rescale(size / 24); recolor(i, color); i.name = name; return i; };
const padSet = (n, p) => { if (p == null) return; const a = Array.isArray(p) ? p : [p]; const [t, r = t, b = t, l = r] = a; n.paddingTop = t; n.paddingRight = r; n.paddingBottom = b; n.paddingLeft = l; };
const setup = (n, dir, o = {}) => { n.layoutMode = dir; n.primaryAxisSizingMode = 'AUTO'; n.counterAxisSizingMode = 'AUTO'; n.itemSpacing = o.gap || 0; padSet(n, o.pad); n.fills = []; if (o.name) n.name = o.name; if (o.center) n.counterAxisAlignItems = 'CENTER'; return n; };
const AL = (dir, o) => setup(figma.createFrame(), dir, o);
const C = (name, dir, o = {}) => setup(figma.createComponent(), dir, Object.assign({}, o, { name }));
const rad = (n, k) => { for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) n.setBoundVariable(c, R[k]); };
const stroke = (n, c = 'border', w = 1, op = 1, align = 'INSIDE') => { n.strokes = [P(c, op)]; n.strokeWeight = w; n.strokeAlign = align; };
const sideStroke = (n, side, paint) => { n.strokes = [paint]; n.strokeAlign = 'INSIDE'; for (const s of ['Top', 'Right', 'Bottom', 'Left']) n['stroke' + s + 'Weight'] = s === side ? 1 : 0; };
const fixW = (n, w) => { n.resize(w, n.height); if (n.layoutMode === 'HORIZONTAL') n.primaryAxisSizingMode = 'FIXED'; else n.counterAxisSizingMode = 'FIXED'; };
const fixSize = (n, w, h) => { n.resize(w, h); n.primaryAxisSizingMode = 'FIXED'; n.counterAxisSizingMode = 'FIXED'; };
const fillText = t => { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; };
const wrapText = (t, w) => { t.textAutoResize = 'HEIGHT'; t.resize(w, t.height); };
const spacer = h => { const s = figma.createFrame(); s.name = 'spacer'; s.fills = []; s.resize(1, h); return s; };
const prop = (owner, targets, name, type, def, field) => { const key = owner.addComponentProperty(name, type, def); for (const n of targets) if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences || {}, { [field]: key }); return key; };
const kidsNamed = (set, nm) => set.children.map(k => k.findOne(n => n.name === nm));
const keyOf = (node, base) => Object.keys(node.componentPropertyDefinitions).find(k => k.split('#')[0] === base);
const variant = (setName, value) => { const s = COMP[setName]; return (value ? s.children.find(c => c.name === value) : s.defaultVariant) || s.defaultVariant; };
const inst = (setName, value) => (COMP[setName].type === 'COMPONENT_SET' ? variant(setName, value) : COMP[setName]).createInstance();
// Sets text / swap properties by their display names: { Label: 'Copy', Icon: 'copy' }
function setProps(i, values, setName) {
  const owner = COMP[setName], out = {};
  for (const [k, v] of Object.entries(values)) {
    const key = keyOf(owner, k);
    if (key) out[key] = owner.componentPropertyDefinitions[key].type === 'INSTANCE_SWAP' ? ICON[v].id : v;
    else out[k] = v; // variant property
  }
  i.setProperties(out);
  return i;
}

// ─── Foundations ───────────────────────────────────────────────────────────────────────────────
async function ensurePages() {
  const want = [PAGE_DS, PAGE_SCREENS, PAGE_NOTES];
  for (const name of want) {
    let p = figma.root.children.find(pg => pg.name === name);
    if (!p && name === PAGE_DS) { p = figma.root.children.find(pg => pg.name === 'Page 1'); if (p) p.name = name; }
    if (!p) { p = figma.createPage(); p.name = name; }
    PAGES[name] = p;
  }
}

async function ensureVariables() {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const col = n => cols.find(c => c.name === n) || figma.variables.createVariableCollection(n);
  const light = col('Theme / Light'), dark = col('Theme / Dark'), radius = col('Radius');
  const existing = await figma.variables.getLocalVariablesAsync();
  const find = (c, name) => existing.find(v => v.variableCollectionId === c.id && v.name === name);
  for (const [name, [l, d]] of Object.entries(TOKENS)) {
    for (const [c, val, map] of [[light, l, V], [dark, d, VD]]) {
      let v = find(c, 'color/' + name);
      if (!v) { v = figma.variables.createVariable('color/' + name, c, 'COLOR'); v.setValueForMode(c.modes[0].modeId, hex(val)); v.scopes = ['ALL_FILLS', 'STROKE_COLOR']; }
      map[name] = v;
    }
  }
  for (const [name, val] of Object.entries(RADII)) {
    let v = find(radius, name);
    if (!v) { v = figma.variables.createVariable(name, radius, 'FLOAT'); v.setValueForMode(radius.modes[0].modeId, val); v.scopes = ['CORNER_RADIUS']; }
    R[name] = v;
  }
}

async function ensureTextStyles() {
  const fonts = [['Syne', 'Regular'], ['Syne', 'Medium'], ['Syne', 'SemiBold'], ['Syne', 'Bold'], ['Syne', 'ExtraBold'], ['Space Mono', 'Regular'], ['Space Mono', 'Bold'], ['Inter', 'Regular']];
  for (const [family, style] of fonts) await figma.loadFontAsync({ family, style });
  const existing = await figma.getLocalTextStylesAsync();
  for (const [name, family, style, size, lh, ls] of TEXT_STYLES) {
    let s = existing.find(x => x.name === name);
    if (!s) {
      s = figma.createTextStyle(); s.name = name; s.fontName = { family, style }; s.fontSize = size;
      s.lineHeight = { unit: 'PERCENT', value: lh }; s.letterSpacing = { unit: 'PERCENT', value: ls };
      if (name.startsWith('Overline')) s.textCase = 'UPPER';
    }
    TS[name] = s;
  }
}

function ensureIcons(page) {
  page.findAllWithCriteria({ types: ['COMPONENT'] }).forEach(c => { if (c.name.startsWith('icon/')) ICON[c.name.slice(5)] = c; });
  let board = page.children.find(n => n.name === 'Icons');
  if (!board) {
    board = AL('HORIZONTAL', { name: 'Icons', gap: 16, pad: 24 });
    board.layoutWrap = 'WRAP'; board.counterAxisSpacing = 16; board.resize(600, 100); board.primaryAxisSizingMode = 'FIXED';
    board.fills = [P('#ffffff')]; board.cornerRadius = 12; board.x = 0; board.y = 1400;
    page.appendChild(board);
  }
  for (const [name, inner] of Object.entries(ICONS)) {
    if (ICON[name]) continue;
    const svg = figma.createNodeFromSvg(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`);
    const comp = figma.createComponentFromNode(svg);
    comp.name = 'icon/' + name; comp.fills = [];
    comp.findAll(() => true).forEach(c => { if ('strokes' in c && c.strokes.length) c.strokes = [P('text')]; if ('constraints' in c) c.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; });
    comp.description = `Lucide "${name}" (lucide-react). Scale instances with K so strokes scale.`;
    board.appendChild(comp);
    ICON[name] = comp;
  }
}

// ─── Components ────────────────────────────────────────────────────────────────────────────────
async function ensureComponents(page) {
  for (const n of page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) if (!n.name.startsWith('icon/') && !(n.parent && n.parent.type === 'COMPONENT_SET')) COMP[n.name] = n;
  let board = page.children.find(n => n.name === 'Components');
  if (!board) { board = AL('VERTICAL', { name: 'Components', gap: 40, pad: 40 }); board.fills = [P('#ffffff')]; board.cornerRadius = 16; board.x = 700; board.y = 0; page.appendChild(board); }
  const row = async (title, note) => {
    let r = board.children.find(c => c.name === title);
    if (r) return r;
    r = AL('VERTICAL', { gap: 10, name: title }); r.appendChild(await T(title, 'Heading/H2 Section')); if (note) r.appendChild(await T(note, 'Body/Small', 'text-3')); board.appendChild(r); return r;
  };
  const mkSet = (comps, name, r, dir = 'HORIZONTAL') => { const s = figma.combineAsVariants(comps, r); s.name = name; setup(s, dir, { gap: 16, pad: 20 }); s.counterAxisAlignItems = 'CENTER'; s.fills = [P('bg')]; s.cornerRadius = 8; COMP[name] = s; return s; };
  const need = name => !COMP[name];

  if (need('Button')) { const r = await row('Button', 'btn-primary / btn-secondary — hero CTAs'); const comps = [];
    for (const type of ['Primary', 'Secondary']) { const p = type === 'Primary'; const c = C(`Type=${type}`, 'HORIZONTAL', { gap: 8, pad: [12, 24], center: true }); rad(c, 'radius/sm');
      c.fills = [P(p ? 'accent' : 'surface')]; if (!p) stroke(c); c.appendChild(icon(p ? 'lock' : 'book-open', 16, p ? 'accent-fg' : 'text')); c.appendChild(await T(p ? 'Start encoding' : 'Learn first', 'Label/Button', p ? 'accent-fg' : 'text', 'Label')); comps.push(c); }
    const s = mkSet(comps, 'Button', r); prop(s, kidsNamed(s, 'Label'), 'Label', 'TEXT', 'Button', 'characters'); prop(s, kidsNamed(s, 'Icon'), 'Icon', 'INSTANCE_SWAP', ICON['lock'].id, 'mainComponent'); prop(s, kidsNamed(s, 'Icon'), 'Show icon', 'BOOLEAN', true, 'visible'); }

  if (need('Nav Item')) { const r = await row('Nav Item', 'Sidebar navigation link'); const comps = [];
    for (const st of ['Default', 'Hover', 'Active']) { const c = C(`State=${st}`, 'HORIZONTAL', { gap: 10, pad: 10, center: true }); fixW(c, 216); rad(c, 'radius/sm');
      c.fills = st === 'Active' ? [W(0.1)] : st === 'Hover' ? [W(0.07)] : []; const col = st === 'Active' ? 'sidebar/active' : 'sidebar/text';
      c.appendChild(icon('house', 18, col)); const t = await T('Home', 'Label/Nav', col, 'Label'); c.appendChild(t); t.layoutSizingHorizontal = 'FILL';
      const a = icon('chevron-right', 14, col, 'Arrow'); a.visible = st !== 'Default'; c.appendChild(a); comps.push(c); }
    const s = mkSet(comps, 'Nav Item', r); s.fills = [P('sidebar/bg')]; prop(s, kidsNamed(s, 'Label'), 'Label', 'TEXT', 'Home', 'characters'); prop(s, kidsNamed(s, 'Icon'), 'Icon', 'INSTANCE_SWAP', ICON['house'].id, 'mainComponent'); }

  if (need('Theme Toggle')) { const r = await row('Theme Toggle'); const comps = [];
    for (const m of ['Light', 'Dark']) { const c = C(`Mode=${m}`, 'HORIZONTAL', { pad: 3, center: true }); fixSize(c, 44, 24); c.primaryAxisAlignItems = m === 'Dark' ? 'MAX' : 'MIN'; c.fills = [P(m === 'Dark' ? '#4f9cf9' : '#2e2c2a')]; c.cornerRadius = 100;
      const th = AL('HORIZONTAL', { name: 'Thumb', center: true }); th.primaryAxisAlignItems = 'CENTER'; fixSize(th, 18, 18); th.cornerRadius = 9; th.fills = [W(1)]; th.appendChild(icon(m === 'Dark' ? 'moon' : 'sun', 12, '#1a1917')); c.appendChild(th); comps.push(c); }
    mkSet(comps, 'Theme Toggle', r).fills = [P('sidebar/bg')]; }

  if (need('Tag')) { const r = await row('Tag', 'Algorithm samples, use-case pills'); const comps = [];
    for (const st of ['Default', 'Muted']) { const c = C(`Style=${st}`, 'HORIZONTAL', { pad: [2, 10], center: true }); c.cornerRadius = 100; c.fills = [P('surface-2')]; stroke(c); const t = await T(st === 'Muted' ? '+2' : 'AES-256-GCM', 'Label/Tiny', st === 'Muted' ? 'text-3' : 'text-2', 'Label'); t.fontName = { family: 'Syne', style: 'Medium' }; c.appendChild(t); comps.push(c); }
    const s = mkSet(comps, 'Tag', r); prop(s, kidsNamed(s, 'Label'), 'Label', 'TEXT', 'Tag', 'characters'); }

  if (need('Filter Chip')) { const r = await row('Filter Chip', 'Algorithm category filter on Encode / Decode'); const comps = [];
    for (const st of ['Default', 'Active']) { const a = st === 'Active'; const c = C(`State=${st}`, 'HORIZONTAL', { pad: [3, 10], center: true }); c.cornerRadius = 100; c.fills = a ? [P('accent')] : []; stroke(c, a ? 'accent' : 'border'); c.appendChild(await T(a ? '⚡ All' : '🔒 Symmetric', 'Label/Tiny', a ? 'accent-fg' : 'text-2', 'Label')); comps.push(c); }
    const s = mkSet(comps, 'Filter Chip', r); prop(s, kidsNamed(s, 'Label'), 'Label', 'TEXT', 'Chip', 'characters'); }

  if (need('Algorithm Item')) { const r = await row('Algorithm Item', 'Row in the algorithm picker list'); const comps = [];
    for (const st of ['Default', 'Active', 'Disabled']) { const c = C(`State=${st}`, 'HORIZONTAL', { gap: 8, pad: 10, center: true }); fixW(c, 244); c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.cornerRadius = 7;
      if (st === 'Active') { c.fills = [P('surface-2')]; stroke(c, 'blue', 1.5, 1, 'OUTSIDE'); } if (st === 'Disabled') c.opacity = 0.4;
      const info = AL('VERTICAL', { gap: 1, name: 'Info' }); info.appendChild(await T('AES-256-GCM', 'Label/Small', 'text', 'Name')); const cat = await T('symmetric', 'Overline/Small', 'text-3', 'Category'); cat.letterSpacing = { unit: 'PERCENT', value: 5 }; info.appendChild(cat); c.appendChild(info);
      const b = AL('HORIZONTAL', { pad: [1, 7], name: 'One-way badge' }); b.cornerRadius = 100; b.fills = [P('surface-2')]; stroke(b); const bt = await T('one-way', 'Label/Tiny', 'text-3'); bt.fontSize = 9; b.appendChild(bt); c.appendChild(b); comps.push(c); }
    const s = mkSet(comps, 'Algorithm Item', r, 'VERTICAL'); s.fills = [P('surface')];
    prop(s, kidsNamed(s, 'Name'), 'Name', 'TEXT', 'AES-256-GCM', 'characters'); prop(s, kidsNamed(s, 'Category'), 'Category', 'TEXT', 'symmetric', 'characters'); prop(s, kidsNamed(s, 'One-way badge'), 'One-way', 'BOOLEAN', false, 'visible'); }

  if (need('Icon Button')) { const r = await row('Icon Button', 'Result actions: Copy / Save / Decode it'); const comps = [];
    for (const st of ['Default', 'Accent']) { const a = st === 'Accent'; const c = C(`Style=${st}`, 'HORIZONTAL', { gap: 5, pad: [5, 10], center: true }); rad(c, 'radius/xs'); c.fills = [P(a ? 'blue' : 'surface')]; stroke(c, a ? 'blue' : 'border'); const col = a ? 'white' : 'text';
      const ic = icon(a ? 'arrow-right' : 'copy', 15, col); const t = await T(a ? 'Decode it' : 'Copy', 'Label/Small', col, 'Label'); if (a) { c.appendChild(t); c.appendChild(ic); } else { c.appendChild(ic); c.appendChild(t); } comps.push(c); }
    const s = mkSet(comps, 'Icon Button', r); prop(s, kidsNamed(s, 'Label'), 'Label', 'TEXT', 'Copy', 'characters'); prop(s, kidsNamed(s, 'Icon'), 'Icon', 'INSTANCE_SWAP', ICON['copy'].id, 'mainComponent'); }

  if (need('Utility Button')) { const r = await row('Utility Button', 'gen-key-btn — Generate key, Try it in the playground');
    const c = C('Utility Button', 'HORIZONTAL', { gap: 6, pad: [8, 14], center: true }); rad(c, 'radius/sm'); c.fills = [P('surface-2')]; stroke(c);
    c.appendChild(icon('refresh-cw', 13)); c.appendChild(await T('Generate', 'Label/Small', 'text', 'Label')); r.appendChild(c); COMP['Utility Button'] = c;
    prop(c, [c.findOne(n => n.name === 'Label')], 'Label', 'TEXT', 'Generate', 'characters'); prop(c, [c.findOne(n => n.name === 'Icon')], 'Icon', 'INSTANCE_SWAP', ICON['refresh-cw'].id, 'mainComponent'); }

  if (need('Run Button')) { const r = await row('Run Button', 'Primary action in the workspace'); const comps = [];
    for (const st of ['Default', 'Disabled', 'Loading']) { const c = C(`State=${st}`, 'HORIZONTAL', { gap: 10, pad: [14, 24], center: true }); fixW(c, 600); c.primaryAxisAlignItems = 'CENTER'; rad(c, 'radius/sm'); c.fills = [P('blue')]; if (st === 'Disabled') c.opacity = 0.45;
      c.appendChild(icon(st === 'Loading' ? 'loader' : 'lock', 18, 'white')); c.appendChild(await T(st === 'Loading' ? 'Working…' : 'Encode / Encrypt', 'Label/Run', 'white', 'Label'));
      const k = AL('HORIZONTAL', { pad: [2, 6], name: 'Shortcut' }); k.cornerRadius = 4; k.fills = [W(0.18)]; const kt = await T('Ctrl ↵', 'Mono/Small', 'white'); kt.fontSize = 10.2; k.appendChild(kt); k.visible = st !== 'Loading'; c.appendChild(k); comps.push(c); }
    const s = mkSet(comps, 'Run Button', r, 'VERTICAL'); prop(s, kidsNamed(s, 'Label'), 'Label', 'TEXT', 'Encode / Encrypt', 'characters'); prop(s, kidsNamed(s, 'Icon'), 'Icon', 'INSTANCE_SWAP', ICON['lock'].id, 'mainComponent'); }

  if (need('Info Box')) { const r = await row('Info Box', 'Warnings (API offline, one-way hash) and errors'); const comps = [];
    for (const st of ['Warning', 'Error']) { const col = st === 'Warning' ? 'yellow' : 'red'; const c = C(`Type=${st}`, 'HORIZONTAL', { gap: 10, pad: [12, 16] }); fixW(c, 600); rad(c, 'radius/sm'); c.fills = [P(col, 0.12)]; stroke(c, col, 1, 0.25);
      c.appendChild(icon('circle-alert', 16, col)); const t = await T('Message', 'Body/Small', col, 'Message'); c.appendChild(t); fillText(t); comps.push(c); }
    const s = mkSet(comps, 'Info Box', r, 'VERTICAL'); prop(s, kidsNamed(s, 'Message'), 'Message', 'TEXT', 'Message', 'characters'); }

  if (need('Backend Badge')) { const r = await row('Backend Badge', 'Where the algorithm runs'); const comps = [];
    for (const [m, ic] of [['In-browser', 'cpu'], ['Server', 'wifi'], ['API offline', 'wifi-off']]) { const c = C(`Mode=${m}`, 'HORIZONTAL', { gap: 4, pad: [3, 8], center: true }); c.cornerRadius = 100; c.fills = [P('surface-2')]; stroke(c); c.appendChild(icon(ic, 13, 'text-3')); c.appendChild(await T(m.toLowerCase(), 'Label/Tiny', 'text-3', 'Label')); comps.push(c); }
    mkSet(comps, 'Backend Badge', r); }

  if (need('Accordion Item')) { const r = await row('Accordion Item', 'Lesson row (closed). Open state is composed on the Learn screens.');
    const c = C('Accordion Item', 'HORIZONTAL', { pad: [14, 18], center: true }); fixW(c, 860); c.primaryAxisAlignItems = 'SPACE_BETWEEN'; rad(c, 'radius/sm'); c.fills = [P('surface')]; stroke(c);
    c.appendChild(await T('Hexadecimal', 'Title/Accordion', 'text', 'Title')); c.appendChild(icon('chevron-right', 16)); r.appendChild(c); COMP['Accordion Item'] = c;
    prop(c, [c.findOne(n => n.name === 'Title')], 'Title', 'TEXT', 'Hexadecimal', 'characters'); }

  if (need('Input / Text Area') || need('Input / Key Field') || need('Input / Key Text Area')) { const r = await row('Inputs', 'Main text area, key field, key text area (RSA)');
    if (need('Input / Text Area')) { const comps = [];
      for (const st of ['Empty', 'Filled', 'Focused']) { const c = C(`State=${st}`, 'VERTICAL', { pad: [14, 16] }); fixSize(c, 600, 150); rad(c, 'radius/sm'); c.fills = [P('surface')]; stroke(c, st === 'Focused' ? 'blue' : 'border');
        const t = await T(st === 'Empty' ? 'Enter text to encode or encrypt…' : SAMPLE.plain, 'Mono/Code', st === 'Empty' ? 'text-3' : 'text', 'Value'); c.appendChild(t); fillText(t); comps.push(c); }
      const s = mkSet(comps, 'Input / Text Area', r, 'VERTICAL'); prop(s, kidsNamed(s, 'Value'), 'Value', 'TEXT', 'Enter text…', 'characters'); }
    if (need('Input / Key Field')) { const comps = [];
      for (const st of ['Empty', 'Filled']) { const c = C(`State=${st}`, 'HORIZONTAL', { pad: [9, 12], center: true }); fixW(c, 320); c.cornerRadius = 7; c.fills = [P('surface-2')]; stroke(c);
        const t = await T(st === 'Empty' ? 'Enter a secret…' : SAMPLE.key, 'Body/Small', st === 'Empty' ? 'text-3' : 'text', 'Value'); c.appendChild(t); t.layoutSizingHorizontal = 'FILL'; comps.push(c); }
      const s = mkSet(comps, 'Input / Key Field', r); prop(s, kidsNamed(s, 'Value'), 'Value', 'TEXT', 'Enter a secret…', 'characters'); }
    if (need('Input / Key Text Area')) { const kt = C('Input / Key Text Area', 'VERTICAL', { pad: [10, 12] }); fixSize(kt, 560, 76); kt.cornerRadius = 7; kt.fills = [P('surface-2')]; stroke(kt);
      const ktt = await T('-----BEGIN PUBLIC KEY-----', 'Mono/Small', 'text-3', 'Value'); ktt.fontSize = 10.8; kt.appendChild(ktt); fillText(ktt); r.appendChild(kt); COMP['Input / Key Text Area'] = kt;
      prop(kt, [ktt], 'Value', 'TEXT', '-----BEGIN PUBLIC KEY-----', 'characters'); } }

  if (need('Tab')) { const r = await row('Tab', 'Text / File input switch'); const comps = [];
    for (const st of ['Default', 'Active']) { const a = st === 'Active'; const c = C(`State=${st}`, 'HORIZONTAL', { pad: [7, 16], center: true }); rad(c, 'radius/xs'); c.fills = a ? [P('accent')] : []; c.appendChild(await T(a ? '✏️ Text' : '📁 File', 'Label/Small', a ? 'accent-fg' : 'text-2', 'Label')); comps.push(c); }
    const s = mkSet(comps, 'Tab', r); prop(s, kidsNamed(s, 'Label'), 'Label', 'TEXT', 'Tab', 'characters'); }

  if (need('Dropzone')) { const r = await row('Dropzone', 'File mode input (max 5 MB)'); const comps = [];
    { const c = C('State=Empty', 'VERTICAL', { gap: 10, pad: 40, center: true }); fixW(c, 600); c.primaryAxisAlignItems = 'CENTER'; rad(c, 'radius/sm'); c.fills = [P('surface')]; stroke(c, 'border', 2); c.dashPattern = [6, 4];
      c.appendChild(icon('upload', 32, 'text-3')); const t = await T('Drop a file here, or click to browse', 'Body/Small', 'text-2'); t.fontSize = 13.2; t.setRangeFontName(21, t.characters.length, { family: 'Syne', style: 'Bold' }); c.appendChild(t);
      c.appendChild(await T('Base64, Hex, Binary or any hash (e.g. SHA-256 checksum) · max 5 MB', 'Body/Caption', 'text-3')); comps.push(c); }
    { const c = C('State=Has file', 'HORIZONTAL', { gap: 10, pad: 40, center: true }); fixW(c, 600); c.primaryAxisAlignItems = 'CENTER'; rad(c, 'radius/sm'); c.fills = [P('surface')]; stroke(c, 'green', 2);
      c.appendChild(icon('upload', 20, 'green')); c.appendChild(await T('cryptoforge-v2.zip', 'Label/Button', 'green', 'File name')); c.appendChild(await T('(1.24 MB)', 'Body/Small', 'text-3', 'File size')); c.appendChild(icon('x', 14, 'text-3', 'Remove')); comps.push(c); }
    mkSet(comps, 'Dropzone', r, 'VERTICAL'); }

  if (need('Logo')) { const r = await row('Logo');
    const logo = C('Logo', 'HORIZONTAL', { gap: 10, center: true });
    const li = AL('HORIZONTAL', { name: 'Logo mark', center: true }); li.primaryAxisAlignItems = 'CENTER'; fixSize(li, 36, 36); li.cornerRadius = 9; li.fills = [P('#f4f3ef')]; li.appendChild(icon('shield', 20, '#1a1917')); logo.appendChild(li);
    const lt = await T('CryptoForge', 'Title/Card', 'sidebar/logo-text', 'Wordmark'); lt.fontSize = 15; lt.letterSpacing = { unit: 'PERCENT', value: -2 }; logo.appendChild(lt);
    const bg = AL('HORIZONTAL', { pad: 20, name: 'Logo on sidebar' }); bg.fills = [P('sidebar/bg')]; bg.cornerRadius = 8; r.appendChild(bg); bg.appendChild(logo); COMP['Logo'] = logo; }

  if (need('Sidebar')) { const r = await row('Sidebar', 'Fixed 240px. Variant = active page. Dark screens switch the toggle to Dark.');
    const pages = [['Home', 'house'], ['Encode', 'lock'], ['Decode', 'lock-open'], ['Learn to Encode', 'book-open'], ['Learn to Decode', 'book-open']]; const comps = [];
    for (const [active] of pages) {
      const c = C(`Active=${active}`, 'VERTICAL'); fixSize(c, 240, 900); c.fills = [P('sidebar/bg')]; sideStroke(c, 'Right', W(0.04));
      const head = AL('HORIZONTAL', { pad: [24, 20, 20, 20], name: 'Head', center: true }); sideStroke(head, 'Bottom', W(0.06)); head.appendChild(COMP['Logo'].createInstance()); c.appendChild(head); head.layoutSizingHorizontal = 'FILL';
      const nav = AL('VERTICAL', { pad: [16, 12], name: 'Nav' }); c.appendChild(nav); nav.layoutSizingHorizontal = 'FILL'; nav.layoutSizingVertical = 'FILL';
      const lab = AL('HORIZONTAL', { pad: [0, 8, 8, 8], name: 'Nav label' }); lab.appendChild(await T('Navigation', 'Overline/Small', 'sidebar/label')); nav.appendChild(lab);
      for (const [name, ic] of pages) { const it = inst('Nav Item'); nav.appendChild(it); setProps(it, { State: name === active ? 'Active' : 'Default', Label: name, Icon: ic }, 'Nav Item'); it.name = name; recolor(it.children[0], name === active ? 'sidebar/active' : 'sidebar/text'); }
      const bot = AL('HORIZONTAL', { pad: [16, 20], name: 'Bottom', center: true }); bot.primaryAxisAlignItems = 'SPACE_BETWEEN'; sideStroke(bot, 'Top', W(0.06));
      bot.appendChild(await T('Light mode', 'Body/Caption', '#8a847b', 'Theme label')); const tg = inst('Theme Toggle'); tg.name = 'Theme toggle'; bot.appendChild(tg); c.appendChild(bot); bot.layoutSizingHorizontal = 'FILL';
      comps.push(c); }
    mkSet(comps, 'Sidebar', r).fills = [P('#ffffff')]; }

  if (need('Mobile Bar')) { const r = await row('Mobile Bar', '< 700px: the sidebar collapses behind a menu button');
    const c = C('Mobile Bar', 'HORIZONTAL', { pad: [0, 8, 0, 0], center: true }); fixW(c, 375); c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.fills = [P('sidebar/bg')];
    const lw = AL('HORIZONTAL', { pad: [12, 16], name: 'Logo wrap' }); lw.appendChild(COMP['Logo'].createInstance()); c.appendChild(lw);
    const mb = AL('HORIZONTAL', { pad: 8, name: 'Menu button' }); mb.cornerRadius = 8; mb.appendChild(icon('menu', 22, '#f0ede8')); c.appendChild(mb); r.appendChild(c); COMP['Mobile Bar'] = c; }

  if (need('Category Card')) { const r = await row('Category Card', 'Home → "Explore by category". 3px top border in the category colour.'); const comps = [];
    for (const [name, ic, col, n, samples] of CATEGORIES) { const c = C(`Category=${name}`, 'VERTICAL', { gap: 12, pad: 20 }); fixW(c, 207); c.cornerRadius = 12; c.clipsContent = true; c.fills = [P('surface')]; stroke(c);
      const bar = figma.createRectangle(); bar.name = 'Top accent'; bar.fills = [P(col)]; c.appendChild(bar); bar.layoutPositioning = 'ABSOLUTE'; bar.x = 0; bar.y = 0; bar.resize(207, 3); bar.constraints = { horizontal: 'STRETCH', vertical: 'MIN' };
      const iw = AL('HORIZONTAL', { name: 'Icon wrap', center: true }); iw.primaryAxisAlignItems = 'CENTER'; fixSize(iw, 36, 36); iw.cornerRadius = 8; iw.fills = [P(col, 0.15)]; iw.appendChild(icon(ic, 22, col)); c.appendChild(iw);
      const tx = AL('VERTICAL', { gap: 3, name: 'Text' }); tx.appendChild(await T(name, 'Title/Card', 'text', 'Title')); tx.appendChild(await T(`${n} algorithm${n > 1 ? 's' : ''}`, 'Body/Caption', 'text-3', 'Count')); c.appendChild(tx);
      const sm = AL('HORIZONTAL', { gap: 4, name: 'Samples' }); sm.layoutWrap = 'WRAP'; sm.counterAxisSpacing = 4; c.appendChild(sm); sm.layoutSizingHorizontal = 'FILL';
      for (const s of samples) { const t = inst('Tag'); sm.appendChild(t); setProps(t, { Label: s }, 'Tag'); }
      if (n > 3) { const t = inst('Tag'); sm.appendChild(t); setProps(t, { Style: 'Muted', Label: `+${n - 3}` }, 'Tag'); }
      comps.push(c); }
    mkSet(comps, 'Category Card', r).counterAxisAlignItems = 'MIN'; }

  if (need('Feature Card')) { const r = await row('Feature Card', 'Home → "What you can do"');
    const c = C('Feature Card', 'VERTICAL', { pad: 24 }); fixW(c, 263); c.cornerRadius = 12; c.fills = [P('surface')]; stroke(c);
    const fi = AL('HORIZONTAL', { name: 'Icon wrap', center: true }); fi.primaryAxisAlignItems = 'CENTER'; fixSize(fi, 38, 38); fi.cornerRadius = 9; fi.fills = [P('surface-2')]; fi.appendChild(icon('lock', 20, 'blue')); c.appendChild(fi);
    c.appendChild(spacer(14)); const h = await T(FEATURES[0][1], 'Title/Card', 'text', 'Title'); c.appendChild(h); fillText(h);
    c.appendChild(spacer(6)); const d = await T(FEATURES[0][2], 'Body/Small', 'text-2', 'Description'); c.appendChild(d); fillText(d);
    c.appendChild(spacer(16)); const cta = await T(FEATURES[0][3], 'Label/Small', 'blue', 'CTA'); c.appendChild(cta);
    r.appendChild(c); COMP['Feature Card'] = c;
    prop(c, [h], 'Title', 'TEXT', h.characters, 'characters'); prop(c, [d], 'Description', 'TEXT', d.characters, 'characters'); prop(c, [cta], 'CTA', 'TEXT', cta.characters, 'characters'); prop(c, [fi.children[0]], 'Icon', 'INSTANCE_SWAP', ICON['lock'].id, 'mainComponent'); }

  if (need('Stat')) { const r = await row('Stat', 'Hero stats row');
    const c = C('Stat', 'VERTICAL', { gap: 2 }); const v = await T('27', 'Mono/Stat', 'text', 'Value'); const l = await T('Algorithms', 'Overline/Default', 'text-3', 'Label'); l.fontSize = 10.8; l.letterSpacing = { unit: 'PERCENT', value: 6 }; c.appendChild(v); c.appendChild(l); r.appendChild(c); COMP['Stat'] = c;
    prop(c, [v], 'Value', 'TEXT', '27', 'characters'); prop(c, [l], 'Label', 'TEXT', 'Algorithms', 'characters'); }
}

async function ensureFoundationsBoard(page) {
  if (page.children.find(n => n.name === 'Foundations')) return;
  const fb = AL('VERTICAL', { name: 'Foundations', gap: 24, pad: 40 }); fb.fills = [P('#ffffff')]; fb.cornerRadius = 16; fixW(fb, 600); fb.x = 0; fb.y = 0; page.appendChild(fb);
  const add = n => { fb.appendChild(n); return n; };
  add(await T('CryptoForge — Foundations', 'Heading/H1'));
  fillText(add(await T('Colours live in two variable collections, "Theme / Light" and "Theme / Dark", with the same token names. Screens use Light; the Dark screens are bound to Dark. Change a value once and every screen that uses it updates.', 'Body/Small', 'text-2')));
  add(await T('Colours  (left = Light, right = Dark)', 'Heading/H2 Section'));
  const grid = AL('VERTICAL', { gap: 6, name: 'Colour tokens' }); add(grid);
  for (const name of Object.keys(V)) { const rr = AL('HORIZONTAL', { gap: 12, center: true, name }); grid.appendChild(rr);
    for (const src of [V, VD]) { const sw = figma.createRectangle(); sw.resize(48, 28); sw.cornerRadius = 6; sw.fills = [P(name, 1, src)]; sw.strokes = [P('#e0ddd7')]; sw.strokeWeight = 1; rr.appendChild(sw); }
    rr.appendChild(await T(`color/${name}`, 'Mono/Small', 'text')); }
  add(await T('Typography — Syne (UI) · Space Mono (code, stats)', 'Heading/H2 Section'));
  for (const s of Object.values(TS)) { const rr = AL('VERTICAL', { gap: 2, name: s.name }); rr.appendChild(await T(s.name.startsWith('Mono') ? 'U2FsdGVkX1+ 27' : 'Encrypt. Encode. Understand.', s.name, 'text')); rr.appendChild(await T(`${s.name} — ${s.fontName.family} ${s.fontName.style} ${Math.round(s.fontSize * 10) / 10}px`, 'Mono/Small', 'text-3')); add(rr); }
  const icons = page.children.find(n => n.name === 'Icons'); if (icons) { icons.x = 0; icons.y = fb.height + 60; }
}

// ─── Screen building blocks ────────────────────────────────────────────────────────────────────
function screenFrame(name, width, mobile) {
  const f = AL(mobile ? 'VERTICAL' : 'HORIZONTAL', { name }); f.resize(width, mobile ? 812 : 900);
  if (mobile) { f.counterAxisSizingMode = 'FIXED'; f.primaryAxisSizingMode = 'AUTO'; } else { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'; }
  f.minHeight = mobile ? 812 : 900; f.fills = [P('bg')]; f.clipsContent = true; return f;
}
function addChrome(f, active, mobile) {
  if (mobile) { const mb = COMP['Mobile Bar'].createInstance(); f.appendChild(mb); mb.layoutSizingHorizontal = 'FILL'; return mb; }
  const sb = inst('Sidebar', `Active=${active}`); f.appendChild(sb); sb.layoutSizingVertical = 'FILL'; return sb;
}
function pageFrame(f, width, mobile) {
  const p = AL('VERTICAL', { name: 'Page', pad: mobile ? [20, 16] : [40, 48] }); f.appendChild(p);
  if (mobile) p.layoutSizingHorizontal = 'FILL'; else fixW(p, width);
  return { page: p, cw: (mobile ? 375 : width) - (mobile ? 32 : 96) };
}
async function pageHeader(parent, ic, title, subtitle, cw) {
  const h = AL('VERTICAL', { name: 'Page header' }); parent.appendChild(h);
  const row = AL('HORIZONTAL', { gap: 12, center: true, name: 'Title row' }); row.appendChild(icon(ic, 24, 'blue')); row.appendChild(await T(title, 'Heading/H1', 'text', 'Title')); h.appendChild(row);
  h.appendChild(spacer(8)); const s = await T(subtitle, 'Body/Default', 'text-2', 'Subtitle'); h.appendChild(s); if (s.width > Math.min(600, cw)) wrapText(s, Math.min(600, cw));
  parent.appendChild(spacer(32));
}
function grid(parent, cw, gap = 16) { const g = AL('HORIZONTAL', { gap, name: 'Grid' }); g.layoutWrap = 'WRAP'; g.counterAxisSpacing = gap; parent.appendChild(g); fixW(g, cw); return g; }
function equalizeRows(items, cols) { for (let i = 0; i < items.length; i += cols) { const rowItems = items.slice(i, i + cols); const h = Math.max(...rowItems.map(n => n.height)); rowItems.forEach(n => n.resize(n.width, h)); } }
function heroGradient(dark) {
  const a = hex(dark ? '#60a5fa' : '#2563eb'), b = hex(dark ? '#c084fc' : '#7c3aed');
  return { type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: Object.assign({}, a, { a: 1 }) }, { position: 1, color: Object.assign({}, b, { a: 1 }) }] };
}

// Light → Dark: rebind every colour variable to its "Theme / Dark" twin and flip the sidebar toggle.
async function darkify(root) {
  const map = new Map(Object.keys(V).map(k => [V[k].id, VD[k]]));
  const swap = paints => paints.map(p => {
    const id = p.boundVariables && p.boundVariables.color && p.boundVariables.color.id; const d = id && map.get(id);
    if (!d) return p; const op = p.opacity === undefined ? 1 : p.opacity;
    return Object.assign({}, figma.variables.setBoundVariableForPaint(p, 'color', d), { opacity: op });
  });
  for (const n of [root, ...root.findAll(() => true)]) {
    if ('fills' in n) {
      if (n.fills === figma.mixed && n.type === 'TEXT') { for (const seg of n.getStyledTextSegments(['fills'])) { const sw = seg.fills.some(p => p.type === 'GRADIENT_LINEAR') ? [heroGradient(true)] : swap(seg.fills); n.setRangeFills(seg.start, seg.end, sw); } }
      else if (Array.isArray(n.fills) && n.fills.length) n.fills = swap(n.fills);
    }
    if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length) n.strokes = swap(n.strokes);
  }
  const tl = root.findOne(n => n.name === 'Theme label'); if (tl) tl.characters = 'Dark mode';
  const tg = root.findOne(n => n.name === 'Theme toggle'); if (tg) tg.setProperties({ Mode: 'Dark' });
}

// ─── Screens ───────────────────────────────────────────────────────────────────────────────────
async function buildHome(name, { mobile = false, dark = false } = {}) {
  const f = screenFrame(name, mobile ? 375 : 1440, mobile); addChrome(f, 'Home', mobile);
  const { page, cw } = pageFrame(f, 1100, mobile);
  const hero = AL('VERTICAL', { name: 'Hero', pad: mobile ? [32, 0] : [60, 0, 48, 0] }); sideStroke(hero, 'Bottom', P('border')); page.appendChild(hero); hero.layoutSizingHorizontal = 'FILL';
  const badge = AL('HORIZONTAL', { gap: 6, pad: [5, 14], center: true, name: 'Hero badge' }); badge.cornerRadius = 100; badge.fills = [P('surface-2')]; stroke(badge);
  badge.appendChild(icon('shield', 14, 'text-2')); badge.appendChild(await T('Cryptography Playground', 'Overline/Default', 'text-2')); hero.appendChild(badge); hero.appendChild(spacer(24));
  const title = await T('Encrypt. Encode.\nUnderstand.', 'Display/Hero', 'text', 'Hero title'); if (mobile) title.fontSize = 33; title.setRangeFills(17, title.characters.length, [heroGradient(false)]); hero.appendChild(title); hero.appendChild(spacer(20));
  const desc = await T('A full-stack toolkit for symmetric and public-key encryption, classical ciphers, encoding schemes and hash functions — with lessons that explain what is happening under the hood.', 'Body/Lead', 'text-2', 'Hero description'); hero.appendChild(desc); wrapText(desc, Math.min(560, cw)); hero.appendChild(spacer(32));
  const actions = AL('HORIZONTAL', { gap: 12, name: 'Hero actions' }); hero.appendChild(actions);
  const b1 = inst('Button', 'Type=Primary'); actions.appendChild(b1); setProps(b1, { Label: 'Start encoding', Icon: 'lock' }, 'Button'); recolor(b1.children[0], 'accent-fg');
  const b2 = inst('Button', 'Type=Secondary'); actions.appendChild(b2); setProps(b2, { Label: 'Learn first', Icon: 'book-open' }, 'Button'); recolor(b2.children[0], 'text');
  hero.appendChild(spacer(40));
  const stats = AL('HORIZONTAL', { gap: mobile ? 16 : 24, center: true, name: 'Stats' }); hero.appendChild(stats);
  [['27', 'Algorithms'], ['5', 'Categories'], ['0', 'Data stored']].forEach(([v, l], i) => {
    if (i) { const d = figma.createRectangle(); d.name = 'Divider'; d.resize(1, 32); d.fills = [P('border')]; stats.appendChild(d); }
    const s = COMP['Stat'].createInstance(); stats.appendChild(s); setProps(s, { Value: v, Label: l }, 'Stat'); });
  page.appendChild(spacer(48));
  page.appendChild(await T('Explore by category', 'Heading/H2 Section', 'text', 'Section title')); page.appendChild(spacer(20));
  const catCols = mobile ? 1 : Math.floor((cw + 16) / 216), catW = (cw - 16 * (catCols - 1)) / catCols, cg = grid(page, cw); cg.name = 'Category grid'; const cats = [];
  for (const [n] of CATEGORIES) { const c = inst('Category Card', `Category=${n}`); cg.appendChild(c); c.resize(catW, c.height); cats.push(c); }
  equalizeRows(cats, catCols);
  page.appendChild(spacer(48));
  page.appendChild(await T('What you can do', 'Heading/H2 Section', 'text', 'Section title')); page.appendChild(spacer(20));
  const fCols = mobile ? 1 : Math.floor((cw + 16) / 236), fW = (cw - 16 * (fCols - 1)) / fCols, fg = grid(page, cw); fg.name = 'Feature grid'; const feats = [];
  for (const [ic, t, d, cta] of FEATURES) { const c = COMP['Feature Card'].createInstance(); fg.appendChild(c); setProps(c, { Title: t, Description: d, CTA: cta, Icon: ic }, 'Feature Card'); recolor(c.findOne(n => n.name === 'Icon wrap').children[0], 'blue'); c.resize(fW, c.height); feats.push(c); }
  equalizeRows(feats, fCols);
  page.appendChild(spacer(48));
  if (dark) await darkify(f);
  return f;
}

// state: 'result' | 'file' | 'error'
async function buildCodec(name, { mode = 'encode', state = 'result', mobile = false, dark = false } = {}) {
  const enc = mode === 'encode', file = state === 'file';
  const f = screenFrame(name, mobile ? 375 : 1440, mobile); addChrome(f, enc ? 'Encode' : 'Decode', mobile);
  const { page, cw } = pageFrame(f, 1200, mobile);
  await pageHeader(page, enc ? 'lock' : 'lock-open', enc ? 'Encode & Encrypt' : 'Decode & Decrypt', enc ? 'Transform text or a file with any supported algorithm.' : 'Reverse an encoding, or decrypt ciphertext with the right key.', cw);
  const layout = AL(mobile ? 'VERTICAL' : 'HORIZONTAL', { gap: 24, name: 'Codec layout' }); page.appendChild(layout); fixW(layout, cw);
  const selected = file ? 'SHA-256' : 'AES-256-GCM', sel = ALGOS.find(a => a[0] === selected);

  // Algorithm panel
  const panel = AL('VERTICAL', { name: 'Algorithm panel' }); layout.appendChild(panel); panel.fills = [P('surface')]; stroke(panel); rad(panel, 'radius/md'); panel.clipsContent = true;
  if (mobile) panel.layoutSizingHorizontal = 'FILL'; else fixW(panel, 260);
  const filters = AL('HORIZONTAL', { gap: 4, pad: 12, name: 'Filters' }); filters.layoutWrap = 'WRAP'; filters.counterAxisSpacing = 4; sideStroke(filters, 'Bottom', P('border')); panel.appendChild(filters); filters.layoutSizingHorizontal = 'FILL';
  CHIPS.forEach((c, i) => { const ch = inst('Filter Chip', i === 0 ? 'State=Active' : 'State=Default'); filters.appendChild(ch); setProps(ch, { Label: c }, 'Filter Chip'); });
  const list = AL('VERTICAL', { pad: 8, name: 'Algorithm list' }); list.resize(100, mobile ? 240 : 520); list.primaryAxisSizingMode = 'FIXED'; list.clipsContent = true; panel.appendChild(list); list.layoutSizingHorizontal = 'FILL';
  for (const [n, cat] of ALGOS) { const oneWay = cat === 'hashing'; const st = n === selected ? 'State=Active' : (oneWay && !enc ? 'State=Disabled' : 'State=Default');
    const it = inst('Algorithm Item', st); list.appendChild(it); it.layoutSizingHorizontal = 'FILL'; setProps(it, { Name: n, Category: cat, 'One-way': oneWay }, 'Algorithm Item'); it.name = n; }

  // Workspace
  const ws = AL('VERTICAL', { gap: 16, name: 'Workspace' }); layout.appendChild(ws); ws.layoutSizingHorizontal = 'FILL';
  const add = n => { ws.appendChild(n); if (n.type !== 'TEXT' && !(n.name === 'Input tabs')) n.layoutSizingHorizontal = 'FILL'; return n; };
  const bar = AL('HORIZONTAL', { gap: 12, pad: [12, 16], center: true, name: 'Algorithm badge bar' }); bar.fills = [P('surface')]; stroke(bar); rad(bar, 'radius/sm'); add(bar); if (mobile) { bar.layoutWrap = 'WRAP'; bar.counterAxisSpacing = 8; }
  const bn = await T(sel[0], 'Title/Card', 'text', 'Algorithm name'); bn.fontSize = 12.75; bar.appendChild(bn);
  const bd = await T(sel[2], 'Body/Small', 'text-2', 'Algorithm description'); bd.fontSize = 12; bar.appendChild(bd); if (!mobile) fillText(bd); else wrapText(bd, cw - 32);
  bar.appendChild(inst('Backend Badge', file ? 'Mode=In-browser' : 'Mode=Server'));
  if (enc) { const tabs = AL('HORIZONTAL', { pad: 4, name: 'Input tabs' }); tabs.fills = [P('surface')]; stroke(tabs); rad(tabs, 'radius/sm'); ws.appendChild(tabs);
    const t1 = inst('Tab', file ? 'State=Default' : 'State=Active'); tabs.appendChild(t1); setProps(t1, { Label: '✏️ Text' }, 'Tab');
    const t2 = inst('Tab', file ? 'State=Active' : 'State=Default'); tabs.appendChild(t2); setProps(t2, { Label: '📁 File' }, 'Tab'); }
  if (file) add(inst('Dropzone', 'State=Has file'));
  else { const ta = add(inst('Input / Text Area', 'State=Filled')); setProps(ta, { Value: enc ? SAMPLE.plain : SAMPLE.cipher }, 'Input / Text Area');
    const ks = AL('VERTICAL', { gap: 12, pad: 16, name: 'Key section' }); ks.fills = [P('surface')]; stroke(ks); rad(ks, 'radius/sm'); add(ks);
    const kr = AL('HORIZONTAL', { gap: 10, center: true, name: 'Key row' }); ks.appendChild(kr); kr.layoutSizingHorizontal = 'FILL';
    const kl = await T('Passphrase', 'Label/Small', 'text-2', 'Key label'); kl.fontSize = 11.7; kr.appendChild(kl);
    const kf = inst('Input / Key Field', 'State=Filled'); kr.appendChild(kf); kf.layoutSizingHorizontal = 'FILL'; setProps(kf, { Value: SAMPLE.key }, 'Input / Key Field');
    const gb = COMP['Utility Button'].createInstance(); kr.appendChild(gb); }
  const run = add(inst('Run Button', 'State=Default')); setProps(run, { Label: enc ? 'Encode / Encrypt' : 'Decode / Decrypt', Icon: enc ? 'lock' : 'lock-open' }, 'Run Button'); recolor(run.children[0], 'white');
  if (file || mobile) run.findOne(n => n.name === 'Shortcut').visible = false;
  if (state === 'error') { const e = add(inst('Info Box', 'Type=Error')); setProps(e, { Message: 'Decryption failed — wrong key or tampered ciphertext.' }, 'Info Box'); }
  else {
    const out = file ? SAMPLE.digest : (enc ? SAMPLE.cipher : SAMPLE.plain), where = file ? 'browser' : 'server';
    const box = AL('VERTICAL', { name: 'Result' }); box.fills = [P('surface')]; stroke(box); rad(box, 'radius/sm'); box.clipsContent = true; add(box);
    const hd = AL('HORIZONTAL', { gap: 12, pad: [12, 16], center: true, name: 'Result header' }); hd.primaryAxisAlignItems = 'SPACE_BETWEEN'; hd.fills = [P('surface-2')]; sideStroke(hd, 'Bottom', P('border')); box.appendChild(hd); hd.layoutSizingHorizontal = 'FILL'; hd.layoutWrap = 'WRAP'; hd.counterAxisSpacing = 8;
    const meta = AL('HORIZONTAL', { gap: 12, center: true, name: 'Meta' }); hd.appendChild(meta);
    const rt = await T('Result', 'Label/Small', 'text'); rt.fontName = { family: 'Syne', style: 'Bold' }; meta.appendChild(rt);
    const wh = AL('HORIZONTAL', { gap: 4, center: true, name: 'Where' }); wh.appendChild(icon(where === 'browser' ? 'cpu' : 'server', 12, 'text-3')); const wt = await T(where === 'browser' ? 'in your browser' : 'on the server', 'Label/Tiny', 'text-3'); wt.fontSize = 10.8; wh.appendChild(wt); meta.appendChild(wh);
    const ct = await T(`${out.length} chars`, 'Label/Tiny', 'text-3'); ct.fontSize = 10.8; meta.appendChild(ct);
    const acts = AL('HORIZONTAL', { gap: 8, name: 'Actions' }); hd.appendChild(acts);
    const btns = [['Copy', 'copy', 'Style=Default'], ['Save', 'download', 'Style=Default']]; if (enc && !file) btns.push(['Decode it', 'arrow-right', 'Style=Accent']);
    for (const [l, ic, v] of btns) { const b = inst('Icon Button', v); acts.appendChild(b); setProps(b, { Label: l, Icon: ic }, 'Icon Button'); recolor(b.findAll(n => n.type === 'INSTANCE')[0], v === 'Style=Accent' ? 'white' : 'text'); }
    const body = AL('VERTICAL', { pad: 16, name: 'Result text' }); box.appendChild(body); body.layoutSizingHorizontal = 'FILL';
    const rtext = await T(out, 'Mono/Small', 'text', 'Output'); body.appendChild(rtext); fillText(rtext);
  }
  page.appendChild(spacer(24));
  if (dark) await darkify(f);
  return f;
}

async function openLesson(item, stepsTitle) {
  const box = AL('VERTICAL', { name: `Accordion Item / Open — ${item.name}` }); box.fills = [P('surface')]; stroke(box); rad(box, 'radius/sm'); box.clipsContent = true; box.effects = [SHADOW];
  const head = AL('HORIZONTAL', { pad: [14, 18], center: true, name: 'Header' }); head.primaryAxisAlignItems = 'SPACE_BETWEEN'; head.appendChild(await T(item.name, 'Title/Accordion', 'text', 'Title')); head.appendChild(icon('chevron-down', 16)); box.appendChild(head);
  const body = AL('VERTICAL', { gap: 16, pad: [20, 20, 24, 20], name: 'Body' }); sideStroke(body, 'Top', P('border')); box.appendChild(body);
  return { box, head, body, async fill() {
    head.layoutSizingHorizontal = 'FILL'; body.layoutSizingHorizontal = 'FILL';
    const add = n => { body.appendChild(n); if (n.type === 'TEXT') fillText(n); else n.layoutSizingHorizontal = 'FILL'; return n; };
    const ov = add(await T(item.overview, 'Body/Default', 'text-2', 'Overview')); ov.fontSize = 13.5; ov.lineHeight = { unit: 'PERCENT', value: 170 };
    const block = async title => { const b = AL('VERTICAL', { gap: 8, name: title }); add(b); const h = await T(title, 'Overline/Default', 'text-3', 'Heading'); h.fontName = { family: 'Syne', style: 'Bold' }; h.fontSize = 11.7; h.letterSpacing = { unit: 'PERCENT', value: 6 }; b.appendChild(h); return b; };
    const steps = await block(stepsTitle); const ol = AL('VERTICAL', { gap: 6, pad: [0, 0, 0, 20], name: 'Steps' }); steps.appendChild(ol); ol.layoutSizingHorizontal = 'FILL';
    for (const [i, s] of item.how.entries()) { const t = await T(`${i + 1}.  ${s}`, 'Body/Small', 'text-2'); t.fontSize = 12.75; ol.appendChild(t); fillText(t); }
    if (item.tip) { const tb = AL('HORIZONTAL', { pad: [12, 16], name: 'Tip' }); tb.fills = [P('blue', 0.1)]; stroke(tb, 'blue', 1, 0.25); rad(tb, 'radius/sm'); add(tb);
      const t = await T(`💡 Tip: ${item.tip}`, 'Body/Small', 'text-2'); t.fontSize = 12.45; tb.appendChild(t); fillText(t); const s = t.characters.indexOf('Tip:'); t.setRangeFontName(s, s + 4, { family: 'Syne', style: 'Bold' }); }
    const ex = await block('Example'); const exBox = AL('VERTICAL', { gap: 8, pad: [14, 16], name: 'Example box' }); exBox.fills = [P('surface-2')]; stroke(exBox); rad(exBox, 'radius/sm'); ex.appendChild(exBox); exBox.layoutSizingHorizontal = 'FILL';
    for (const [l, v] of [['Input', item.example[0]], ['Output', item.example[1]]]) { const r = AL('HORIZONTAL', { gap: 10, center: true, name: l }); exBox.appendChild(r);
      const lt = await T(l, 'Overline/Default', 'text-3'); lt.fontName = { family: 'Syne', style: 'Bold' }; lt.fontSize = 10.8; lt.letterSpacing = { unit: 'PERCENT', value: 4 }; lt.textAutoResize = 'HEIGHT'; lt.resize(52, lt.height); r.appendChild(lt);
      const code = AL('HORIZONTAL', { pad: [3, 8], name: 'Code' }); code.fills = [P('surface')]; stroke(code); code.cornerRadius = 5; code.appendChild(await T(v, 'Mono/Small', 'text')); r.appendChild(code); }
    if (item.useCases) { const uc = await block('Common use cases'); const w = AL('HORIZONTAL', { gap: 6, name: 'Use cases' }); w.layoutWrap = 'WRAP'; w.counterAxisSpacing = 6; uc.appendChild(w); w.layoutSizingHorizontal = 'FILL';
      for (const u of item.useCases) { const t = inst('Tag'); w.appendChild(t); setProps(t, { Label: u }, 'Tag'); } }
    if (item.pitfalls) { const pf = await block('Common pitfalls'); for (const p of item.pitfalls) { const t = await T(`⚠️ ${p}`, 'Body/Small', 'text-2'); t.fontSize = 12.45; pf.appendChild(t); fillText(t); } }
    const tb = COMP['Utility Button'].createInstance(); body.appendChild(tb); setProps(tb, { Label: 'Try it in the playground', Icon: 'play' }, 'Utility Button'); recolor(tb.children[0], 'text');
  } };
}

async function buildLearn(name, kind) {
  const L = LESSONS[kind];
  const f = screenFrame(name, 1440, false); addChrome(f, L.title, false);
  const { page, cw } = pageFrame(f, 860, false);
  await pageHeader(page, L.icon, L.title, L.subtitle, cw);
  const content = AL('VERTICAL', { gap: 32, name: 'Lessons' }); page.appendChild(content); fixW(content, cw);
  let first = true;
  for (const [title, col, items] of L.sections) {
    const sec = AL('VERTICAL', { gap: 16, name: title }); content.appendChild(sec); sec.layoutSizingHorizontal = 'FILL';
    const hd = AL('HORIZONTAL', { gap: 12, center: true, name: 'Section header' }); const dot = figma.createEllipse(); dot.name = 'Dot'; dot.resize(12, 12); dot.fills = [P(col)]; hd.appendChild(dot); hd.appendChild(await T(title, 'Heading/H3 Lesson group')); sec.appendChild(hd);
    const acc = AL('VERTICAL', { gap: 6, name: 'Accordion' }); sec.appendChild(acc); acc.layoutSizingHorizontal = 'FILL';
    for (const it of items) {
      if (first) { const o = await openLesson(L.open, L.stepsTitle); acc.appendChild(o.box); o.box.layoutSizingHorizontal = 'FILL'; await o.fill(); first = false; continue; }
      const a = COMP['Accordion Item'].createInstance(); acc.appendChild(a); a.layoutSizingHorizontal = 'FILL'; setProps(a, { Title: it }, 'Accordion Item');
    }
  }
  page.appendChild(spacer(24));
  return f;
}

async function ensureNotesPage() {
  const page = PAGES[PAGE_NOTES]; await figma.setCurrentPageAsync(page);
  if (page.children.find(n => n.name === 'How to use this file')) return;
  const f = AL('VERTICAL', { name: 'How to use this file', gap: 14, pad: 32 }); f.fills = [P('#fff8db')]; f.cornerRadius = 12; fixW(f, 640); page.appendChild(f);
  f.appendChild(await T('How to hand changes back to Claude', 'Heading/H2 Section'));
  for (const line of [
    '1. Edit the screens on "🖥 Screens" directly: move, restyle, recolour, rewrite copy, add or delete things.',
    '2. Change a component on "🎨 Design System" to update it everywhere it is used.',
    '3. Change a colour by editing the variables (Local variables panel). Light and Dark are separate collections.',
    '4. If something is easier to describe than to draw, write it in the Notes box below.',
    '5. Run Plugins → Development → CryptoForge Design Sync → "Export design for Claude", save cryptoforge-design.json into the cryptoforge/design folder, and tell Claude it is there.',
  ]) { const t = await T(line, 'Body/Small', 'text'); f.appendChild(t); fillText(t); }
  const n = AL('VERTICAL', { name: 'Notes', gap: 8, pad: 24 }); n.fills = [P('#ffffff')]; stroke(n); n.cornerRadius = 12; fixW(n, 640); n.y = f.height + 40; page.appendChild(n);
  n.appendChild(await T('Notes for Claude', 'Heading/H2 Section'));
  const t = await T('(Write requests here, e.g. "make the sidebar collapsible" or "use a bigger result box".)', 'Body/Small', 'text-3'); n.appendChild(t); fillText(t);
}

async function ensureScreens() {
  const page = PAGES[PAGE_SCREENS]; await figma.setCurrentPageAsync(page);
  const rows = [
    ['Desktop — Light', [
      ['Home', () => buildHome('Home')],
      ['Encode — Result', () => buildCodec('Encode — Result', { mode: 'encode' })],
      ['Encode — File mode', () => buildCodec('Encode — File mode', { mode: 'encode', state: 'file' })],
      ['Decode — Result', () => buildCodec('Decode — Result', { mode: 'decode' })],
      ['Decode — Wrong key', () => buildCodec('Decode — Wrong key', { mode: 'decode', state: 'error' })],
    ]],
    ['Lessons', [
      ['Learn to Encode', () => buildLearn('Learn to Encode', 'encode')],
      ['Learn to Decode', () => buildLearn('Learn to Decode', 'decode')],
    ]],
    ['Desktop — Dark', [
      ['Home — Dark', () => buildHome('Home — Dark', { dark: true })],
      ['Encode — Result — Dark', () => buildCodec('Encode — Result — Dark', { mode: 'encode', dark: true })],
    ]],
    ['Mobile (375)', [
      ['Home — Mobile', () => buildHome('Home — Mobile', { mobile: true })],
      ['Encode — Mobile', () => buildCodec('Encode — Mobile', { mode: 'encode', mobile: true })],
    ]],
  ];
  let y = 0;
  for (const [label, screens] of rows) {
    let lt = page.children.find(n => n.type === 'TEXT' && n.name === `Row: ${label}`);
    if (!lt) { lt = await T(label, 'Heading/H1', '#1a1917', `Row: ${label}`); lt.fontSize = 48; page.appendChild(lt); }
    lt.x = 0; lt.y = y; y += 100;
    let x = 0, rowH = 0;
    for (const [name, build] of screens) {
      let fr = page.children.find(n => n.name === name);
      if (!fr) { figma.notify(`Building ${name}…`, { timeout: 1500 }); fr = await build(); page.appendChild(fr); }
      fr.x = x; fr.y = y; x += fr.width + 120; rowH = Math.max(rowH, fr.height);
    }
    y += rowH + 200;
  }
}

async function build() {
  await ensurePages();
  await ensureVariables();
  await ensureTextStyles();
  const ds = PAGES[PAGE_DS]; await figma.setCurrentPageAsync(ds);
  figma.notify('Design system…', { timeout: 1500 });
  ensureIcons(ds);
  await ensureComponents(ds);
  await ensureFoundationsBoard(ds);
  await ensureScreens();
  await ensureNotesPage();
  await figma.setCurrentPageAsync(PAGES[PAGE_SCREENS]);
  figma.viewport.scrollAndZoomIntoView(PAGES[PAGE_SCREENS].children);
}

// ─── Export ────────────────────────────────────────────────────────────────────────────────────
async function exportDesign() {
  figma.showUI(__html__, { width: 380, height: 170 });
  const status = text => figma.ui.postMessage({ type: 'status', text });
  const VARNAME = {}, variables = {};
  for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
    variables[c.name] = {};
    for (const id of c.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); VARNAME[id] = `${c.name}:${v.name}`; const val = v.valuesByMode[c.modes[0].modeId]; variables[c.name][v.name] = typeof val === 'object' && 'r' in val ? toHex(val) : val; }
  }
  const styleNames = {}; const textStyles = {};
  for (const s of await figma.getLocalTextStylesAsync()) { styleNames[s.id] = s.name; textStyles[s.name] = { font: `${s.fontName.family} ${s.fontName.style}`, size: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, case: s.textCase }; }
  const r2 = n => Math.round(n * 100) / 100;
  const paintOut = p => { const o = { type: p.type }; if (p.type === 'SOLID') { o.color = toHex(p.color); const v = p.boundVariables && p.boundVariables.color; if (v) o.var = VARNAME[v.id] || v.id; } else if (p.gradientStops) o.stops = p.gradientStops.map(s => toHex(s.color)); if (p.opacity !== undefined && p.opacity !== 1) o.opacity = r2(p.opacity); if (p.visible === false) o.hidden = true; return o; };
  const paints = ps => ps === figma.mixed ? 'mixed' : ps.map(paintOut);
  async function ser(n) {
    const o = { type: n.type, name: n.name, w: Math.round(n.width), h: Math.round(n.height) };
    const inFlow = n.parent && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE' && n.layoutPositioning !== 'ABSOLUTE';
    if (!inFlow) { o.x = Math.round(n.x); o.y = Math.round(n.y); }
    if (n.visible === false) o.hidden = true;
    if ('opacity' in n && n.opacity !== 1) o.opacity = r2(n.opacity);
    if ('layoutMode' in n && n.layoutMode !== 'NONE') o.layout = { dir: n.layoutMode, gap: n.itemSpacing, pad: [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft], main: n.primaryAxisAlignItems, cross: n.counterAxisAlignItems, wrap: n.layoutWrap === 'WRAP' || undefined };
    if (inFlow && 'layoutSizingHorizontal' in n) o.sizing = [n.layoutSizingHorizontal, n.layoutSizingVertical];
    if ('fills' in n && (n.fills === figma.mixed || n.fills.length)) o.fills = paints(n.fills);
    if ('strokes' in n && n.strokes.length) { o.strokes = paints(n.strokes); o.strokeWeight = n.strokeWeight === figma.mixed ? [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight] : n.strokeWeight; if (n.dashPattern && n.dashPattern.length) o.dash = n.dashPattern; }
    if ('cornerRadius' in n && n.cornerRadius !== 0) o.radius = n.cornerRadius === figma.mixed ? [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius] : n.cornerRadius;
    if ('effects' in n && n.effects.length) o.effects = n.effects.map(e => ({ type: e.type, radius: e.radius, offset: e.offset, color: e.color && `${toHex(e.color)}@${r2(e.color.a)}` }));
    if (n.type === 'TEXT') {
      o.text = n.characters;
      if (typeof n.textStyleId === 'string' && n.textStyleId) o.style = styleNames[n.textStyleId] || n.textStyleId;
      o.font = n.fontName === figma.mixed ? 'mixed' : `${n.fontName.family} ${n.fontName.style}`; o.size = n.fontSize === figma.mixed ? 'mixed' : n.fontSize;
      if (n.fills === figma.mixed) o.fillRuns = n.getStyledTextSegments(['fills']).map(s => ({ text: s.characters, fills: s.fills.map(paintOut) }));
      return o;
    }
    if (n.type === 'INSTANCE') {
      const mc = await n.getMainComponentAsync();
      o.component = mc ? (mc.parent && mc.parent.type === 'COMPONENT_SET' ? `${mc.parent.name} [${mc.name}]` : mc.name) : null;
      o.props = {};
      for (const [k, v] of Object.entries(n.componentProperties)) { let val = v.value; if (v.type === 'INSTANCE_SWAP') { const sw = await figma.getNodeByIdAsync(val); val = sw ? sw.name : val; } if (v.type !== 'VARIANT') o.props[k.split('#')[0]] = val; }
      const ovs = [];
      for (const ov of n.overrides) {
        const t = await figma.getNodeByIdAsync(ov.id); if (!t) continue;
        const e = { node: t.name, fields: ov.overriddenFields };
        if (ov.overriddenFields.includes('characters') && t.type === 'TEXT') e.text = t.characters;
        if (ov.overriddenFields.includes('fills') && 'fills' in t) e.fills = paints(t.fills);
        if (ov.overriddenFields.includes('visible')) e.visible = t.visible;
        ovs.push(e);
      }
      if (ovs.length) o.overrides = ovs;
      return o;
    }
    if ('children' in n) { o.children = []; for (const c of n.children) o.children.push(await ser(c)); }
    return o;
  }
  const data = { exportedAt: new Date().toISOString(), file: figma.root.name, variables, textStyles, pages: {} };
  for (const page of figma.root.children) {
    await figma.setCurrentPageAsync(page);
    status(`Reading ${page.name}…`);
    const isScreens = page.name === PAGE_SCREENS;
    const nodes = [], shots = {};
    for (const n of page.children) {
      if (n.name === 'Icons' || n.name === 'Foundations') { nodes.push({ type: n.type, name: n.name, note: 'omitted (see variables / textStyles)' }); continue; }
      nodes.push(await ser(n));
      if (isScreens && n.type === 'FRAME') { status(`Rendering ${n.name}…`); shots[n.name] = figma.base64Encode(await n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } })); }
    }
    data.pages[page.name] = { nodes };
    if (isScreens) data.screenshots = shots;
  }
  figma.ui.postMessage({ type: 'data', json: JSON.stringify(data) });
  figma.ui.onmessage = m => { if (m.type === 'close') figma.closePlugin(); };
}

// ─── Entry ─────────────────────────────────────────────────────────────────────────────────────
(async () => {
  try {
    if (figma.command === 'export') { await exportDesign(); return; }
    await build();
    figma.closePlugin('✅ CryptoForge design is ready — see the 🖥 Screens page');
  } catch (e) {
    console.error(e);
    figma.closePlugin(`❌ ${e && e.message ? e.message : e}`);
  }
})();
