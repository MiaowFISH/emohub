from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="EmoHub API")
    app.include_router(api_router)

    thumbnail_root = Path(settings.thumbnail_root)
    thumbnail_root.mkdir(parents=True, exist_ok=True)
    app.mount(
        "/media/thumbs", StaticFiles(directory=thumbnail_root), name="media-thumbs"
    )

    web_dist_root = (
        Path(settings.web_dist_root)
        if settings.web_dist_root
        else Path(__file__).resolve().parents[2] / "apps" / "web" / "dist"
    )
    if web_dist_root.exists():
        assets_root = web_dist_root / "assets"
        locales_root = web_dist_root / "locales"
        icons_root = web_dist_root / "icons"
        if assets_root.exists():
            app.mount(
                "/assets",
                StaticFiles(directory=assets_root),
                name="web-assets",
            )
        if locales_root.exists():
            app.mount(
                "/locales",
                StaticFiles(directory=locales_root),
                name="web-locales",
            )
        if icons_root.exists():
            app.mount(
                "/icons",
                StaticFiles(directory=icons_root),
                name="web-icons",
            )

        @app.get("/manifest.webmanifest", include_in_schema=False)
        async def web_manifest() -> FileResponse:
            return FileResponse(web_dist_root / "manifest.webmanifest")

        @app.get("/sw.js", include_in_schema=False)
        async def service_worker() -> FileResponse:
            return FileResponse(
                web_dist_root / "sw.js", media_type="application/javascript"
            )

        @app.get("/favicon.ico", include_in_schema=False)
        async def favicon() -> FileResponse:
            return FileResponse(
                web_dist_root / "icons" / "app-icon.svg",
                media_type="image/svg+xml",
            )

        @app.get("/", include_in_schema=False)
        async def web_index() -> FileResponse:
            return FileResponse(web_dist_root / "index.html")
    else:

        @app.get("/", include_in_schema=False)
        async def web_shell_unavailable() -> dict[str, str]:
            return {
                "status": "web_dist_missing",
                "detail": "Build apps/web or set WEB_DIST_ROOT before serving the web shell.",
            }

    @app.middleware("http")
    async def add_cache_headers(request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/media/thumbs/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response

    return app


app = create_app()
