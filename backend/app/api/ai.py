from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import Student, AiInteraction
from app.schemas.schemas import AiChatRequest, AiChatResponse
from app.services.ai.assistant import RehberAiAssistant
from app.services.adaptive.recommender import AdaptiveRecommender

router = APIRouter(prefix="/ai", tags=["Rehber AI Assistant"])


@router.post("/ask", response_model=AiChatResponse)
async def ask_ai(req: AiChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Online / Compressed HTTPS endpoint for Rehber AI educational tutoring.
    """
    res = await db.execute(select(Student).where(Student.id == req.student_id))
    student = res.scalar_one_or_none()

    student_name = student.name if student else "Learner"
    grade = student.grade if student else 6
    language = student.language if student else "urdu"
    band = student.learning_band if student else "ON_TRACK"

    start_time = datetime.utcnow()
    answer = await RehberAiAssistant.ask_question(
        student_name=student_name,
        grade=grade,
        language=language,
        query=req.prompt,
        learning_band=band,
        current_module=req.current_module_id
    )
    latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

    if student:
        interaction = AiInteraction(
            student_id=student.id,
            prompt=req.prompt,
            response=answer,
            transport=req.transport,
            latency_ms=latency_ms
        )
        db.add(interaction)
        await db.commit()

    rec_module = await AdaptiveRecommender.get_next_recommendation(db, req.student_id) if student else None

    return AiChatResponse(
        student_id=req.student_id,
        prompt=req.prompt,
        response=answer,
        transport=req.transport,
        is_fallback_rule=False,
        suggested_revision_module=rec_module
    )
