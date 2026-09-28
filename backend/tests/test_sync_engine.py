import pytest
from datetime import datetime
from app.services.sync.sync_service import SyncService
from app.schemas.schemas import BatchSyncRequest, ClientSyncItem
from app.models.models import Student, QuizAttempt, StudentProgress, SyncRecord
from sqlalchemy import select


@pytest.mark.asyncio
async def test_batch_sync_registration_and_progress(test_db):
    batch = BatchSyncRequest(
        student_id="STU_SYNC_01",
        client_timestamp=datetime.utcnow(),
        records=[
            ClientSyncItem(
                id="rec-001",
                operation_type="REG",
                payload={"name": "Hamza Ali", "grade": 6, "language": "urdu"},
                created_at=datetime.utcnow()
            ),
            ClientSyncItem(
                id="rec-002",
                operation_type="PROGRESS",
                payload={"module_id": "MOD_MATH_01", "score": 85.0, "time_spent_sec": 600, "status": "COMPLETED"},
                created_at=datetime.utcnow()
            )
        ]
    )

    resp = await SyncService.process_batch(test_db, batch)
    assert resp.status == "OK"
    assert "rec-001" in resp.processed_ids
    assert "rec-002" in resp.processed_ids
    assert len(resp.failed_ids) == 0

    # Verify student was created
    res = await test_db.execute(select(Student).where(Student.id == "STU_SYNC_01"))
    stu = res.scalar_one_or_none()
    assert stu is not None
    assert stu.name == "Hamza Ali"


@pytest.mark.asyncio
async def test_batch_sync_idempotency_duplicate_prevention(test_db):
    batch = BatchSyncRequest(
        student_id="STU_SYNC_02",
        client_timestamp=datetime.utcnow(),
        records=[
            ClientSyncItem(
                id="duplicate-uuid-123",
                operation_type="QUIZ",
                payload={"quiz_id": "QZ_MATH_01", "score": 90.0, "answers": {"Q1": "A"}},
                created_at=datetime.utcnow()
            )
        ]
    )

    # First attempt
    resp1 = await SyncService.process_batch(test_db, batch)
    assert resp1.status == "OK"
    assert "duplicate-uuid-123" in resp1.processed_ids

    # Second attempt with identical client UUID
    resp2 = await SyncService.process_batch(test_db, batch)
    assert resp2.status == "OK"
    assert "duplicate-uuid-123" in resp2.processed_ids

    # Verify only ONE SyncRecord exists for that client UUID
    records_res = await test_db.execute(
        select(SyncRecord).where(SyncRecord.client_record_id == "duplicate-uuid-123")
    )
    records = records_res.scalars().all()
    assert len(records) == 1
