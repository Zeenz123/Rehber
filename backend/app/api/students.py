from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Student, StudentProgress, StudentMastery, LearningRecommendation, QuizAttempt, Subject
from app.api.deps import require_student

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/me")
async def get_me(student: Student = Depends(require_student)):
    return {
        "id": student.id,
        "name": student.name,
        "grade": student.grade,
        "language": student.language,
        "overall_mastery": student.overall_mastery
    }

@router.get("/me/progress")
async def get_my_progress(student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(StudentProgress).where(StudentProgress.student_id == student.id))
    progress = res.scalars().all()
    return progress

@router.get("/me/mastery")
async def get_my_mastery(student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(StudentMastery).where(StudentMastery.student_id == student.id))
    mastery = res.scalars().all()
    return mastery

@router.get("/me/recommendations")
async def get_my_recommendations(student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LearningRecommendation).where(LearningRecommendation.student_id == student.id))
    recs = res.scalars().all()
    return recs

@router.get("/me/curriculum")
async def get_my_curriculum(student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Subject).where(Subject.grade == student.grade))
    subjects = res.scalars().all()
    return subjects

from pydantic import BaseModel
class QuizSubmission(BaseModel):
    quiz_id: str
    score: float
    answers_json: dict

@router.post("/me/quiz")
async def submit_quiz(data: QuizSubmission, student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    attempt = QuizAttempt(
        student_id=student.id,
        quiz_id=data.quiz_id,
        score=data.score,
        answers_json=data.answers_json,
        transport="HTTPS"
    )
    db.add(attempt)
    # Adaptive learning mock update
    student.overall_mastery = min(1.0, student.overall_mastery + (data.score * 0.01))
    await db.commit()
    return {"success": True, "message": "Quiz submitted successfully"}

class ProgressSubmission(BaseModel):
    module_id: str
    lesson_id: str = None
    status: str
    score: float
    time_spent_sec: int

@router.post("/me/progress")
async def submit_progress(data: ProgressSubmission, student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    progress = StudentProgress(
        student_id=student.id,
        module_id=data.module_id,
        lesson_id=data.lesson_id,
        status=data.status,
        score=data.score,
        time_spent_sec=data.time_spent_sec
    )
    db.add(progress)
    await db.commit()
    return {"success": True, "message": "Progress updated"}
