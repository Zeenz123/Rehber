from datetime import datetime
from typing import Dict, Any, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Student, SyncRecord, QuizAttempt, StudentProgress, AiInteraction
from app.schemas.schemas import BatchSyncRequest, BatchSyncResponse
from app.services.adaptive.irt_engine import IrtAdaptiveEngine


class SyncService:
    @classmethod
    async def process_batch(cls, db: AsyncSession, batch: BatchSyncRequest) -> BatchSyncResponse:
        processed_ids: List[str] = []
        failed_ids: List[str] = []
        conflicts: List[Dict[str, Any]] = []

        # Find or ensure student exists
        stu_res = await db.execute(select(Student).where(Student.id == batch.student_id))
        student = stu_res.scalar_one_or_none()

        for item in batch.records:
            try:
                # 1. Idempotency Check: check if client_record_id was already processed
                existing_res = await db.execute(
                    select(SyncRecord).where(SyncRecord.client_record_id == item.id)
                )
                if existing_res.scalar_one_or_none():
                    # Already synced, acknowledge without reprocessing
                    processed_ids.append(item.id)
                    continue

                op = item.operation_type.upper()
                p = item.payload

                if op == "REG":
                    if not student:
                        student = Student(
                            id=batch.student_id,
                            name=p.get("name", "Student"),
                            grade=int(p.get("grade", 6)),
                            language=p.get("language", "urdu"),
                            learning_band="ON_TRACK",
                            overall_mastery=0.5
                        )
                        db.add(student)
                    else:
                        student.name = p.get("name", student.name)
                        student.grade = int(p.get("grade", student.grade))
                        student.language = p.get("language", student.language)

                elif op == "QUIZ":
                    if student:
                        score = float(p.get("score", 0.0))
                        attempt = QuizAttempt(
                            student_id=student.id,
                            quiz_id=p.get("quiz_id", "QZ_UNKNOWN"),
                            score=score,
                            answers_json=p.get("answers", {}),
                            transport="OFFLINE_SYNC",
                            is_synced=True,
                            completed_at=datetime.utcnow()
                        )
                        db.add(attempt)

                        # Update student mastery
                        old_theta = student.theta_ability or 0.0
                        delta = (score - 50.0) / 100.0
                        new_theta = max(-3.0, min(3.0, old_theta + delta * 0.4))
                        student.theta_ability = new_theta
                        student.overall_mastery = IrtAdaptiveEngine.theta_to_mastery(new_theta)
                        student.learning_band = IrtAdaptiveEngine.classify_band(new_theta)

                elif op == "PROGRESS":
                    if student:
                        prog = StudentProgress(
                            student_id=student.id,
                            module_id=p.get("module_id", ""),
                            lesson_id=p.get("lesson_id"),
                            score=float(p.get("score", 0.0)),
                            time_spent_sec=int(p.get("time_spent_sec", 0)),
                            status=p.get("status", "COMPLETED")
                        )
                        db.add(prog)

                elif op == "AI_CHAT":
                    if student:
                        chat_log = AiInteraction(
                            student_id=student.id,
                            prompt=p.get("prompt", ""),
                            response=p.get("response", ""),
                            transport="OFFLINE_SYNC",
                            latency_ms=int(p.get("latency_ms", 0))
                        )
                        db.add(chat_log)

                # Record sync item
                sync_rec = SyncRecord(
                    client_record_id=item.id,
                    student_id=batch.student_id,
                    operation_type=op,
                    payload_json=p,
                    status="SYNCED",
                    ack_code="ACK_OK",
                    synced_at=datetime.utcnow()
                )
                db.add(sync_rec)
                processed_ids.append(item.id)

            except Exception as e:
                failed_ids.append(item.id)
                conflicts.append({"id": item.id, "error": str(e)})

        if student:
            student.last_active_at = datetime.utcnow()

        await db.commit()

        overall_status = "OK" if not failed_ids else ("PARTIAL" if processed_ids else "FAILED")
        return BatchSyncResponse(
            status=overall_status,
            processed_ids=processed_ids,
            failed_ids=failed_ids,
            conflicts=conflicts,
            server_timestamp=datetime.utcnow()
        )
