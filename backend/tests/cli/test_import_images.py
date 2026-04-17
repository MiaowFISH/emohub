from pathlib import Path

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import _configure_sqlite_foreign_keys
from app.db.base import Base
from app.db.models import duplicate, image, image_tag, tag, task  # noqa: F401
from app.db.models.task import ProcessingTaskRecord
from app.db.models.tag import TagRecord

MINIMAL_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00"
    b"\x90wS\xde"
    b"\x00\x00\x00\x0cIDATx\x9cc````\x00\x00\x00\x04\x00\x01"
    b"\x0b\xe7\x02\x9d"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture
def import_cli_runner(tmp_path, monkeypatch):
    from app.cli.import_images import run

    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _configure_sqlite_foreign_keys(engine)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(
        bind=engine,
        class_=Session,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )

    def _runner(argv: list[str]):
        monkeypatch.setattr("sys.argv", ["import_images", *argv])
        monkeypatch.setattr("app.cli.import_images.SessionLocal", session_factory)
        return run()

    try:
        yield _runner, session_factory
    finally:
        Base.metadata.drop_all(bind=engine)


def test_import_cli_reads_folder_tags_and_sidecars_and_enqueues_work(
    import_cli_runner,
    tmp_path: Path,
    capsys,
) -> None:
    runner, session_factory = import_cli_runner
    folder = tmp_path / "角色_艾玛"
    folder.mkdir()
    image_path = folder / "wave.png"
    image_path.write_bytes(MINIMAL_PNG_BYTES)
    (folder / "wave.txt").write_text("action:举手\nseries:demo\n", encoding="utf-8")

    exit_code = runner([str(folder)])

    assert exit_code == 0
    output = capsys.readouterr().out
    assert "queued=1" in output

    session = session_factory()
    try:
        tasks = session.scalars(select(ProcessingTaskRecord)).all()
        assert len(tasks) == 1
        assert tasks[0].task_type == "embed_image"
        assert tasks[0].status == "pending"
        assert str(image_path) in tasks[0].payload_json
        assert "角色:艾玛" in tasks[0].payload_json
        assert "action:举手" in tasks[0].payload_json
        assert "series:demo" in tasks[0].payload_json

        tags = session.scalars(select(TagRecord)).all()
        assert tags == []
    finally:
        session.close()
