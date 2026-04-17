from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.schemas.gallery import SearchResponse
from app.services.search_service import (
    TextEmbedderProtocol,
    get_text_embedder,
    search_gallery,
)

router = APIRouter(prefix="/api/search", tags=["search"])


def get_text_embedder_dependency() -> TextEmbedderProtocol | None:
    return get_text_embedder()


@router.get("", response_model=SearchResponse)
def get_search(
    q: str = "",
    tag: list[str] | None = Query(default=None),
    session: Session = Depends(get_session),
    text_embedder: TextEmbedderProtocol | None = Depends(get_text_embedder_dependency),
) -> SearchResponse:
    return search_gallery(
        session=session,
        query=q,
        normalized_tags=tag or [],
        text_embedder=text_embedder,
    )
