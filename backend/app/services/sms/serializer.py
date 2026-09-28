from typing import Dict
from sms_protocol import SmsProtocol, ActionCode


class SmsSerializer:
    @staticmethod
    def serialize_registration(student_id: str, name: str, grade: int | str, language: str) -> str:
        return SmsProtocol.serialize_registration(student_id, name, grade, language)

    @staticmethod
    def serialize_quiz(student_id: str, quiz_id: str, answers: Dict[str, str]) -> str:
        return SmsProtocol.serialize_quiz(student_id, quiz_id, answers)

    @staticmethod
    def serialize_ask(student_id: str, query: str) -> str:
        return SmsProtocol.serialize_ask(student_id, query)

    @staticmethod
    def serialize_progress(student_id: str, module_id: str, score: float | int, time_seconds: int) -> str:
        return SmsProtocol.serialize_progress(student_id, module_id, score, time_seconds)

    @staticmethod
    def serialize_response(student_id: str, action: ActionCode, payload: str) -> str:
        return SmsProtocol.serialize_response(student_id, action, payload)
