from pathlib import Path

from app.core.config import settings


def storage_paths_for_hash(sha256: str, ext: str) -> tuple[Path, Path]:
    shard = sha256[:2]
    image_path = Path(settings.storage_root) / "images" / shard / f"{sha256}.{ext}"
    thumb_path = Path(settings.thumbnail_root) / shard / f"{sha256}.jpg"

    image_path.parent.mkdir(parents=True, exist_ok=True)
    thumb_path.parent.mkdir(parents=True, exist_ok=True)

    return image_path, thumb_path


def resolve_storage_path(storage_path: str) -> Path:
    path = Path(storage_path)
    if path.is_absolute():
        return path
    return Path(settings.storage_root) / path
