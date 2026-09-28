from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import School, Student, Teacher, StudentRegistry, Subject, User
from app.api.deps import require_admin
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/schools")
async def get_schools(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(School))
    return res.scalars().all()

@router.get("/students")
async def get_students(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Student))
    return res.scalars().all()

@router.get("/teachers")
async def get_teachers(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Teacher))
    return res.scalars().all()

@router.get("/student-registry")
async def get_registry(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(StudentRegistry))
    return res.scalars().all()

@router.get("/curriculum")
async def get_curriculum(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Subject))
    return res.scalars().all()
