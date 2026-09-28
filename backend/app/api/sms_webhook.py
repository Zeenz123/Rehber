from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.models import SmsMessage
from app.schemas.schemas import SmsWebhookRequest, SmsWebhookResponse, SmsLogItem
from app.services.sms.parser import SmsParser
from app.services.sms.router import SmsRouter
from app.services.sms.response_builder import SmsResponseBuilder
from app.core.config import settings
from sms_protocol import SmsProtocolException

router = APIRouter(prefix="/sms", tags=["SMS Gateway"])



@router.post("/webhook", response_model=SmsWebhookResponse)
async def sms_webhook(
    req: SmsWebhookRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Cellular SMS Gateway webhook endpoint.
    Processes compact messages in format: [StudentID]#[ActionCode]#[PayloadData]
    """
    raw_body = req.body.strip()
    student_id = None
    action_code = None

    try:
        # 1. Parse SMS content
        parsed = SmsParser.parse_message(raw_body)
        student_id = parsed.student_id
        action_code = parsed.action_code.value

        # 2. Route & execute business logic
        reply_sms = await SmsRouter.route_and_execute(db, parsed)
        status = "PROCESSED"
        err_msg = None

    except SmsProtocolException as spe:
        reply_sms = SmsResponseBuilder.build_error(student_id or "UNKNOWN", spe.code, spe.message)
        status = "ERROR"
        err_msg = spe.message
    except Exception as ex:
        reply_sms = SmsResponseBuilder.build_error(student_id or "UNKNOWN", "ERR_SERVER", str(ex))
        status = "ERROR"
        err_msg = str(ex)

    # Log incoming and outgoing message
    log_entry = SmsMessage(
        direction="INBOUND",
        sender_number=req.from_number,
        raw_text=raw_body,
        student_id=student_id,
        action_code=action_code,
        status=status,
        response_text=reply_sms,
        error_details=err_msg,
        created_at=datetime.utcnow()
    )
    db.add(log_entry)
    await db.commit()

    return SmsWebhookResponse(
        status=status,
        student_id=student_id,
        action_code=action_code,
        reply_sms=reply_sms,
        is_simulated=True
    )


@router.get("/logs", response_model=List[SmsLogItem])
async def get_sms_logs(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """
    Returns recent cellular SMS messages for the Web Gateway Monitor.
    """
    res = await db.execute(
        select(SmsMessage).order_by(desc(SmsMessage.created_at)).limit(limit)
    )
    return res.scalars().all()


@router.post("/send", response_model=SmsLogItem)
async def send_teacher_sms(
    student_id: str,
    text: str,
    action_code: str = "TCH",
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for Web teacher/portal to dispatch an outbound SMS directly to student.
    """
    log_entry = SmsMessage(
        direction="OUTBOUND",
        sender_number="PORTAL",
        raw_text=f"{student_id}#{action_code}#{text}",
        student_id=student_id,
        action_code=action_code,
        status="DELIVERED",
        response_text=text,
        created_at=datetime.utcnow()
    )
    db.add(log_entry)
    await db.commit()
    return log_entry

