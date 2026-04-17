from hashlib import sha256


def sha256_bytes(content: bytes) -> str:
    return sha256(content).hexdigest()
