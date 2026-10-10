import base64
import json

import pytest
from fastapi.testclient import TestClient

import crypto_ops
import parity
from main import app

client = TestClient(app)

SAMPLES = ["Hello, World!", "naïve café — 日本語 🔐", "line one\nline two\ttabbed"]
ALL_IDS = [a["id"] for group in crypto_ops.ALGORITHMS.values() for a in group]
REVERSIBLE = [i for i in ALL_IDS if crypto_ops.OPS[i][1] is not None]
KEYS = {"caesar": "7", "vigenere": "LEMON", "aes": "correct horse", "3des": "battery staple"}


def post(path, **payload):
    return client.post(path, json=payload)


def key_for(alg, operation):
    if alg == "fernet":
        return KEYS.setdefault("fernet", crypto_ops.generate_key("fernet")["key"])
    if alg == "rsa":
        if "rsa" not in KEYS:
            KEYS["rsa"] = crypto_ops.generate_key("rsa")
        return KEYS["rsa"]["public_key" if operation == "encode" else "private_key"]
    return KEYS.get(alg)


def test_registry_and_ops_agree():
    assert set(ALL_IDS) == set(crypto_ops.OPS)
    assert len(ALL_IDS) == len(set(ALL_IDS)), "duplicate algorithm ids"
    for group, algos in crypto_ops.ALGORITHMS.items():
        assert all(a["category"] == group for a in algos)
        assert all(a["encodeOnly"] == (crypto_ops.OPS[a["id"]][1] is None) for a in algos)


def test_algorithms_endpoint():
    data = client.get("/algorithms").json()
    assert list(data) == ["symmetric", "asymmetric", "classic", "encoding", "hashing"]


@pytest.mark.skipif(not parity.ALGORITHMS_JSON.exists(), reason="frontend not checked out")
def test_frontend_algorithm_list_is_current():
    assert json.loads(parity.ALGORITHMS_JSON.read_text(encoding="utf-8")) == crypto_ops.ALGORITHMS, "run: python parity.py"


@pytest.mark.skipif(not parity.FIXTURE.exists(), reason="frontend not checked out")
def test_frontend_parity_fixture_is_current():
    assert json.loads(parity.FIXTURE.read_text(encoding="utf-8")) == parity.build(), "run: python parity.py"


# Every reversible algorithm must round-trip arbitrary Unicode, except Morse,
# which is uppercase-only and has no codes for most non-ASCII characters.
@pytest.mark.parametrize("alg", REVERSIBLE)
@pytest.mark.parametrize("text", SAMPLES)
def test_round_trip(alg, text):
    if alg == "morse":
        text = "SOS HELP 123"
    enc = post("/encode", text=text, algorithm=alg, key=key_for(alg, "encode"))
    assert enc.status_code == 200, enc.text
    dec = post("/decode", text=enc.json()["result"], algorithm=alg, key=key_for(alg, "decode"))
    assert dec.status_code == 200, dec.text
    assert dec.json()["result"] == text


