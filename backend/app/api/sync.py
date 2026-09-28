from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import SyncRecord, StudentProgress, StudentMastery, QuizAttempt, Student
from app.api.deps import require_student

router = APIRouter(prefix="/sync", tags=["Offline Synchronization"])

class PushRecord(BaseModel):
    client_id: str
    type: str
    payload: dict

class PushRequest(BaseModel):
    records: List[PushRecord]

@router.post("/push")
async def sync_push(req: PushRequest, student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    processed_ids = []
    
    for record in req.records:
        res = await db.execute(select(SyncRecord).where(SyncRecord.client_record_id == record.client_id))
        existing = res.scalar_one_or_none()
        
        if existing:
            processed_ids.append(record.client_id)
            continue
            
        sync_rec = SyncRecord(
            client_record_id=record.client_id,
            student_id=student.id,
            operation_type=record.type,
            payload_json=record.payload
        )
        db.add(sync_rec)
        
        if record.type == "QUIZ":
            att = QuizAttempt(student_id=student.id, quiz_id=record.payload.get("quiz_id"), score=record.payload.get("score", 0), transport="OFFLINE_SYNC")
            db.add(att)
        elif record.type == "PROGRESS":
            prog = StudentProgress(student_id=student.id, module_id=record.payload.get("module_id"), status=record.payload.get("status"), score=record.payload.get("score", 0))
            db.add(prog)
            
        processed_ids.append(record.client_id)
        
    await db.commit()
    return {"success": True, "processed_ids": processed_ids}

@router.post("/pull")
async def sync_pull(student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(StudentProgress).where(StudentProgress.student_id == student.id))
    progress = res.scalars().all()
    
    res_m = await db.execute(select(StudentMastery).where(StudentMastery.student_id == student.id))
    mastery = res_m.scalars().all()
    
    return {
        "progress": [p.module_id for p in progress],
        "mastery": [m.topic for m in mastery]
    }
