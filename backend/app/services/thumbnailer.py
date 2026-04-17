from io import BytesIO
from pathlib import Path

from PIL import Image


def generate_thumbnail(
    content: bytes, output_path: Path, max_side: int = 512
) -> tuple[int, int]:
    with Image.open(BytesIO(content)) as image:
        width, height = image.size
        thumb = image.copy()
        thumb.thumbnail((max_side, max_side))
        thumb.convert("RGB").save(output_path, format="JPEG", quality=85)
    return width, height
