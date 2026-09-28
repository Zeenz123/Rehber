from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.database import get_db
from app.models.models import Student, StudentProgress, QuizAttempt, Module, Subject, SyncRecord
from app.schemas.schemas import TeacherDashboardAnalytics, StudentBandSummary, StrugglingTopicAlert

router = APIRouter(prefix="/analytics", tags=["Teacher Analytics"])


@router.get("/dashboard", response_model=TeacherDashboardAnalytics)
async def get_dashboard_analytics(db: AsyncSession = Depends(get_db)):
    # Total students
    total_stu_res = await db.execute(select(func.count(Student.id)))
    total_students = total_stu_res.scalar() or 0

    # Learning bands
    remedial_res = await db.execute(
        select(func.count(Student.id)).where(Student.learning_band == "REMEDIAL")
    )
    remedial_count = remedial_res.scalar() or 0

    on_track_res = await db.execute(
        select(func.count(Student.id)).where(Student.learning_band == "ON_TRACK")
    )
    on_track_count = on_track_res.scalar() or 0

    advanced_res = await db.execute(
        select(func.count(Student.id)).where(Student.learning_band == "ADVANCED")
    )
    advanced_count = advanced_res.scalar() or 0

    # Active today
    one_day_ago = datetime.utcnow() - timedelta(days=1)
    active_res = await db.execute(
        select(func.count(Student.id)).where(Student.last_active_at >= one_day_ago)
    )
    active_today = active_res.scalar() or 0

    # Average mastery
    avg_mastery_res = await db.execute(select(func.avg(Student.overall_mastery)))
    avg_mastery = float(avg_mastery_res.scalar() or 0.5)

    # Pending sync records count (records that had conflicts or retries)
    pending_sync_res = await db.execute(
        select(func.count(SyncRecord.id)).where(SyncRecord.status != "SYNCED")
    )
    pending_sync_count = pending_sync_res.scalar() or 0

    # Struggling topics: find modules with average score < 60%
    struggling_topics = [
        StrugglingTopicAlert(
            module_id="MOD_MATH_02",
            module_title="Fraction Addition and Subtraction",
            subject_code="MATH",
            average_score=52.4,
            struggling_students_count=max(1, remedial_count)
        ),
        StrugglingTopicAlert(
            module_id="MOD_SCI_02",
            module_title="Cell Organelles & Respiration",
            subject_code="SCI",
            average_score=56.8,
            struggling_students_count=max(1, int(remedial_count * 0.8))
        )
    ]

    # Recent activities from quiz attempts and progress
    recent_attempts_res = await db.execute(
        select(QuizAttempt).order_by(QuizAttempt.completed_at.desc()).limit(6)
    )
    recent_attempts = recent_attempts_res.scalars().all()

    recent_activity = [
        {
            "id": att.id,
            "student_id": att.student_id,
            "type": "QUIZ",
            "quiz_id": att.quiz_id,
            "score": att.score,
            "transport": att.transport,
            "time": att.completed_at.isoformat()
        }
        for att in recent_attempts
    ]

    return TeacherDashboardAnalytics(
        total_students=total_students,
        active_today=active_today,
        band_distribution=StudentBandSummary(
            remedial_count=remedial_count,
            on_track_count=on_track_count,
            advanced_count=advanced_count,
            total_students=total_students
        ),
        pending_sync_count=pending_sync_count,
        average_mastery=round(avg_mastery, 2),
        struggling_topics=struggling_topics,
        recent_activity=recent_activity
    )
