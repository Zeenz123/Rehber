from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import Subject, Module, Lesson, Question, User
from app.schemas.schemas import SubjectResponse, ModuleResponse, SubjectCreate
from app.api.deps import require_admin

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])

from fastapi.responses import JSONResponse

@router.post("/subjects")
async def create_subject(data: SubjectCreate, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    # Check duplicate ID
    res = await db.execute(select(Subject).where(Subject.id == data.id))
    if res.scalar_one_or_none():
        return JSONResponse(
            status_code=409,
            content={"success": False, "error": {"code": "DUPLICATE_SUBJECT", "message": "A subject with this ID already exists."}}
        )

    # Check duplicate Code
    res_code = await db.execute(select(Subject).where(Subject.code == data.code))
    if res_code.scalar_one_or_none():
        return JSONResponse(
            status_code=409,
            content={"success": False, "error": {"code": "DUPLICATE_SUBJECT_CODE", "message": "A subject with this code already exists."}}
        )

    subject = Subject(
        id=data.id,
        code=data.code,
        name=data.name,
        grade=data.grade,
        description=data.description,
        icon=data.icon
    )
    db.add(subject)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "error": {"code": "DB_ERROR", "message": str(e)}})
    
    return {
        "success": True,
        "message": "Subject created successfully",
        "subject": {
            "id": subject.id,
            "subject_id": subject.id,
            "subject_code": subject.code,
            "subject_name": subject.name,
            "description": subject.description,
            "icon": subject.icon
        }
    }


@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(grade: int = 6, db: AsyncSession = Depends(get_db)):
    query = (
        select(Subject)
        .where(Subject.grade == grade)
        .options(
            selectinload(Subject.modules).selectinload(Module.lessons).selectinload(Lesson.questions)
        )
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/bundle")
async def get_curriculum_bundle(grade: int = 6, db: AsyncSession = Depends(get_db)):
    """
    Returns the complete pre-installable curriculum bundle for offline SQLite caching.
    """
    query = (
        select(Subject)
        .where(Subject.grade == grade)
        .options(
            selectinload(Subject.modules).selectinload(Module.lessons).selectinload(Lesson.questions)
        )
    )
    result = await db.execute(query)
    subjects = result.scalars().all()

    bundle = {
        "version": "2025.1.0",
        "grade": grade,
        "subjects": [
            {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "description": s.description,
                "icon": s.icon,
                "modules": [
                    {
                        "id": m.id,
                        "title": m.title,
                        "order_index": m.order_index,
                        "difficulty_level": m.difficulty_level,
                        "lessons": [
                            {
                                "id": l.id,
                                "title": l.title,
                                "concept_summary": l.concept_summary,
                                "audio_script": l.audio_script,
                                "order_index": l.order_index,
                                "questions": [
                                    {
                                        "id": q.id,
                                        "prompt": q.prompt,
                                        "option_a": q.option_a,
                                        "option_b": q.option_b,
                                        "option_c": q.option_c,
                                        "option_d": q.option_d,
                                        "correct_option": q.correct_option,
                                        "explanation": q.explanation,
                                        "difficulty": q.difficulty,
                                        "irt_b": q.irt_b
                                    }
                                    for q in l.questions
                                ]
                            }
                            for l in m.lessons
                        ]
                    }
                    for m in s.modules
                ]
            }
            for s in subjects
        ]
    }
    return bundle

