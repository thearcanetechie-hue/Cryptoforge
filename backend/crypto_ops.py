"""Pure encode/decode functions and the algorithm registry used by the API.

Every text codec works on UTF-8 bytes so results match the browser-side
implementations in frontend/src/lib/codecs.js.
"""

import base64
import binascii
import codecs
import hashlib
import html
import os
import secrets
import urllib.parse

from cryptography.exceptions import InvalidTag
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes, padding as sym_padding, serialization
from cryptography.hazmat.primitives.asymmetric import padding as asym_padding, rsa
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

try:  # TripleDES moved to the "decrepit" module in cryptography 43+
    from cryptography.hazmat.decrepit.ciphers.algorithms import TripleDES
except ImportError:  # pragma: no cover - older cryptography releases
    TripleDES = algorithms.TripleDES


class CryptoError(ValueError):
    """A user-facing error: bad input, wrong key, unsupported operation."""


# ─── Key derivation ──────────────────────────────────────────────

PBKDF2_ITERATIONS = 600_000  # OWASP 2023 recommendation for PBKDF2-HMAC-SHA256
SALT_LEN = 16


def derive_key(passphrase: str, salt: bytes, length: int) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=length, salt=salt, iterations=PBKDF2_ITERATIONS)
    return kdf.derive(passphrase.encode())


def _b64decode_strict(text: str) -> bytes:
    try:
        return base64.b64decode("".join(text.split()), validate=True)
    except (binascii.Error, ValueError):
        raise CryptoError("Ciphertext is not valid Base64")


# ─── AES-256-GCM (authenticated) ─────────────────────────────────
# Output: base64( salt[16] | nonce[12] | ciphertext+tag )


def aes_encrypt(text: str, passphrase: str) -> str:
    salt, nonce = os.urandom(SALT_LEN), os.urandom(12)
    key = derive_key(passphrase, salt, 32)
    ct = AESGCM(key).encrypt(nonce, text.encode(), None)
    return base64.b64encode(salt + nonce + ct).decode()


def aes_decrypt(text: str, passphrase: str) -> str:
    raw = _b64decode_strict(text)
    if len(raw) < SALT_LEN + 12 + 16:
        raise CryptoError("Ciphertext is too short to be AES-GCM output")
    salt, nonce, ct = raw[:SALT_LEN], raw[SALT_LEN:SALT_LEN + 12], raw[SALT_LEN + 12:]
    key = derive_key(passphrase, salt, 32)
    try:
        return AESGCM(key).decrypt(nonce, ct, None).decode()
    except InvalidTag:
        raise CryptoError("Decryption failed: wrong key or tampered ciphertext")


# ─── Triple DES (legacy, CBC) ────────────────────────────────────
# Output: base64( salt[16] | iv[8] | ciphertext )


def des3_encrypt(text: str, passphrase: str) -> str:
    salt, iv = os.urandom(SALT_LEN), os.urandom(8)
    key = derive_key(passphrase, salt, 24)
    padder = sym_padding.PKCS7(64).padder()
    padded = padder.update(text.encode()) + padder.finalize()
    enc = Cipher(TripleDES(key), modes.CBC(iv)).encryptor()
    return base64.b64encode(salt + iv + enc.update(padded) + enc.finalize()).decode()


def des3_decrypt(text: str, passphrase: str) -> str:
    raw = _b64decode_strict(text)
    if len(raw) < SALT_LEN + 8 + 8 or (len(raw) - SALT_LEN - 8) % 8:
        raise CryptoError("Ciphertext has the wrong length for Triple DES output")
    salt, iv, ct = raw[:SALT_LEN], raw[SALT_LEN:SALT_LEN + 8], raw[SALT_LEN + 8:]
    key = derive_key(passphrase, salt, 24)
    dec = Cipher(TripleDES(key), modes.CBC(iv)).decryptor()
    try:
        unpadder = sym_padding.PKCS7(64).unpadder()
        padded = dec.update(ct) + dec.finalize()
        return (unpadder.update(padded) + unpadder.finalize()).decode()
    except (ValueError, UnicodeDecodeError):
        raise CryptoError("Decryption failed: wrong key or corrupted ciphertext")


# ─── Fernet ──────────────────────────────────────────────────────


def _fernet(key: str) -> Fernet:
    try:
        return Fernet(key.strip().encode())
    except (ValueError, binascii.Error):
        raise CryptoError("Fernet keys must be 32 url-safe Base64-encoded bytes — use Generate")


def fernet_encrypt(text: str, key: str) -> str:
    return _fernet(key).encrypt(text.encode()).decode()


