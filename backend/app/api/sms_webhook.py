from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import SmsMessage, StudentRegistry, Student, QuizAttempt
from app.services.ai_service import get_ai_provider

router = APIRouter(prefix="/sms", tags=["SMS Fallback"])

class SmsPayload(BaseModel):
    sender: str
    message: str

@router.post("/webhook")
async def sms_webhook(payload: SmsPayload, db: AsyncSession = Depends(get_db)):
    # Keep the previously defined protocol: [StudentID]#[ActionCode]#[PayloadData]
    msg = SmsMessage(direction="INBOUND", sender_number=payload.sender, raw_text=payload.message)
    db.add(msg)
    
    parts = payload.message.split("#")
    if len(parts) >= 2:
        student_id, action_code = parts[0], parts[1]
        msg.student_id = student_id
        msg.action_code = action_code
        
        res = await db.execute(select(StudentRegistry).where(StudentRegistry.government_school_student_id == student_id))
        reg = res.scalar_one_or_none()
        
        if reg and reg.linked_user_id:
            res_stu = await db.execute(select(Student).where(Student.user_id == reg.linked_user_id))
            student = res_stu.scalar_one_or_none()
            if student:
                if action_code == "QZ" and len(parts) >= 3:
                    qz_data = parts[2].split("|")
                    if len(qz_data) >= 1:
                        att = QuizAttempt(student_id=student.id, quiz_id=qz_data[0], score=1.0, transport="SMS")
                        db.add(att)
                        msg.response_text = "Quiz recorded via SMS"
                elif action_code == "ASK":
                    msg.response_text = get_ai_provider().generate_response({"student": student.name, "grade": student.grade, "question": parts[2]})
                elif action_code == "PGR":
                    msg.response_text = "Your mastery is 50%"
                else:
                    msg.response_text = "Unknown action"
            else:
                msg.response_text = "Student account error"
        else:
            msg.response_text = "Invalid Student ID"
    else:
        msg.status = "ERROR"
        msg.response_text = "Invalid format"
        
    await db.commit()
    return {"success": True, "reply": msg.response_text}
