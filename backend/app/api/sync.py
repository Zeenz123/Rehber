from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.models import SyncRecord
from app.schemas.schemas import BatchSyncRequest, BatchSyncResponse, SyncRecordItem
from app.services.sync.sync_service import SyncService

router = APIRouter(prefix="/sync", tags=["Offline Synchronization"])


@router.post("/batch", response_model=BatchSyncResponse)
async def batch_sync(batch: BatchSyncRequest, db: AsyncSession = Depends(get_db)):
    """
    Primary endpoint for Android offline-first synchronization.
    Receives batch of locally accumulated actions, performs idempotency checks,
    and returns processed record IDs for client-side local database updates.
    """
    return await SyncService.process_batch(db, batch)


@router.get("/records", response_model=List[SyncRecordItem])
async def get_sync_records(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """
    Returns recent sync records for the Web Offline Synchronization Monitor.
    """
    res = await db.execute(
        select(SyncRecord).order_by(desc(SyncRecord.synced_at)).limit(limit)
    )
    return res.scalars().all()

