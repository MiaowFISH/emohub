from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import create_app


def test_media_thumbnails_are_served_with_immutable_cache(
    tmp_path, monkeypatch
) -> None:
    thumbnail_root = tmp_path / "thumbs"
    file_path = thumbnail_root / "ab" / "preview.jpg"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(b"jpeg-data")

    monkeypatch.setattr(settings, "thumbnail_root", str(thumbnail_root))

    client = TestClient(create_app())
    response = client.get("/media/thumbs/ab/preview.jpg")

    assert response.status_code == 200
    assert response.content == b"jpeg-data"
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"


def test_dist_shell_files_are_served_when_present(tmp_path, monkeypatch) -> None:
    dist_root = tmp_path / "apps" / "web" / "dist"
    assets_root = dist_root / "assets"
    locales_root = dist_root / "locales" / "zh"
    icons_root = dist_root / "icons"
    assets_root.mkdir(parents=True, exist_ok=True)
    locales_root.mkdir(parents=True, exist_ok=True)
    icons_root.mkdir(parents=True, exist_ok=True)
    (dist_root / "index.html").write_text(
        "<html><body>EmoHub</body></html>", encoding="utf-8"
    )
    (dist_root / "manifest.webmanifest").write_text(
        '{"name":"EmoHub"}', encoding="utf-8"
    )
    (dist_root / "sw.js").write_text(
        "self.addEventListener('install', () => {})", encoding="utf-8"
    )
    (locales_root / "common.json").write_text('{"ok":"ok"}', encoding="utf-8")
    (icons_root / "app-icon.svg").write_text("<svg></svg>", encoding="utf-8")

    monkeypatch.setattr(settings, "web_dist_root", str(dist_root))

    client = TestClient(create_app())

    assert client.get("/").status_code == 200
    assert client.get("/manifest.webmanifest").status_code == 200
    assert client.get("/sw.js").status_code == 200
    assert client.get("/locales/zh/common.json").status_code == 200
    assert client.get("/icons/app-icon.svg").status_code == 200
    assert client.get("/favicon.ico").status_code == 200
