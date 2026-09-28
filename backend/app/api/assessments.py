from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Student, Question, QuizAttempt
from app.schemas.schemas import QuizSubmitRequest, QuizSubmitResponse
from app.services.adaptive.irt_engine import IrtAdaptiveEngine
from app.services.adaptive.recommender import AdaptiveRecommender

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(req: QuizSubmitRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Student).where(Student.id == req.student_id))
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Evaluate answers
    question_ids = list(req.answers.keys())
    q_res = await db.execute(select(Question).where(Question.id.in_(question_ids)))
    questions = {q.id: q for q in q_res.scalars().all()}

    correct_count = 0
    items_for_irt = []

    for q_id, chosen in req.answers.items():
        q_obj = questions.get(q_id)
        b_val = q_obj.irt_b if q_obj else 0.0
        correct_choice = q_obj.correct_option if q_obj else "A"
        is_corr = (chosen.strip().upper() == correct_choice.strip().upper())
        if is_corr:
            correct_count += 1
        items_for_irt.append((b_val, is_corr))

    total = max(len(req.answers), 1)
    score = (correct_count / total) * 100.0

    # IRT ability update
    curr_theta = student.theta_ability or 0.0
    new_theta, new_mastery, new_band = IrtAdaptiveEngine.update_ability(curr_theta, items_for_irt)

    student.theta_ability = new_theta
    student.overall_mastery = new_mastery
    student.learning_band = new_band
    student.last_active_at = datetime.utcnow()

    # Save attempt
    attempt = QuizAttempt(
        student_id=student.id,
        quiz_id=req.quiz_id,
        score=score,
        answers_json=req.answers,
        transport=req.transport,
        is_synced=True
    )
    db.add(attempt)
    await db.commit()

    next_rec = await AdaptiveRecommender.get_next_recommendation(db, student.id)

    return QuizSubmitResponse(
        student_id=student.id,
        quiz_id=req.quiz_id,
        score=score,
        correct_count=correct_count,
        total_count=total,
        updated_mastery=new_mastery,
        theta_ability=new_theta,
        learning_band=new_band,
        recommendation=next_rec
    )
