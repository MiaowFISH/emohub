# emohub

Rebuild status: FastAPI backend + React Web/PWA shell for single-user LAN image management.

## Dev

- API: `bun run dev:api`
- Web: `bun run dev:web`

The Vite dev server proxies `/api` and `/media` to `http://localhost:8000`.

## Deploy

- Build web bundle: `bun --cwd apps/web build`
- Run backend: `uv run --directory backend uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Full deploy checklist: `docs/superpowers/runbooks/rebuild-deploy.md`
