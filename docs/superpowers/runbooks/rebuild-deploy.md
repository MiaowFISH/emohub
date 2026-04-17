# Rebuild Deploy Runbook

1. Backend host: run `uv sync --directory backend` and `uv run --directory backend alembic upgrade head`.
2. Web host: run `bun install` at repo root, then `bun --cwd apps/web build`.
3. Main host: run `uv run --directory backend uvicorn app.main:app --host 0.0.0.0 --port 8000` behind Caddy or Nginx.
4. Optional worker host: run `uv run --directory backend python -m app.worker.main --worker-id gpu-01` only when GPU tasks are needed.
5. Verify `/health`, `/api/gallery`, `/api/search`, `/api/uploads/precheck`, `/api/duplicates`, `/manifest.webmanifest`, `/sw.js`, and `/media/thumbs/...` before exposing the service.
6. Manual smoke: upload one image, confirm immediate queue progress, confirm gallery browse and tag edit still work with no worker, then reload once offline to confirm shell boot.
