from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.models import Student, QuizAttempt, StudentProgress, StudentMastery, AiInteraction, Question
from app.services.sms.validator import SmsValidator
from app.services.sms.response_builder import SmsResponseBuilder
from app.services.adaptive.irt_engine import IrtAdaptiveEngine
from app.services.adaptive.recommender import AdaptiveRecommender
from app.services.ai.assistant import RehberAiAssistant
from sms_protocol import ParsedSmsMessage, ActionCode, SmsProtocolException


class SmsRouter:
    @classmethod
    async def route_and_execute(cls, db: AsyncSession, parsed: ParsedSmsMessage) -> str:
        """
        Executes business logic for an incoming cellular/SMS message and returns the reply string.
        """
        # Validate student existence or registration allowance
        _, student = await SmsValidator.validate_student_context(db, parsed)

        action = parsed.action_code

        if action == ActionCode.REG:
            # Registration: Name|Grade|Lang
            name = parsed.parsed_payload["name"]
            grade_val = int(parsed.parsed_payload["grade"])
            lang = parsed.parsed_payload["language"]

            if not student:
                student = Student(
                    id=parsed.student_id,
                    name=name,
                    grade=grade_val,
                    language=lang,
                    learning_band="ON_TRACK",
                    overall_mastery=0.5,
                    theta_ability=0.0
                )
                db.add(student)
            else:
                student.name = name
                student.grade = grade_val
                student.language = lang

            await db.commit()
            return SmsResponseBuilder.build_ack(parsed.student_id, status="OK", sync_code="REG_SUCCESS", details=name)

        elif action == ActionCode.QZ:
            # Quiz submission: QuizID|AnsString
            quiz_id = parsed.parsed_payload["quiz_id"]
            answers = parsed.parsed_payload["answers"]

            # Evaluate answers against database or simulated key
            q_res = await db.execute(select(Question).limit(10))
            db_questions = {q.id: q for q in q_res.scalars().all()}

            correct_count = 0
            items_for_irt = []

            for q_id, chosen_option in answers.items():
                target_q = db_questions.get(q_id)
                b_diff = target_q.irt_b if target_q else 0.0
                correct_opt = target_q.correct_option if target_q else "A"
                is_correct = (chosen_option.strip().upper() == correct_opt.strip().upper())
                if is_correct:
                    correct_count += 1
                items_for_irt.append((b_diff, is_correct))

            total_q = max(len(answers), 1)
            score = (correct_count / total_q) * 100.0

            # Update student IRT ability
            curr_theta = student.theta_ability or 0.0
            old_mastery = student.overall_mastery or 0.5
            new_theta, new_mastery, new_band = IrtAdaptiveEngine.update_ability(curr_theta, items_for_irt)

            student.theta_ability = new_theta
            student.overall_mastery = new_mastery
            student.learning_band = new_band
            student.last_active_at = datetime.utcnow()

            # Record attempt
            attempt = QuizAttempt(
                student_id=student.id,
                quiz_id=quiz_id,
                score=score,
                answers_json=answers,
                transport="SMS",
                is_synced=True
            )
            db.add(attempt)
            await db.commit()

            # Get next recommendation
            next_mod = await AdaptiveRecommender.get_next_recommendation(db, student.id)
            mastery_delta = new_mastery - old_mastery

            return SmsResponseBuilder.build_quiz_result(
                student_id=student.id,
                score=score,
                mastery_delta=mastery_delta,
                next_recommendation=next_mod
            )

        elif action == ActionCode.ASK:
            query = parsed.parsed_payload["query"]
            # Call AI assistant
            answer = await RehberAiAssistant.ask_question(
                student_name=student.name,
                grade=student.grade,
                language=student.language,
                query=query,
                learning_band=student.learning_band
            )

            # Record interaction
            ai_log = AiInteraction(
                student_id=student.id,
                prompt=query,
                response=answer,
                transport="SMS",
                latency_ms=120
            )
            db.add(ai_log)
            await db.commit()

            return SmsResponseBuilder.build_ai_answer(student.id, answer)

        elif action == ActionCode.PGR:
            module_id = parsed.parsed_payload["module_id"]
            score = parsed.parsed_payload["score"]
            time_sec = parsed.parsed_payload["time_seconds"]

            prog = StudentProgress(
                student_id=student.id,
                module_id=module_id,
                score=score,
                time_spent_sec=time_sec,
                status="COMPLETED" if score >= 60 else "IN_PROGRESS"
            )
            db.add(prog)
            await db.commit()

            return SmsResponseBuilder.build_progress_ack(student.id, module_id, status="SAVED")

        raise SmsProtocolException("ERR_UNHANDLED_ACTION", f"Action {action} could not be routed")
