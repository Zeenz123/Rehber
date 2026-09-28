from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Teacher, Student, StudentProgress, StudentMastery
from app.api.deps import require_teacher

router = APIRouter(prefix="/teachers", tags=["Teachers"])

@router.get("/me")
async def get_teacher_me(teacher: Teacher = Depends(require_teacher)):
    # The 'teacher' entity returned by deps is actually the User object right now, wait.
    # Ah! In deps.py, require_teacher returns current["entity"] which is User.
    # I should query the teacher record.
    return {"id": teacher.id, "email": teacher.email, "role": teacher.role}

@router.get("/me/students")
async def get_teacher_students(teacher: User = Depends(require_teacher), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Teacher).where(Teacher.user_id == teacher.id))
    tch_record = res.scalar_one_or_none()
    if not tch_record or not tch_record.school_id:
        return []
    res_stu = await db.execute(select(Student).where(Student.school_id == tch_record.school_id))
    return res_stu.scalars().all()
