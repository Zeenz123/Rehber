from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Student, StudentProgress, StudentMastery, LearningRecommendation
from app.schemas.schemas import StudentCreate, StudentResponse

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("/", response_model=StudentResponse)
async def create_student(data: StudentCreate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Student).where(Student.id == data.id))
    existing = res.scalar_one_or_none()
    if existing:
        existing.name = data.name
        existing.grade = data.grade
        existing.language = data.language
        existing.phone_number = data.phone_number
        await db.commit()
        await db.refresh(existing)
        return existing

    student = Student(
        id=data.id,
        name=data.name,
        grade=data.grade,
        language=data.language,
        school_id=data.school_id,
        phone_number=data.phone_number,
        learning_band="ON_TRACK",
        overall_mastery=0.5,
        theta_ability=0.0
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Student).where(Student.id == student_id))
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.get("/", response_model=List[StudentResponse])
async def list_students(limit: int = 50, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Student).limit(limit))
    return res.scalars().all()
