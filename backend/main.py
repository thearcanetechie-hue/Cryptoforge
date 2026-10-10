import os
from typing import Literal

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import crypto_ops
from crypto_ops import CryptoError

MAX_TEXT_CHARS = 1_000_000
MAX_FILE_BYTES = 5 * 1024 * 1024

app = FastAPI(
    title="CryptoForge API",
    description="Encode, encrypt, decode, decrypt and hash text with 27 algorithms.",
    version="2.0.0",
)

allowed_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class CodecRequest(BaseModel):
    text: str = Field(max_length=MAX_TEXT_CHARS)
    algorithm: str
    key: str | None = None


class CodecResponse(BaseModel):
    result: str
    algorithm: str
    operation: Literal["encode", "decode"]


def _run(req: CodecRequest, operation: str) -> CodecResponse:
    try:
        result = crypto_ops.run(req.algorithm, req.text, req.key or "", operation)
    except CryptoError as e:
        raise HTTPException(400, str(e))
    return CodecResponse(result=result, algorithm=req.algorithm, operation=operation)


@app.get("/")
def root():
    return {"status": "ok", "service": "CryptoForge API", "docs": "/docs"}


@app.get("/algorithms")
def get_algorithms():
    return crypto_ops.ALGORITHMS


@app.post("/encode", response_model=CodecResponse)
def encode(req: CodecRequest):
    return _run(req, "encode")


@app.post("/decode", response_model=CodecResponse)
def decode(req: CodecRequest):
    return _run(req, "decode")


@app.post("/generate-key/{algorithm}")
def generate_key(algorithm: str):
    try:
        return crypto_ops.generate_key(algorithm)
    except CryptoError as e:
        raise HTTPException(400, str(e))


@app.post("/encode-file")
async def encode_file(file: UploadFile = File(...), algorithm: str = Query("base64")):
    if algorithm not in crypto_ops.FILE_ALGOS:
        raise HTTPException(400, "File mode supports Base64, Hex, Binary and the hash functions")
    data = await file.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(413, "Files are limited to 5 MB")
    return {"result": crypto_ops.encode_bytes(algorithm, data), "filename": file.filename, "algorithm": algorithm}
