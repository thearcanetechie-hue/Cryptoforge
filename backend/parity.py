"""Generates the two files the frontend shares with the backend.

- algorithms.json: the algorithm list, so the UI renders before the API answers.
- parity.json: expected outputs for every algorithm the browser also
  implements; the frontend tests check its codecs against it, so the two
  implementations can never drift apart.

Backend tests fail if either file is stale. Regenerate after changing a codec:

    python parity.py
"""

import json
from pathlib import Path

import crypto_ops

BROWSER_ALGOS = ["base64", "hex", "binary", "octal", "decimal", "unicode", "url", "html",
                 "caesar", "vigenere", "atbash", "rot13", "morse", "sha1", "sha256", "sha512"]
TEXTS = ["Hello, World!", "naïve café — 日本語 🔐", "<a href='x?y=1&z=2'>(hi)*!</a>", "  spaced   out  ", ""]
KEYS = {"caesar": "-29", "vigenere": "Lemon 42"}
LIB = Path(__file__).resolve().parent.parent / "frontend" / "src" / "lib"
FIXTURE = LIB / "parity.json"
ALGORITHMS_JSON = LIB / "algorithms.json"


def build() -> list[dict]:
    cases = []
    for alg in BROWSER_ALGOS:
        for text in TEXTS:
            if alg == "morse":
                text = text.upper()
            key = KEYS.get(alg, "")
            cases.append({"alg": alg, "key": key, "text": text,
                          "encoded": crypto_ops.run(alg, text, key, "encode")})
    return cases


def _write(path: Path, data, indent: int) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=indent) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {path}")


if __name__ == "__main__":
    _write(ALGORITHMS_JSON, crypto_ops.ALGORITHMS, 2)
    _write(FIXTURE, build(), 1)
