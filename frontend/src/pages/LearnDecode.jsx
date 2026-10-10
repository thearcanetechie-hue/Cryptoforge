import { Unlock } from 'lucide-react';
import Lessons from '../components/Lessons';

const lessons = [
  {
    category: '💻 Decoding Encodings',
    color: '#22c55e',
    items: [
      {
        name: 'Decoding Base64',
        algo: 'base64', tryText: 'SGVsbG8=',
        overview: 'Every 4 Base64 characters map back to 3 bytes. Trailing = signs tell you how much padding was added.',
        how: ['Map each character back to its 6-bit value.', 'Join groups of four 6-bit values into three bytes.', 'Drop the padding bytes.', 'Interpret the bytes as UTF-8 text (or as a file).'],
        tip: 'A length that is a multiple of 4 and a trailing = or == are strong hints that text is Base64.',
        example: { input: 'SGVsbG8=', output: 'Hello' },
        pitfalls: ['URL-safe Base64 uses - and _ instead of + and /.', 'Decoded bytes may be binary data, not text.'],
      },
      {
        name: 'Decoding Hexadecimal',
        algo: 'hex', tryText: '48656c6c6f',
        overview: 'Read the string two characters at a time; each pair is one byte.',
        how: ['Take a pair such as 48.', 'Convert from base 16: 4 × 16 + 8 = 72.', 'Collect all bytes and decode them as UTF-8: 72 → H.'],
        tip: 'Valid hex always has an even number of digits.',
        example: { input: '48656c6c6f', output: 'Hello' },
        pitfalls: ['Spaces and line breaks in hex dumps must be ignored (CryptoForge does this for you).'],
      },
      {
        name: 'Decoding Binary',
        algo: 'binary', tryText: '01001000 01101001',
        overview: 'Each group of 8 bits is one byte. Convert each group from base 2, then decode the bytes as UTF-8.',
        how: ['Split the input into 8-bit groups.', 'Convert each group: 01001000 → 72.', 'Decode the bytes as UTF-8: 72 → H.'],
        example: { input: '01001000 01101001', output: 'Hi' },
        pitfalls: ['A missing bit shifts every following byte.', 'Non-ASCII characters span multiple bytes.'],
      },
      {
        name: 'URL Decoding',
        algo: 'url', tryText: 'hello%20world%21',
        overview: 'Turns %XX sequences back into the bytes they represent.',
        how: ['Find each % sign.', 'Read the next two hex digits as a byte.', 'Decode the resulting bytes as UTF-8.'],
        example: { input: 'hello%20world%21', output: 'hello world!' },
        pitfalls: ['In form data, + means a space; in URL paths it is a literal +.'],
      },
    ],
  },
  {
    category: '🔒 Decrypting Symmetric Ciphers',
    color: '#4f9cf9',
    items: [
      {
        name: 'Decrypting AES-GCM',
        overview: 'Decryption needs the exact same passphrase. GCM verifies the authentication tag before releasing any plaintext.',
        how: [
          'Base64-decode the input and split it into salt (16 bytes), nonce (12 bytes) and ciphertext + tag.',
          'Re-derive the key from your passphrase and the stored salt with PBKDF2.',
          'Decrypt and check the tag. If it does not match, stop: the key is wrong or the data was modified.',
        ],
        tip: 'Use the "Decode it" button after encrypting to send the ciphertext and passphrase straight here.',
        example: { input: 'Base64 ciphertext + passphrase', output: 'Original plaintext' },
        pitfalls: ['Lose the passphrase and the data is gone for good.', 'Unauthenticated modes such as CBC can be tampered with undetected.'],
      },
      {
        name: 'Breaking Classical Ciphers',
        algo: 'caesar', tryText: 'KHOOR',
        overview: 'Classical ciphers can be broken without the key because they preserve letter frequencies.',
        how: [
          'Count letter frequencies in the ciphertext.',
          'Compare with English: E ≈ 12.7%, T ≈ 9.1%, A ≈ 8.2%.',
          'For Caesar, the offset between the most common letter and E is probably the shift.',
          'For Vigenère, find the keyword length first (Kasiski or index of coincidence), then solve each column as a Caesar cipher.',
        ],
        tip: 'Caesar has only 25 possible keys — trying them all takes seconds.',
        example: { input: 'KHOOR (shift 3)', output: 'HELLO' },
        pitfalls: ['Short messages do not have reliable frequencies.'],
      },
      {
        name: 'Decoding Morse',
        algo: 'morse', tryText: '.... . .-.. .-.. ---',
        overview: 'Split on / to get words and on spaces to get letters, then look each code up.',
        how: ['Split the input on / into words.', 'Split each word on spaces into letter codes.', 'Look each code up in the reverse Morse table.'],
        example: { input: '.... . .-.. .-.. ---', output: 'HELLO' },
        pitfalls: ['Unknown codes decode as ?.', 'Morse has no lowercase — output is always uppercase.'],
      },
    ],
  },
  {
    category: '🔑 Decrypting Asymmetric Ciphers',
    color: '#a855f7',
    items: [
      {
        name: 'Decrypting RSA',
        overview: 'Only the private key can reverse RSA encryption: m = cᵈ mod n.',
        how: ['Load the PEM private key.', 'Base64-decode the ciphertext.', 'Apply RSA, then remove and verify the OAEP padding.'],
        tip: 'Never share your private key. Anyone holding it can read every message sent to you.',
        example: { input: 'Ciphertext + private key', output: 'Original plaintext' },
        pitfalls: ['Old PKCS#1 v1.5 padding is vulnerable to padding-oracle attacks — prefer OAEP.'],
      },
    ],
  },
  {
    category: '#️⃣ Why Hashes Cannot Be Decoded',
    color: '#f97316',
    items: [
      {
        name: 'One-way by design',
        overview: 'A hash maps unlimited inputs to a fixed-size output, so information is thrown away. There is nothing to reverse.',
        how: [
          'Infinitely many inputs share each hash value, so the original cannot be identified.',
          'The compression rounds deliberately discard information.',
          '"Cracking" a hash means guessing inputs until one matches — not decoding.',
        ],
        tip: 'Salting passwords before hashing defeats precomputed rainbow tables.',
        example: { input: '5d41402abc4b2a76b9719d911017c592 (MD5)', output: '❌ Cannot be decoded' },
        pitfalls: ['Weak passwords fall to dictionary attacks even with strong hashes.'],
      },
    ],
  },
];

export default function LearnDecode() {
  return (
    <Lessons
      icon={Unlock}
      title="Learn to Decode"
      subtitle="The reverse process — how encoded or encrypted data is turned back into its original form, and what can go wrong."
      lessons={lessons}
      stepsTitle="Step by step"
      tryMode="decode"
    />
  );
}
