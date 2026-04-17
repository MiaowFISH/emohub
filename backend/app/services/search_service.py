from sqlalchemy.orm import Session

from app.schemas.gallery import SearchResponse
from app.services.gallery_service import list_gallery
from app.services.vector_index import LocalVectorIndex, get_vector_index


class TextEmbedderProtocol:
    def embed_text(self, text: str) -> list[float]:
        raise NotImplementedError


def get_text_embedder() -> TextEmbedderProtocol | None:
    return None


def search_gallery(
    *,
    session: Session,
    query: str,
    normalized_tags: list[str],
    text_embedder: TextEmbedderProtocol | None = None,
    vector_index: LocalVectorIndex | None = None,
) -> SearchResponse:
    cleaned_query = query.strip()
    if cleaned_query:
        embedder = text_embedder or get_text_embedder()
        if embedder is not None:
            resolved_vector_index = vector_index or get_vector_index()
            if not resolved_vector_index.is_ready():
                return _fallback_search_gallery(session, query, normalized_tags)

            try:
                semantic_items = _hybrid_search_gallery_items(
                    session=session,
                    query=cleaned_query,
                    normalized_tags=normalized_tags,
                    embedder=embedder,
                    vector_index=resolved_vector_index,
                )
            except (ValueError, RuntimeError):
                return _fallback_search_gallery(session, query, normalized_tags)

            if semantic_items:
                return SearchResponse(mode="hybrid", items=semantic_items)

    return _fallback_search_gallery(session, query, normalized_tags)


def _fallback_search_gallery(
    session: Session,
    query: str,
    normalized_tags: list[str],
) -> SearchResponse:
    gallery = list_gallery(
        session=session,
        query=query,
        normalized_tags=normalized_tags,
    )
    return SearchResponse(mode="text_tag_fallback", items=gallery.items)


def _hybrid_search_gallery_items(
    *,
    session: Session,
    query: str,
    normalized_tags: list[str],
    embedder: TextEmbedderProtocol,
    vector_index: LocalVectorIndex,
) -> list[object]:
    query_embedding = embedder.embed_text(query)
    neighbors = vector_index.exact_matches_by_embedding(embedding=query_embedding)
    if not neighbors:
        neighbors = vector_index.query_by_embedding(embedding=query_embedding, limit=50)
    if not neighbors:
        return []

    candidate_ids = [match.image_id for match in neighbors]
    gallery = list_gallery(
        session=session,
        query="",
        normalized_tags=normalized_tags,
    )
    items_by_id = {item.id: item for item in gallery.items}
    return [
        items_by_id[image_id] for image_id in candidate_ids if image_id in items_by_id
    ]
