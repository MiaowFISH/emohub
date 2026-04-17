from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.services.task_queue import enqueue_processing_task

SUPPORTED_IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}


@dataclass
class ImportStats:
    queued: int = 0


def iter_supported_images(folder: Path):
    for path in sorted(folder.iterdir()):
        if path.is_file() and path.suffix.lower() in SUPPORTED_IMAGE_SUFFIXES:
            yield path


def derive_folder_tags(folder: Path) -> set[str]:
    name = folder.name.strip()
    if "_" not in name:
        return set()

    category, tag_name = name.split("_", 1)
    normalized_category = category.strip()
    normalized_name = tag_name.strip()
    if not normalized_category or not normalized_name:
        return set()
    return {f"{normalized_category}:{normalized_name}"}


def read_sidecar_tags(sidecar_path: Path) -> set[str]:
    if not sidecar_path.exists() or not sidecar_path.is_file():
        return set()

    tags: set[str] = set()
    for line in sidecar_path.read_text(encoding="utf-8").splitlines():
        value = line.strip()
        if value:
            tags.add(value)
    return tags


def import_folder(session: Session, folder: Path) -> ImportStats:
    stats = ImportStats()
    for image_path in iter_supported_images(folder):
        inherited_tags = derive_folder_tags(image_path.parent)
        sidecar_tags = read_sidecar_tags(image_path.with_suffix(".txt"))
        payload = {
            "image_path": str(image_path),
            "tags": sorted(inherited_tags | sidecar_tags),
        }
        enqueue_processing_task(
            session=session,
            task_type="embed_image",
            payload=payload,
        )
        stats.queued += 1
    return stats
