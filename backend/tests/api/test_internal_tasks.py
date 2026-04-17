from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, update

from app.core.config import settings
from app.core.db import get_session
from app.db.models.task import ProcessingTaskRecord
from app.main import app


@pytest.fixture
def client(db_session) -> TestClient:
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_session, None)


@pytest.fixture
def task_factory(db_session):
    def _create(**overrides) -> ProcessingTaskRecord:
        task = ProcessingTaskRecord(
            task_type=overrides.pop("task_type", "embed_image"),
            status=overrides.pop("status", "pending"),
            payload_json=overrides.pop(
                "payload_json", '{"image_path":"/tmp/demo.png","tags":[]}'
            ),
            lease_owner=overrides.pop("lease_owner", None),
            lease_expires_at=overrides.pop("lease_expires_at", None),
            **overrides,
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)
        return task

    return _create


@pytest.fixture
def internal_headers(monkeypatch) -> dict[str, str]:
    monkeypatch.setattr(settings, "internal_worker_api_key", "test-internal-api-key")
    return {"X-Internal-API-Key": "test-internal-api-key"}


def test_worker_can_lease_the_oldest_pending_task_of_requested_type(
    client,
    db_session,
    task_factory,
    internal_headers,
) -> None:
    now = datetime.now(timezone.utc)
    oldest = task_factory(
        task_type="embed_image",
        status="pending",
        payload_json='{"image_path":"/tmp/oldest.png","tags":["action:举手"]}',
        created_at=now - timedelta(minutes=3),
    )
    task_factory(
        task_type="embed_image",
        status="pending",
        payload_json='{"image_path":"/tmp/newer.png","tags":["action:举手"]}',
        created_at=now - timedelta(minutes=1),
    )
    task_factory(
        task_type="scan_duplicates",
        status="pending",
        payload_json='{"image_path":"/tmp/other.png","tags":[]}',
        created_at=now - timedelta(minutes=5),
    )
    task_factory(
        task_type="embed_image",
        status="leased",
        payload_json='{"image_path":"/tmp/already-leased.png","tags":[]}',
        created_at=now - timedelta(minutes=6),
    )

    response = client.post(
        "/internal/tasks/lease",
        json={"worker_id": "gpu-box", "task_types": ["embed_image"]},
        headers=internal_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["task"]["id"] == oldest.id
    assert body["task"]["task_type"] == "embed_image"
    assert body["task"]["status"] == "leased"
    assert body["task"]["lease_owner"] == "gpu-box"
    assert body["task"]["payload"] == {
        "image_path": "/tmp/oldest.png",
        "tags": ["action:举手"],
    }

    leased_row = db_session.scalar(
        select(ProcessingTaskRecord).where(ProcessingTaskRecord.id == oldest.id)
    )
    assert leased_row is not None
    assert leased_row.status == "leased"
    assert leased_row.lease_owner == "gpu-box"
    assert leased_row.lease_expires_at is not None


def test_worker_can_reacquire_expired_leased_task(
    client,
    db_session,
    task_factory,
    internal_headers,
) -> None:
    now = datetime.now(timezone.utc)
    expired_task = task_factory(
        task_type="embed_image",
        status="leased",
        lease_owner="stale-worker",
        lease_expires_at=now - timedelta(minutes=1),
        payload_json='{"image_path":"/tmp/expired.png","tags":["action:举手"]}',
        created_at=now - timedelta(minutes=10),
    )
    previous_expiry = expired_task.lease_expires_at

    response = client.post(
        "/internal/tasks/lease",
        json={"worker_id": "fresh-worker", "task_types": ["embed_image"]},
        headers=internal_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["task"]["id"] == expired_task.id
    assert body["task"]["lease_owner"] == "fresh-worker"

    refreshed_row = db_session.scalar(
        select(ProcessingTaskRecord).where(ProcessingTaskRecord.id == expired_task.id)
    )
    assert refreshed_row is not None
    assert refreshed_row.status == "leased"
    assert refreshed_row.lease_owner == "fresh-worker"
    assert refreshed_row.lease_expires_at is not None
    assert refreshed_row.lease_expires_at != previous_expiry


@pytest.mark.parametrize(
    "headers",
    [None, {"X-Internal-API-Key": "wrong-key"}],
)
def test_internal_lease_requires_internal_api_key(
    client,
    task_factory,
    internal_headers,
    headers,
) -> None:
    task_factory(task_type="embed_image", status="pending")

    response = client.post(
        "/internal/tasks/lease",
        json={"worker_id": "gpu-box", "task_types": ["embed_image"]},
        headers=headers,
    )

    assert response.status_code == 401


def test_internal_lease_fails_when_api_key_is_not_configured(
    client,
    task_factory,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "internal_worker_api_key", None)
    task_factory(task_type="embed_image", status="pending")

    response = client.post(
        "/internal/tasks/lease",
        json={"worker_id": "gpu-box", "task_types": ["embed_image"]},
        headers={"X-Internal-API-Key": "anything"},
    )

    assert response.status_code == 503


def test_lease_retries_when_selected_candidate_becomes_ineligible_before_update(
    client,
    db_session,
    task_factory,
    monkeypatch,
    internal_headers,
) -> None:
    now = datetime.now(timezone.utc)
    first_task = task_factory(
        task_type="embed_image",
        status="pending",
        payload_json='{"image_path":"/tmp/first.png","tags":[]}',
        created_at=now - timedelta(minutes=10),
    )
    second_task = task_factory(
        task_type="embed_image",
        status="pending",
        payload_json='{"image_path":"/tmp/second.png","tags":[]}',
        created_at=now - timedelta(minutes=5),
    )

    original_execute = db_session.execute
    intercepted = {"done": False}

    def _intercept_execute(statement, *args, **kwargs):
        if statement.__class__.__name__ == "Update" and not intercepted["done"]:
            intercepted["done"] = True
            db_session.connection().execute(
                update(ProcessingTaskRecord)
                .where(ProcessingTaskRecord.id == first_task.id)
                .values(
                    status="completed",
                    lease_owner="other-worker",
                    lease_expires_at=now + timedelta(minutes=5),
                )
            )
        return original_execute(statement, *args, **kwargs)

    monkeypatch.setattr(db_session, "execute", _intercept_execute)

    response = client.post(
        "/internal/tasks/lease",
        json={"worker_id": "gpu-box", "task_types": ["embed_image"]},
        headers=internal_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["task"]["id"] == second_task.id
