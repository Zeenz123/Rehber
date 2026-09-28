from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Student
from sms_protocol import ParsedSmsMessage, ActionCode, SmsProtocolException


class SmsValidator:
    MAX_SMS_LENGTH = 320  # Double-segment GSM SMS standard max for cellular payload

    @classmethod
    def validate_length(cls, raw_text: str):
        if len(raw_text) > cls.MAX_SMS_LENGTH:
            raise SmsProtocolException("ERR_PAYLOAD_TOO_LARGE", f"SMS length {len(raw_text)} exceeds max limit {cls.MAX_SMS_LENGTH}")

    @classmethod
    async def validate_student_context(
        cls, db: AsyncSession, parsed: ParsedSmsMessage
    ) -> Tuple[bool, Optional[Student]]:
        """
        Validates that the student exists in the system.
        If action is REG, student may not exist yet.
        """
        result = await db.execute(select(Student).where(Student.id == parsed.student_id))
        student = result.scalar_one_or_none()

        if parsed.action_code == ActionCode.REG:
            # Registration is allowed even if student does not exist yet
            return True, student

        if not student:
            raise SmsProtocolException(
                "ERR_STUDENT_NOT_FOUND",
                f"Student ID '{parsed.student_id}' is not registered. Send REG first."
            )

        return True, student
