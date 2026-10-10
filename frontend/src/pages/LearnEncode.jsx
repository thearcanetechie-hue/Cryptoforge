import { BookOpen } from 'lucide-react';
import Lessons from '../components/Lessons';

const lessons = [
  {
    category: '💻 Encoding Schemes',
    color: '#22c55e',
    items: [
      {
        name: 'Base64',
        algo: 'base64', tryText: 'Man',
        overview: 'Base64 represents arbitrary bytes using 64 printable ASCII characters. It is an encoding, not encryption — anyone can reverse it.',
        how: [
          'Convert the text to bytes (CryptoForge uses UTF-8).',
          'Take 3 bytes (24 bits) at a time and split them into four 6-bit groups.',
          'Map each 6-bit value to A–Z, a–z, 0–9, + or /.',
          'Pad with = when the input length is not a multiple of 3.',
        ],
        example: { input: 'Man', output: 'TWFu' },
        useCases: ['Email attachments (MIME)', 'Data URIs', 'JWT tokens', 'HTTP Basic Auth'],
      },
      {
        name: 'Hexadecimal',
        algo: 'hex', tryText: 'Hi',
        overview: 'Writes each byte as two base-16 digits (0–9, a–f). Compact, unambiguous and easy to read in debuggers.',
        how: ['Convert the text to UTF-8 bytes.', 'Write each byte as two hex digits: high nibble, then low nibble.', 'Concatenate the pairs.'],
        example: { input: 'Hi', output: '4869' },
        useCases: ['Hash digests', 'Memory dumps', 'CSS colours (#FF5733)', 'Network protocol traces'],
      },
      {
        name: 'Binary',
        algo: 'binary', tryText: 'A',
        overview: 'Shows each byte as eight 0s and 1s — exactly what is stored in memory.',
        how: ['Convert the text to UTF-8 bytes.', 'Write each byte as an 8-bit binary number.', 'Characters outside ASCII take several bytes: é becomes 11000011 10101001.'],
        example: { input: 'A', output: '01000001' },
        useCases: ['Teaching fundamentals', 'Low-level debugging', 'Bitwise operations'],
      },
      {
        name: 'URL Encoding',
        algo: 'url', tryText: 'hello world & more',
        overview: 'Percent-encoding makes text safe to place in a URL by replacing reserved characters.',
        how: ['Leave letters, digits and - _ . ~ unchanged.', 'Convert every other character to UTF-8 bytes.', 'Write each byte as % followed by two hex digits.'],
        example: { input: 'hello world', output: 'hello%20world' },
        useCases: ['Query strings', 'Form submissions', 'REST API path parameters'],
      },
      {
        name: 'HTML Entities',
        algo: 'html', tryText: '<script>alert("hi")</script>',
        overview: 'Escapes characters that have special meaning in HTML so they display as text instead of being parsed as markup.',
        how: ['Find the reserved characters < > & " \'.', 'Replace each with its entity, e.g. < → &lt;.'],
        example: { input: '<b>', output: '&lt;b&gt;' },
        useCases: ['Preventing XSS', 'Showing code samples on web pages'],
      },
    ],
  },
  {
    category: '🔒 Symmetric Encryption',
    color: '#4f9cf9',
    items: [
      {
        name: 'AES-256-GCM',
        algo: 'aes', tryText: 'Meet me at noon',
        overview: 'AES is the worldwide standard symmetric cipher. GCM mode adds authentication, so any change to the ciphertext — or a wrong key — is detected instead of producing garbage.',
        how: [
          'Generate a random 16-byte salt and stretch your passphrase into a 256-bit key with PBKDF2-SHA256 (600,000 iterations).',
          'Generate a random 12-byte nonce. Never reuse a nonce with the same key.',
          'Encrypt with AES in counter mode and compute a 16-byte authentication tag.',
          'Output Base64(salt ‖ nonce ‖ ciphertext ‖ tag).',
        ],
        example: { input: 'Secret message + passphrase', output: 'Different Base64 every time (random salt and nonce)' },
        useCases: ['HTTPS/TLS 1.3', 'Disk and file encryption', 'VPNs', 'Encrypted messaging'],
      },
      {
        name: 'Fernet',
        algo: 'fernet', tryText: 'My secret',
        overview: 'A high-level recipe from Python\'s cryptography library that bundles encryption, a timestamp and an HMAC into one token.',
        how: ['Split a random 32-byte key into a signing key and an encryption key.', 'Encrypt with AES-128-CBC using a random IV.', 'Sign version, timestamp, IV and ciphertext with HMAC-SHA256.', 'Encode the token as URL-safe Base64.'],
        example: { input: 'My secret', output: 'gAAAAAB…' },
        useCases: ['Application secrets', 'Encrypted cookies and tokens', 'Config file encryption'],
      },
      {
        name: 'Triple DES (legacy)',
        algo: '3des', tryText: 'Hello',
        overview: 'Runs the 1970s DES cipher three times per block. Retired by NIST in 2023 — included here so you can see what came before AES.',
        how: ['Encrypt with key 1, decrypt with key 2, encrypt with key 3.', '64-bit blocks make it vulnerable to the Sweet32 attack on large data.', 'Effective security is about 112 bits.'],
        example: { input: 'Hello', output: 'Base64 ciphertext' },
        useCases: ['Legacy banking systems', 'Older payment hardware'],
      },
    ],
  },
  {
    category: '🔑 Asymmetric Encryption',
    color: '#a855f7',
    items: [
      {
        name: 'RSA-2048 with OAEP',
        algo: 'rsa', tryText: 'Hello',
        overview: 'Uses a key pair: anyone with the public key can encrypt, only the private key holder can decrypt.',
        how: [
          'Pick two large primes p and q and compute n = p × q.',
          'Choose the public exponent e = 65537 and compute the private exponent d.',
          'Pad the message with OAEP (SHA-256) to make encryption randomised.',
          'Encrypt: c = mᵉ mod n. Decrypt: m = cᵈ mod n.',
        ],
        tip: 'RSA can only encrypt a message smaller than the key (190 bytes here). Real systems encrypt a random AES key with RSA, then the data with AES.',
        example: { input: 'Hello + public key', output: '344-character Base64 ciphertext' },
        useCases: ['TLS key exchange (historically)', 'SSH keys', 'PGP email', 'Digital signatures'],
      },
    ],
  },
  {
    category: '📜 Classical Ciphers',
    color: '#eab308',
    items: [
      {
        name: 'Caesar Cipher',
        algo: 'caesar', tryText: 'HELLO',
        overview: 'Shifts every letter a fixed number of places. Julius Caesar reportedly used a shift of 3.',
        how: ['Choose a shift (e.g. 3).', 'Move each letter forward by the shift, wrapping Z back to A.', 'Leave digits, spaces and punctuation unchanged.'],
        example: { input: 'HELLO (shift 3)', output: 'KHOOR' },
        useCases: ['Teaching', 'Puzzles', 'ROT13 spoiler hiding'],
      },
      {
        name: 'Vigenère Cipher',
        algo: 'vigenere', tryText: 'HELLO',
        overview: 'Uses a keyword to apply a different Caesar shift to each letter, which defeats simple frequency analysis.',
        how: ['Repeat the keyword under the message.', 'Shift each letter by its keyword letter (A = 0, B = 1, …).', 'Skip non-letters without advancing the keyword.'],
        example: { input: 'HELLO, keyword KEY', output: 'RIJVS' },
        useCases: ['Historical diplomatic ciphers', 'Introduction to polyalphabetic ciphers'],
      },
      {
        name: 'Morse Code',
        algo: 'morse', tryText: 'SOS',
        overview: 'Represents letters as sequences of short and long signals.',
        how: ['Look up each character in the Morse table.', 'Separate letters with a space and words with /.'],
        example: { input: 'SOS', output: '... --- ...' },
        useCases: ['Emergency signalling', 'Amateur radio', 'Aviation beacons'],
      },
    ],
  },
  {
    category: '#️⃣ Hash Functions',
    color: '#f97316',
    items: [
      {
        name: 'SHA-256 / SHA-512',
        algo: 'sha256', tryText: 'hello',
        overview: 'One-way functions that turn any input into a fixed-size fingerprint. Changing one bit of input changes about half the output bits.',
        how: ['Pad the input to a multiple of the block size.', 'Mix each block into the state through 64 (SHA-256) or 80 (SHA-512) rounds of bitwise operations.', 'Output the final state as hex: 64 or 128 characters.'],
        example: { input: 'hello', output: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824' },
        tip: 'Hash a file in File mode to verify a download against a published checksum.',
        useCases: ['File integrity checks', 'Digital signatures', 'Git commits', 'Blockchains'],
      },
      {
        name: 'MD5 (broken)',
        algo: 'md5', tryText: 'hello',
        overview: 'A fast 128-bit hash. Collisions can be generated in seconds, so it must not be used for security.',
        how: ['Process 512-bit blocks through 4 rounds of 16 operations.'],
        example: { input: 'hello', output: '5d41402abc4b2a76b9719d911017c592' },
        tip: 'For passwords, use a slow, salted algorithm such as Argon2 or bcrypt — never a plain hash.',
        useCases: ['Non-security checksums', 'Legacy systems'],
      },
    ],
  },
];

export default function LearnEncode() {
  return (
    <Lessons
      icon={BookOpen}
      title="Learn to Encode"
      subtitle="How each encoding and encryption technique works, where it is used, and when to choose it."
      lessons={lessons}
      stepsTitle="How it works"
      tryMode="encode"
    />
  );
}
