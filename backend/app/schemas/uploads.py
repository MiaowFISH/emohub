from pydantic import BaseModel, Field

MAX_PRECHECK_HASHES = 256


class UploadPrecheckRequest(BaseModel):
    hashes: list[str] = Field(max_length=MAX_PRECHECK_HASHES)


class UploadPrecheckExisting(BaseModel):
    hash: str
    image_id: str


class UploadPrecheckResponse(BaseModel):
    existing: list[UploadPrecheckExisting]
    missing: list[str]


class UploadedImageResponse(BaseModel):
    id: str
    sha256: str
    processing_state: str
    thumbnail_url: str


class UploadSingleFileResponse(BaseModel):
    duplicate: bool
    image: UploadedImageResponse