@pytest.mark.parametrize("alg,text,key,expected", [
    ("base64", "Man", None, "TWFu"),
    ("hex", "Hi", None, "4869"),
    ("binary", "A", None, "01000001"),
    ("binary", "é", None, "11000011 10101001"),
    ("caesar", "HELLO", "3", "KHOOR"),
    ("vigenere", "HELLO", "KEY", "RIJVS"),
    ("vigenere", "ATTACK AT DAWN", "LEMON", "LXFOPV EF RNHR"),
    ("rot13", "Hello", None, "Uryyb"),
    ("atbash", "abc XYZ", None, "zyx CBA"),
    ("morse", "SOS", None, "... --- ..."),
    ("morse", "hi there", None, ".... .. / - .... . .-. ."),
    ("url", "a b&c=d/é", None, "a%20b%26c%3Dd%2F%C3%A9"),
    ("html", "<b>\"x\"</b>", None, "&lt;b&gt;&quot;x&quot;&lt;/b&gt;"),
    ("unicode", "A🔐", None, "U+0041 U+1F510"),
    ("decimal", "Hi", None, "72 105"),
    ("sha256", "hello", None, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"),
    ("md5", "hello", None, "5d41402abc4b2a76b9719d911017c592"),
])
def test_known_vectors(alg, text, key, expected):
    r = post("/encode", text=text, algorithm=alg, key=key)
    assert r.status_code == 200, r.text
    assert r.json()["result"] == expected


def test_aes_uses_random_salt_and_nonce():
    a = post("/encode", text="same", algorithm="aes", key="k").json()["result"]
    b = post("/encode", text="same", algorithm="aes", key="k").json()["result"]
    assert a != b


@pytest.mark.parametrize("alg", ["aes", "3des", "fernet"])
def test_wrong_key_is_a_clear_400(alg):
    good = key_for(alg, "encode")
    bad = crypto_ops.generate_key("fernet")["key"] if alg == "fernet" else "wrong key"
    ct = post("/encode", text="top secret", algorithm=alg, key=good).json()["result"]
    r = post("/decode", text=ct, algorithm=alg, key=bad)
    assert r.status_code == 400
    assert "wrong key" in r.json()["detail"].lower()


def test_aes_detects_tampering():
    ct = base64.b64decode(post("/encode", text="pay alice $5", algorithm="aes", key="k").json()["result"])
    tampered = base64.b64encode(ct[:-1] + bytes([ct[-1] ^ 1])).decode()
    r = post("/decode", text=tampered, algorithm="aes", key="k")
    assert r.status_code == 400


def test_rsa_rejects_long_messages_with_explanation():
    r = post("/encode", text="x" * 191, algorithm="rsa", key=key_for("rsa", "encode"))
    assert r.status_code == 400
    assert "190 bytes" in r.json()["detail"]


@pytest.mark.parametrize("alg,text", [
    ("base64", "not base64!!"), ("hex", "zz"), ("binary", "102"), ("octal", "999"),
    ("unicode", "hello"), ("base32", "1"), ("decimal", "abc"),
])
def test_bad_input_is_a_clear_400(alg, text):
    r = post("/decode", text=text, algorithm=alg)
    assert r.status_code == 400
    assert "not valid" in r.json()["detail"]


@pytest.mark.parametrize("alg", ["aes", "3des", "fernet", "rsa", "vigenere"])
def test_missing_key(alg):
    r = post("/encode", text="hi", algorithm=alg, key="")
    assert r.status_code == 400


def test_hash_cannot_be_decoded():
    r = post("/decode", text="abc", algorithm="sha256")
    assert r.status_code == 400
    assert "one-way" in r.json()["detail"]


def test_unknown_algorithm():
    assert post("/encode", text="x", algorithm="rot47").status_code == 400


@pytest.mark.parametrize("alg", ["aes", "3des", "fernet", "rsa"])
def test_generate_key(alg):
    r = client.post(f"/generate-key/{alg}")
    assert r.status_code == 200
    data = r.json()
    if alg == "rsa":
        assert "BEGIN PUBLIC KEY" in data["public_key"] and "BEGIN PRIVATE KEY" in data["private_key"]
    else:
        assert data["key"]


def test_generate_key_unsupported():
    assert client.post("/generate-key/base64").status_code == 400


def test_encode_file_hash_and_base64():
    files = {"file": ("hello.txt", b"hello", "text/plain")}
    r = client.post("/encode-file?algorithm=sha256", files=files)
    assert r.json()["result"].startswith("2cf24dba")
    files = {"file": ("hello.txt", b"hello", "text/plain")}
    assert client.post("/encode-file?algorithm=base64", files=files).json()["result"] == "aGVsbG8="


def test_encode_file_rejects_unsupported_algorithm():
    files = {"file": ("a.txt", b"a", "text/plain")}
    assert client.post("/encode-file?algorithm=aes", files=files).status_code == 400
