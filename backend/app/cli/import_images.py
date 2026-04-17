import argparse
from pathlib import Path

from app.core.db import SessionLocal
from app.services.import_service import import_folder


def run(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="import_images")
    parser.add_argument("folder", help="folder containing images")
    args = parser.parse_args(argv)

    folder = Path(args.folder)
    if not folder.exists() or not folder.is_dir():
        print(f"folder not found: {folder}")
        return 2

    session = SessionLocal()
    try:
        stats = import_folder(session, folder)
    finally:
        session.close()

    print(f"queued={stats.queued}")
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