def fernet_decrypt(text: str, key: str) -> str:
    try:
        return _fernet(key).decrypt(text.strip().encode()).decode()
    except InvalidToken:
        raise CryptoError("Decryption failed: wrong key or tampered token")


# ─── RSA-2048 OAEP ───────────────────────────────────────────────

RSA_OAEP = asym_padding.OAEP(mgf=asym_padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
RSA_MAX_BYTES = 2048 // 8 - 2 * 32 - 2  # 190 bytes for a 2048-bit key with SHA-256 OAEP


def rsa_generate_keys() -> dict:
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return {
        "private_key": priv.private_bytes(
            serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
        ).decode(),
        "public_key": priv.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode(),
    }


def rsa_encrypt(text: str, public_key_pem: str) -> str:
    try:
        pub = serialization.load_pem_public_key(public_key_pem.strip().encode())
    except ValueError:
        raise CryptoError("Could not read the public key — paste a PEM 'BEGIN PUBLIC KEY' block")
    if not isinstance(pub, rsa.RSAPublicKey):
        raise CryptoError("That is not an RSA public key")
    max_bytes = pub.key_size // 8 - 2 * 32 - 2
    data = text.encode()
    if len(data) > max_bytes:
        raise CryptoError(
            f"RSA-{pub.key_size} can encrypt at most {max_bytes} bytes; your text is {len(data)} bytes. "
            "Use AES for longer messages."
        )
    return base64.b64encode(pub.encrypt(data, RSA_OAEP)).decode()


def rsa_decrypt(text: str, private_key_pem: str) -> str:
    try:
        priv = serialization.load_pem_private_key(private_key_pem.strip().encode(), password=None)
    except (ValueError, TypeError):
        raise CryptoError("Could not read the private key — paste an unencrypted PEM private key")
    if not isinstance(priv, rsa.RSAPrivateKey):
        raise CryptoError("That is not an RSA private key")
    try:
        return priv.decrypt(_b64decode_strict(text), RSA_OAEP).decode()
    except ValueError:
        raise CryptoError("Decryption failed: wrong private key or corrupted ciphertext")


# ─── Classical ciphers ───────────────────────────────────────────


def parse_shift(key: str) -> int:
    try:
        return int(key.strip()) % 26
    except (ValueError, AttributeError):
        return 3


def caesar(text: str, shift: int) -> str:
    out = []
    for c in text:
        if "a" <= c <= "z" or "A" <= c <= "Z":
            base = ord("A") if c.isupper() else ord("a")
            out.append(chr((ord(c) - base + shift) % 26 + base))
        else:
            out.append(c)
    return "".join(out)


def vigenere(text: str, key: str, decrypt: bool = False) -> str:
    shifts = [ord(c) - ord("A") for c in key.upper() if "A" <= c <= "Z"]
    if not shifts:
        raise CryptoError("Vigenère key must contain at least one letter")
    sign = -1 if decrypt else 1
    out, i = [], 0
    for c in text:
        if "a" <= c <= "z" or "A" <= c <= "Z":
            base = ord("A") if c.isupper() else ord("a")
            out.append(chr((ord(c) - base + sign * shifts[i % len(shifts)]) % 26 + base))
            i += 1
        else:
            out.append(c)
    return "".join(out)


ATBASH = str.maketrans(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba",
)

MORSE = {
    "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.", "G": "--.", "H": "....",
    "I": "..", "J": ".---", "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---", "P": ".--.",
    "Q": "--.-", "R": ".-.", "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
    "Y": "-.--", "Z": "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
    "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.", ".": ".-.-.-", ",": "--..--",
    "?": "..--..", "!": "-.-.--", "'": ".----.", "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...",
    ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", '"': ".-..-.", "@": ".--.-.",
}
MORSE_REV = {v: k for k, v in MORSE.items()}


def morse_encode(text: str) -> str:
    words = text.upper().split()
    return " / ".join(" ".join(MORSE.get(c, "?") for c in w) for w in words)


def morse_decode(text: str) -> str:
    words = [w for w in text.strip().split("/")]
    return " ".join("".join(MORSE_REV.get(code, "?") for code in w.split()) for w in words if w.strip())


# ─── Encodings (UTF-8 byte based) ────────────────────────────────


def _utf8(data: bytes) -> str:
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        raise CryptoError("Decoded bytes are not valid UTF-8 text")


def _tokens(text: str, base: int, label: str) -> bytes:
    try:
        values = [int(t, base) for t in text.split()]
        return bytes(values)
    except ValueError:
        raise CryptoError(f"Input is not valid {label} (expected space-separated byte values 0–255)")


def b64_decode(text: str) -> str:
    try:
        return _utf8(base64.b64decode("".join(text.split()), validate=True))
    except binascii.Error:
        raise CryptoError("Input is not valid Base64")


def b32_decode(text: str) -> str:
    try:
        return _utf8(base64.b32decode(text.strip().upper()))
    except binascii.Error:
        raise CryptoError("Input is not valid Base32")


def b85_decode(text: str) -> str:
    try:
        return _utf8(base64.b85decode(text.strip()))
    except ValueError:
        raise CryptoError("Input is not valid Base85")


def hex_decode(text: str) -> str:
    try:
        return _utf8(bytes.fromhex("".join(text.split())))
    except ValueError:
        raise CryptoError("Input is not valid hexadecimal")


def unicode_decode(text: str) -> str:
    try:
        return "".join(chr(int(t.upper().removeprefix("U+"), 16)) for t in text.split())
    except ValueError:
        raise CryptoError("Input is not valid Unicode notation (expected tokens like U+0041)")


def decimal_decode(text: str) -> str:
    try:
        return "".join(chr(int(t)) for t in text.split())
    except ValueError:
        raise CryptoError("Input is not valid decimal character codes")


HASHES = {
    "md5": hashlib.md5,
    "sha1": hashlib.sha1,
    "sha256": hashlib.sha256,
    "sha512": hashlib.sha512,
    "sha3_256": hashlib.sha3_256,
    "sha3_512": hashlib.sha3_512,
    "blake2b": hashlib.blake2b,
    "blake2s": hashlib.blake2s,
}


def _keyed(fn):
    """Wrap a (text, key) function so it errors clearly when the key is missing."""

    def wrapper(text: str, key: str, name: str):
        if not key.strip():
            raise CryptoError(f"{name} requires a key")
        return fn(text, key)

    return wrapper


# id -> (encode, decode). Each function takes (text, key, name); decode None = one-way.
OPS = {
    "aes": (_keyed(aes_encrypt), _keyed(aes_decrypt)),
    "3des": (_keyed(des3_encrypt), _keyed(des3_decrypt)),
    "fernet": (_keyed(fernet_encrypt), _keyed(fernet_decrypt)),
    "rsa": (_keyed(rsa_encrypt), _keyed(rsa_decrypt)),
    "caesar": (lambda t, k, n: caesar(t, parse_shift(k)), lambda t, k, n: caesar(t, -parse_shift(k))),
    "vigenere": (lambda t, k, n: vigenere(t, k), lambda t, k, n: vigenere(t, k, decrypt=True)),
    "atbash": (lambda t, k, n: t.translate(ATBASH), lambda t, k, n: t.translate(ATBASH)),
    "rot13": (lambda t, k, n: codecs.encode(t, "rot_13"), lambda t, k, n: codecs.encode(t, "rot_13")),
    "morse": (lambda t, k, n: morse_encode(t), lambda t, k, n: morse_decode(t)),
    "base64": (lambda t, k, n: base64.b64encode(t.encode()).decode(), lambda t, k, n: b64_decode(t)),
    "base32": (lambda t, k, n: base64.b32encode(t.encode()).decode(), lambda t, k, n: b32_decode(t)),
    "base85": (lambda t, k, n: base64.b85encode(t.encode()).decode(), lambda t, k, n: b85_decode(t)),
    "hex": (lambda t, k, n: t.encode().hex(), lambda t, k, n: hex_decode(t)),
    "binary": (
        lambda t, k, n: " ".join(f"{b:08b}" for b in t.encode()),
        lambda t, k, n: _utf8(_tokens(t, 2, "binary")),
    ),
    "octal": (
        lambda t, k, n: " ".join(f"{b:o}" for b in t.encode()),
        lambda t, k, n: _utf8(_tokens(t, 8, "octal")),
    ),
    "decimal": (lambda t, k, n: " ".join(str(ord(c)) for c in t), lambda t, k, n: decimal_decode(t)),
    "unicode": (lambda t, k, n: " ".join(f"U+{ord(c):04X}" for c in t), lambda t, k, n: unicode_decode(t)),
    "url": (lambda t, k, n: urllib.parse.quote(t, safe=""), lambda t, k, n: urllib.parse.unquote(t)),
    "html": (lambda t, k, n: html.escape(t), lambda t, k, n: html.unescape(t)),
    **{h: ((lambda fn: lambda t, k, n: fn(t.encode()).hexdigest())(fn), None) for h, fn in HASHES.items()},
}


def _algo(id, name, category, description, **flags):
    return {"id": id, "name": name, "category": category, "description": description,
            "needsKey": False, "encodeOnly": False, **flags}


ALGORITHMS = {
    "symmetric": [
        _algo("aes", "AES-256-GCM", "symmetric", "Authenticated encryption; key derived from your passphrase with PBKDF2", needsKey=True, generateKey=True),
        _algo("fernet", "Fernet", "symmetric", "AES-128-CBC + HMAC-SHA256 with a random 32-byte key", needsKey=True, generateKey=True),
        _algo("3des", "Triple DES", "symmetric", "Legacy block cipher — included for learning, not for new systems", needsKey=True, generateKey=True),
    ],
    "asymmetric": [
        _algo("rsa", "RSA-2048 (OAEP)", "asymmetric", "Public-key encryption for short messages (≤190 bytes)", needsKey=True, generateKey=True),
    ],
    "classic": [
        _algo("caesar", "Caesar Cipher", "classic", "Shift every letter by a fixed amount", needsKey=True, keyType="number"),
        _algo("vigenere", "Vigenère Cipher", "classic", "Polyalphabetic cipher driven by a keyword", needsKey=True),
        _algo("atbash", "Atbash Cipher", "classic", "Mirror the alphabet: A↔Z, B↔Y…"),
        _algo("rot13", "ROT13", "classic", "Caesar cipher with a fixed shift of 13"),
        _algo("morse", "Morse Code", "classic", "Dots and dashes; letters split by spaces, words by /"),
    ],
    "encoding": [
        _algo("base64", "Base64", "encoding", "Binary-to-text encoding with 64 symbols"),
        _algo("base32", "Base32", "encoding", "Case-insensitive encoding with 32 symbols"),
        _algo("base85", "Base85", "encoding", "Compact encoding with 85 symbols"),
        _algo("hex", "Hexadecimal", "encoding", "Each byte as two hex digits"),
        _algo("binary", "Binary", "encoding", "Each byte as eight bits"),
        _algo("octal", "Octal", "encoding", "Each byte as a base-8 number"),
        _algo("decimal", "Decimal Codes", "encoding", "Each character as its decimal code point"),
        _algo("unicode", "Unicode Points", "encoding", "Each character as U+XXXX"),
        _algo("url", "URL Encoding", "encoding", "Percent-encoding for URLs"),
        _algo("html", "HTML Entities", "encoding", "Escape characters that are special in HTML"),
    ],
    "hashing": [
        _algo("sha256", "SHA-256", "hashing", "256-bit SHA-2 digest", encodeOnly=True),
        _algo("sha512", "SHA-512", "hashing", "512-bit SHA-2 digest", encodeOnly=True),
        _algo("sha3_256", "SHA3-256", "hashing", "256-bit SHA-3 (Keccak) digest", encodeOnly=True),
        _algo("sha3_512", "SHA3-512", "hashing", "512-bit SHA-3 (Keccak) digest", encodeOnly=True),
        _algo("blake2b", "BLAKE2b", "hashing", "Fast 512-bit digest", encodeOnly=True),
        _algo("blake2s", "BLAKE2s", "hashing", "Fast 256-bit digest for small devices", encodeOnly=True),
        _algo("sha1", "SHA-1", "hashing", "160-bit digest — collision-broken, legacy only", encodeOnly=True),
        _algo("md5", "MD5", "hashing", "128-bit digest — broken, checksums only", encodeOnly=True),
    ],
}


def _name(alg: str) -> str:
    for group in ALGORITHMS.values():
        for a in group:
            if a["id"] == alg:
                return a["name"]
    return alg


def run(alg: str, text: str, key: str, operation: str) -> str:
    if alg not in OPS:
        raise CryptoError(f"Unknown algorithm: {alg}")
    encode_fn, decode_fn = OPS[alg]
    fn = encode_fn if operation == "encode" else decode_fn
    if fn is None:
        raise CryptoError(f"{_name(alg)} is a one-way hash and cannot be reversed")
    return fn(text, key or "", _name(alg))


def generate_key(alg: str) -> dict:
    if alg == "fernet":
        return {"type": "symmetric", "key": Fernet.generate_key().decode()}
    if alg in ("aes", "3des"):
        # A high-entropy passphrase; the cipher key itself is derived with PBKDF2.
        return {"type": "symmetric", "key": secrets.token_urlsafe(24)}
    if alg == "rsa":
        return {"type": "asymmetric", **rsa_generate_keys()}
    raise CryptoError(f"{_name(alg)} does not use generated keys")


FILE_ALGOS = {"base64", "hex", "binary", *HASHES}


def encode_bytes(alg: str, data: bytes) -> str:
    if alg == "base64":
        return base64.b64encode(data).decode()
    if alg == "hex":
        return data.hex()
    if alg == "binary":
        return " ".join(f"{b:08b}" for b in data)
    if alg in HASHES:
        return HASHES[alg](data).hexdigest()
    raise CryptoError("File mode supports Base64, Hex, Binary and the hash functions")
