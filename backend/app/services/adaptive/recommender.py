from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.models import Module, StudentProgress, StudentMastery


class AdaptiveRecommender:
    @classmethod
    async def get_next_recommendation(
        cls, db: AsyncSession, student_id: str, current_module_id: Optional[str] = None
    ) -> str:
        """
        Determines the most appropriate next pedagogical module for the student.
        Rules:
        1. If a topic has mastery < 0.45, recommend remediation / revision.
        2. Otherwise, recommend next uncompleted module in order.
        3. If all completed, recommend advanced review module.
        """
        # Check weak topics first
        weak_query = select(StudentMastery).where(
            and_(StudentMastery.student_id == student_id, StudentMastery.mastery_score < 0.45)
        ).order_by(StudentMastery.mastery_score.asc())
        weak_res = await db.execute(weak_query)
        weakest = weak_res.scalars().first()

        if weakest:
            return f"REV_{weakest.topic.upper().replace(' ', '_')}"

        # Otherwise find next uncompleted module
        all_modules_res = await db.execute(select(Module).order_by(Module.order_index.asc()))
        modules = all_modules_res.scalars().all()

        completed_query = select(StudentProgress.module_id).where(
            and_(StudentProgress.student_id == student_id, StudentProgress.status == "COMPLETED")
        )
        comp_res = await db.execute(completed_query)
        completed_ids = set(comp_res.scalars().all())

        for mod in modules:
            if mod.id not in completed_ids:
                return mod.id

        return modules[-1].id if modules else "MOD_MATH_01"
