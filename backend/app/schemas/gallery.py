from pydantic import BaseModel
from typing import Literal


class GalleryItem(BaseModel):
    id: str
    original_name: str
    thumbnail_url: str
    processing_state: str
    embedding_state: str
    tags: list[str]


class GalleryListResponse(BaseModel):
    items: list[GalleryItem]


class BatchDeleteRequest(BaseModel):
    ids: list[str]


class BatchDeleteResponse(BaseModel):
    deleted: int


class SearchResponse(BaseModel):
    mode: Literal["hybrid", "text_tag_fallback"]
    items: list[GalleryItem]
