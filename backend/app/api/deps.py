from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.models import User, Student

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/teacher/login")

async def get_current_user_or_student(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    sub = payload.get("sub")
    if sub is None:
        raise credentials_exception
        
    # 'sub' contains the user_id or student_id. We also encoded role in the token.
    # Let's decode role to know which table to query.
    role = payload.get("role")
    
    if role == "STUDENT":
        res = await db.execute(select(Student).where(Student.id == sub))
        student = res.scalar_one_or_none()
        if student is None:
            raise credentials_exception
        return {"entity": student, "role": "STUDENT"}
    else:
        res = await db.execute(select(User).where(User.id == sub))
        user = res.scalar_one_or_none()
        if user is None:
            raise credentials_exception
        return {"entity": user, "role": user.role}

async def require_student(current = Depends(get_current_user_or_student)):
    if current["role"] != "STUDENT":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current["entity"]

async def require_teacher(current = Depends(get_current_user_or_student)):
    if current["role"] not in ["TEACHER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current["entity"]

async def require_admin(current = Depends(get_current_user_or_student)):
    if current["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current["entity"]
