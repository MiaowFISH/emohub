import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.db import _configure_sqlite_foreign_keys
from app.db.base import Base
from app.db.models import duplicate, image, image_tag, tag, task  # noqa: F401


@pytest.fixture
def db_session() -> Session:
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
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
