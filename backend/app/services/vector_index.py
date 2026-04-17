from __future__ import annotations

from dataclasses import dataclass
from math import sqrt
from threading import RLock
from typing import Iterable


@dataclass(frozen=True)
class NeighborMatch:
    image_id: str
    score: float


def _normalize_embedding(embedding: Iterable[float]) -> list[float]:
    values = _coerce_embedding(embedding)
    magnitude = sqrt(sum(value * value for value in values))
    return [value / magnitude for value in values]


def _coerce_embedding(embedding: Iterable[float]) -> list[float]:
    values = [float(value) for value in embedding]
    if not values:
        raise ValueError("embedding must not be empty")

    magnitude = sqrt(sum(value * value for value in values))
    if magnitude == 0:
        raise ValueError("embedding magnitude must be greater than zero")
    return values


class LocalVectorIndex:
    def __init__(self) -> None:
        self._embeddings: dict[str, list[float]] = {}
        self._embedding_dimension: int | None = None
        self._lock = RLock()

    def reset(self) -> None:
        with self._lock:
            self._embeddings.clear()
            self._embedding_dimension = None

    def upsert_image_embedding(
        self, *, image_id: str, embedding: Iterable[float]
    ) -> None:
        values = _coerce_embedding(embedding)
        with self._lock:
            if self._embedding_dimension is None:
                self._embedding_dimension = len(values)
            elif len(values) != self._embedding_dimension:
                raise ValueError("embedding dimensions must match")
            self._embeddings[image_id] = values

    def fetch_embedding(self, image_id: str) -> list[float] | None:
        with self._lock:
            embedding = self._embeddings.get(image_id)
            if embedding is None:
                return None
            return list(embedding)

    def is_ready(self) -> bool:
        with self._lock:
            return bool(self._embeddings)

    def nearest_neighbors(
        self, *, image_id: str, limit: int = 10
    ) -> list[NeighborMatch]:
        if limit <= 0:
            return []

        with self._lock:
            source = self._embeddings.get(image_id)
            if source is None:
                return []

            normalized_source = _normalize_embedding(source)

            matches = [
                NeighborMatch(
                    image_id=other_id,
                    score=_dot_product(
                        normalized_source,
                        _normalize_embedding(other_embedding),
                    ),
                )
                for other_id, other_embedding in self._embeddings.items()
                if other_id != image_id
            ]

        matches.sort(key=lambda match: match.score, reverse=True)
        return matches[:limit]

    def query_by_embedding(
        self, *, embedding: Iterable[float], limit: int = 10
    ) -> list[NeighborMatch]:
        if limit <= 0:
            return []

        normalized_query = _normalize_embedding(embedding)
        with self._lock:
            matches = [
                NeighborMatch(
                    image_id=image_id,
                    score=_dot_product(
                        normalized_query,
                        _normalize_embedding(other_embedding),
                    ),
                )
                for image_id, other_embedding in self._embeddings.items()
            ]

        matches.sort(key=lambda match: match.score, reverse=True)
        return matches[:limit]

    def exact_matches_by_embedding(
        self, *, embedding: Iterable[float], min_score: float = 0.999_999
    ) -> list[NeighborMatch]:
        normalized_query = _normalize_embedding(embedding)
        with self._lock:
            matches = [
                NeighborMatch(
                    image_id=image_id,
                    score=_dot_product(
                        normalized_query,
                        _normalize_embedding(other_embedding),
                    ),
                )
                for image_id, other_embedding in self._embeddings.items()
            ]

        return [match for match in matches if match.score >= min_score]


def _dot_product(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        raise ValueError("embedding dimensions must match")
    return sum(left_value * right_value for left_value, right_value in zip(left, right))


_VECTOR_INDEX = LocalVectorIndex()


def get_vector_index() -> LocalVectorIndex:
    return _VECTOR_INDEX
