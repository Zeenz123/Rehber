from sms_protocol import SmsProtocol, ActionCode


class SmsResponseBuilder:
    @staticmethod
    def build_ack(student_id: str, status: str = "OK", sync_code: str = "SYNCED", details: str = "0") -> str:
        payload = f"{status}|{sync_code}|{details}"
        return SmsProtocol.serialize_response(student_id, ActionCode.ACK, payload)

    @staticmethod
    def build_quiz_result(student_id: str, score: float, mastery_delta: float, next_recommendation: str) -> str:
        score_pct = f"{int(score)}%"
        delta_str = f"+{mastery_delta:.2f}" if mastery_delta >= 0 else f"{mastery_delta:.2f}"
        payload = f"QZ|Score:{score_pct}|Mastery:{delta_str}|Next:{next_recommendation}"
        return SmsProtocol.serialize_response(student_id, ActionCode.RES, payload)

    @staticmethod
    def build_ai_answer(student_id: str, answer_text: str, max_chars: int = 150) -> str:
        """
        Ensures AI response fits within standard cellular message boundaries.
        Truncates cleanly with ellipsis if needed.
        """
        trimmed = answer_text.strip()
        if len(trimmed) > max_chars:
            trimmed = trimmed[:max_chars - 3] + "..."
        safe_ans = SmsProtocol.escape_text(trimmed)
        return SmsProtocol.serialize_response(student_id, ActionCode.ANS, safe_ans)

    @staticmethod
    def build_progress_ack(student_id: str, module_id: str, status: str = "SAVED") -> str:
        payload = f"PGR|{module_id}|{status}"
        return SmsProtocol.serialize_response(student_id, ActionCode.ACK, payload)

    @staticmethod
    def build_error(student_id: str, error_code: str, error_msg: str) -> str:
        safe_msg = SmsProtocol.escape_text(error_msg[:60])
        payload = f"{error_code}|{safe_msg}"
        return SmsProtocol.serialize_response(student_id, ActionCode.ERR, payload)
