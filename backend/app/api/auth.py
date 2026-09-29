from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import User, Student, Teacher, StudentRegistry
from app.core.security import create_access_token, verify_password, get_password_hash
from app.api.deps import require_student, require_teacher, require_admin, get_current_user_or_student

router = APIRouter(prefix="/auth", tags=["Authentication"])

class StudentLoginRequest(BaseModel):
    government_school_student_id: str
    password: str

class EmployeeLoginRequest(BaseModel):
    email: str
    password: str

@router.post("/student/login")
async def student_login(req: StudentLoginRequest, db: AsyncSession = Depends(get_db)):
    # 1. Verify student exists in registry
    res = await db.execute(select(StudentRegistry).where(StudentRegistry.government_school_student_id == req.government_school_student_id))
    registry_entry = res.scalar_one_or_none()
    
    if not registry_entry or registry_entry.status != "ACTIVE":
        raise HTTPException(status_code=401, detail="Student ID not found in registry or inactive")
        
    if not registry_entry.linked_user_id:
        raise HTTPException(status_code=401, detail="Student account not fully provisioned")
        
    res_user = await db.execute(select(User).where(User.id == registry_entry.linked_user_id))
    user = res_user.scalar_one_or_none()
    
    if not user or user.role != "STUDENT":
        raise HTTPException(status_code=401, detail="Invalid student account")
        
    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    res_stu = await db.execute(select(Student).where(Student.user_id == user.id))
    student = res_stu.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=401, detail="Student profile not found")

    token = create_access_token(subject=student.id, role="STUDENT")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": student.id,
            "role": "STUDENT",
            "name": student.name
        }
    }

@router.post("/teacher/login")
async def teacher_login(req: EmployeeLoginRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == req.email))
    user = res.scalar_one_or_none()
    
    if not user or user.role != "TEACHER" or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    res_tch = await db.execute(select(Teacher).where(Teacher.user_id == user.id))
    teacher = res_tch.scalar_one_or_none()
    
    token = create_access_token(subject=user.id, role="TEACHER")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "role": "TEACHER",
            "name": teacher.name if teacher else user.email
        }
    }

@router.post("/admin/login")
async def admin_login(req: EmployeeLoginRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == req.email))
    user = res.scalar_one_or_none()
    
    if not user or user.role != "ADMIN" or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token(subject=user.id, role="ADMIN")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "role": "ADMIN",
            "email": user.email
        }
    }

@router.get("/me")
async def get_me(current = Depends(get_current_user_or_student)):
    return {
        "user": {
            "id": current["entity"].id,
            "role": current["role"],
            "name": getattr(current["entity"], "name", getattr(current["entity"], "email", "Unknown"))
        }
    }

@router.post("/logout")
async def logout():
    return {"success": True, "message": "Logged out successfully"}
from fastapi.responses import JSONResponse
from app.schemas.schemas import UserCreate
import hashlib

def hash_password(password: str) -> str:
    from app.core.security import get_password_hash
    return get_password_hash(password)

@router.post("/users")
async def create_user(req: UserCreate, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    if req.email:
        res = await db.execute(select(User).where(User.email == req.email))
        if res.scalar_one_or_none():
            return JSONResponse(
                status_code=409,
                content={"success": False, "error": {"code": "DUPLICATE_USER", "message": "A user with this email already exists."}}
            )

    new_user = User(
        email=req.email,
        phone_number=req.phone_number,
        hashed_password=hash_password(req.password),
        role=req.role
    )
    db.add(new_user)
    
    try:
        await db.flush()
    except Exception as e:
        await db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "error": {"code": "DB_ERROR", "message": str(e)}})

    teacher = Teacher(
        user_id=new_user.id,
        name=req.name
    )
    db.add(teacher)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "error": {"code": "DB_ERROR", "message": str(e)}})
    
    return {
        "success": True,
        "message": f"{req.role.capitalize()} created successfully",
        "user": {
            "id": new_user.id,
            "name": req.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }

class GoogleLoginRequest(BaseModel):
    email: str
    role: str = "STUDENT"  # STUDENT, TEACHER, ADMIN

@router.post("/google")
async def google_login(req: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    if not req.email.endswith("@govschool.edu.pk"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized Domain. Only @govschool.edu.pk accounts are permitted."
        )
    
    # Check if user exists
    res = await db.execute(select(User).where(User.email == req.email))
    user = res.scalar_one_or_none()

    if not user:
        # Auto-register since they have the correct domain
        user = User(email=req.email, role=req.role)
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Also create their specific profile
        if req.role == "STUDENT":
            student_id = f"GOV-SCH-{(user.id[:4]).upper()}-STU-0001"
            student = Student(id=student_id, user_id=user.id, name=req.email.split("@")[0])
            db.add(student)
            
            # Add to registry
            registry = StudentRegistry(government_school_student_id=student_id, student_name=student.name, linked_user_id=user.id)
            db.add(registry)
        elif req.role in ["TEACHER", "ADMIN"]:
            teacher = Teacher(user_id=user.id, name=req.email.split("@")[0])
            db.add(teacher)
            
        await db.commit()

    # Generate token
    sub_id = user.id
    if req.role == "STUDENT":
        res_stu = await db.execute(select(Student).where(Student.user_id == user.id))
        student_profile = res_stu.scalar_one_or_none()
        if student_profile:
            sub_id = student_profile.id

    access_token = create_access_token(data={"sub": sub_id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "student_id": sub_id}
