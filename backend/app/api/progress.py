from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Student, StudentProgress
from app.schemas.schemas import ProgressCheckpointRequest, ProgressResponse

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.post("/checkpoint", response_model=ProgressResponse)
async def record_checkpoint(req: ProgressCheckpointRequest, db: AsyncSession = Depends(get_db)):
    stu_res = await db.execute(select(Student).where(Student.id == req.student_id))
    student = stu_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    prog = StudentProgress(
        student_id=req.student_id,
        module_id=req.module_id,
        lesson_id=req.lesson_id,
        score=req.score,
        time_spent_sec=req.time_spent_sec,
        status=req.status,
        updated_at=datetime.utcnow()
    )
    db.add(prog)
    student.last_active_at = datetime.utcnow()
    await db.commit()
    await db.refresh(prog)

    return prog
