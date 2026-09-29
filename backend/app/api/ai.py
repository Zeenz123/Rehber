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

from typing import List, Optional

class ChatMessage(BaseModel):
    sender: str
    text: str

class LearnerContext(BaseModel):
    grade: Optional[int] = None
    language: Optional[str] = None
    level: Optional[str] = None
    speed: Optional[str] = None
    weakTopics: Optional[List[str]] = None
    strongTopics: Optional[List[str]] = None

class ChatRequest(BaseModel):
    query: str
    mode: str
    history: Optional[List[ChatMessage]] = []
    learnerContext: Optional[LearnerContext] = None

@router.post("/chat")
async def chat_ai(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    provider = get_ai_provider()
    
    # We will simulate a student context if no token is provided for prototype ease
    # The frontend currently doesn't send the auth token for this fetch.
    context = {
        "student": "Student",
        "grade": req.learnerContext.grade if req.learnerContext else "unknown",
        "question": req.query,
    }
    
    if req.history:
        # Pass some history context to the prompt
        hist_text = "\n".join([f"{m.sender}: {m.text}" for m in req.history[-3:]])
        context["question"] = f"Previous Chat:\n{hist_text}\n\nStudent: {req.query}"
    
    if req.learnerContext and req.learnerContext.weakTopics:
        context["recent_mistake"] = ", ".join(req.learnerContext.weakTopics)
        
    response_text = provider.generate_response(context)
    
    # We omit saving to AiInteraction for unauthenticated /chat calls for now, 
    # or save with a generic ID if needed.
    
    return {
        "text": response_text,
        "suggestedAction": None,
        "followUps": []
    }
