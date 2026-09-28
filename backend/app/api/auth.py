import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import User, Student, Teacher
from app.schemas.schemas import LoginRequest, TokenResponse
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Rural-resilient login: Supports Student ID (e.g. STU101) or Teacher Email.
    """
    ident = req.identifier.strip()

    # Check if student ID
    stu_res = await db.execute(select(Student).where(Student.id == ident))
    student = stu_res.scalar_one_or_none()
    if student:
        token = f"rehber-stu-token-{student.id}-{uuid.uuid4().hex[:8]}"
        return TokenResponse(
            access_token=token,
            role="STUDENT",
            user_id=student.id,
            student_id=student.id
        )

    # Check teacher user
    user_res = await db.execute(select(User).where(User.email == ident))
    user = user_res.scalar_one_or_none()
    if user:
        token = f"rehber-teacher-token-{user.id}-{uuid.uuid4().hex[:8]}"
        return TokenResponse(
            access_token=token,
            role=user.role,
            user_id=user.id,
            student_id=None
        )

    # If demo student ID doesn't exist yet, auto-provision for prototype convenience
    if ident.upper().startswith("STU"):
        new_stu = Student(
            id=ident.upper(),
            name=f"Student {ident.upper()}",
            grade=6,
            language="urdu",
            learning_band="ON_TRACK",
            overall_mastery=0.5,
            theta_ability=0.0
        )
        db.add(new_stu)
        await db.commit()
        token = f"rehber-stu-token-{new_stu.id}-{uuid.uuid4().hex[:8]}"
        return TokenResponse(
            access_token=token,
            role="STUDENT",
            user_id=new_stu.id,
            student_id=new_stu.id
        )

    raise HTTPException(status_code=401, detail="Invalid identifier or credentials")
