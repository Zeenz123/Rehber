from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import AiInteraction, Student
from app.api.deps import require_student
from app.services.ai_service import get_ai_provider

router = APIRouter(prefix="/ai", tags=["AI Tutor"])

class AiRequest(BaseModel):
    subject: str
    topic: str
    question: str
    recent_mistake: str = None

@router.post("/ask")
async def ask_ai(req: AiRequest, student: Student = Depends(require_student), db: AsyncSession = Depends(get_db)):
    provider = get_ai_provider()
    
    context = {
        "student": student.name,
        "grade": student.grade,
        "subject": req.subject,
        "topic": req.topic,
        "recent_mistake": req.recent_mistake,
        "question": req.question
    }
    
    response_text = provider.generate_response(context)
    
    interaction = AiInteraction(
        student_id=student.id,
        prompt=req.question,
        response=response_text,
        transport="HTTPS"
    )
    db.add(interaction)
    await db.commit()
    
    return {"success": True, "response": response_text}
