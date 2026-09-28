"""
Rehber Low-Bandwidth / SMS Communication Protocol.

Standard Message Structure:
    [StudentID]#[ActionCode]#[PayloadData]

Action Codes:
    REG: Student Registration (Payload: Name|Grade|Language)
    QZ:  Quiz Submission (Payload: QuizID|AnsString)
    ASK: AI Query (Payload: TextQuery)
    PGR: Progress Checkpoint (Payload: ModuleID|Score|TimeSeconds)

Response Codes:
    ACK: Acknowledgment (Payload: Status|SyncCode|Details)
    RES: Quiz/Progress Result (Payload: SubType|Score|MasteryDelta|NextRecommendation)
    ANS: Compact AI Answer (Payload: TextAnswer)
    ERR: Error Indicator (Payload: ErrorCode|ErrorMessage)
"""

import re
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class ActionCode(str, Enum):
    REG = "REG"
    QZ = "QZ"
    ASK = "ASK"
    PGR = "PGR"
    ACK = "ACK"
    RES = "RES"
    ANS = "ANS"
    ERR = "ERR"


@dataclass
class ParsedSmsMessage:
    student_id: str
    action_code: ActionCode
    raw_payload: str
    parsed_payload: Dict[str, Any]
    is_valid: bool = True
    error_message: Optional[str] = None


class SmsProtocolException(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(f"[{code}] {message}")
        self.code = code
        self.message = message


class SmsProtocol:
    # Delimiter characters
    SEGMENT_DELIMITER = "#"
    FIELD_DELIMITER = "|"
    SUBFIELD_DELIMITER = ":"

    # Regex to capture: [StudentID]#[ActionCode]#[PayloadData]
    MESSAGE_PATTERN = re.compile(r"^([A-Za-z0-9_-]+)#([A-Z]{2,4})#(.*)$", re.DOTALL)

    @classmethod
    def escape_text(cls, text: str) -> str:
        """Escape reserved delimiter characters in plain text payloads."""
        if not text:
            return ""
        return text.replace("\\", "\\\\").replace("#", r"\#").replace("|", r"\|")

    @classmethod
    def unescape_text(cls, text: str) -> str:
        """Unescape reserved delimiter characters."""
        if not text:
            return ""
        # Temporary placeholder to avoid conflict during sequential replacement
        s = text.replace(r"\#", "#").replace(r"\|", "|").replace(r"\\", "\\")
        return s

    @classmethod
    def serialize_registration(cls, student_id: str, name: str, grade: int | str, language: str) -> str:
        safe_name = cls.escape_text(name)
        safe_lang = cls.escape_text(language)
        payload = f"{safe_name}{cls.FIELD_DELIMITER}{grade}{cls.FIELD_DELIMITER}{safe_lang}"
        return f"{student_id}{cls.SEGMENT_DELIMITER}{ActionCode.REG.value}{cls.SEGMENT_DELIMITER}{payload}"

    @classmethod
    def serialize_quiz(cls, student_id: str, quiz_id: str, answers: Dict[str, str]) -> str:
        """Answers dict: {'1': 'A', '2': 'C'} -> '1:A,2:C'"""
        ans_parts = [f"{q_id}:{ans}" for q_id, ans in answers.items()]
        ans_str = ",".join(ans_parts)
        payload = f"{quiz_id}{cls.FIELD_DELIMITER}{ans_str}"
        return f"{student_id}{cls.SEGMENT_DELIMITER}{ActionCode.QZ.value}{cls.SEGMENT_DELIMITER}{payload}"

    @classmethod
    def serialize_ask(cls, student_id: str, query: str) -> str:
        safe_query = cls.escape_text(query.strip())
        return f"{student_id}{cls.SEGMENT_DELIMITER}{ActionCode.ASK.value}{cls.SEGMENT_DELIMITER}{safe_query}"

    @classmethod
    def serialize_progress(cls, student_id: str, module_id: str, score: float | int, time_seconds: int) -> str:
        payload = f"{module_id}{cls.FIELD_DELIMITER}{score}{cls.FIELD_DELIMITER}{time_seconds}"
        return f"{student_id}{cls.SEGMENT_DELIMITER}{ActionCode.PGR.value}{cls.SEGMENT_DELIMITER}{payload}"

    @classmethod
    def serialize_response(cls, student_id: str, action: ActionCode, payload: str) -> str:
        return f"{student_id}{cls.SEGMENT_DELIMITER}{action.value}{cls.SEGMENT_DELIMITER}{payload}"

    @classmethod
    def parse(cls, raw_message: str) -> ParsedSmsMessage:
        """
        Parses an incoming SMS string into structured components.
        Raises SmsProtocolException on syntax or semantic errors.
        """
        if not raw_message or not raw_message.strip():
            raise SmsProtocolException("ERR_EMPTY", "Message content is empty")

        trimmed = raw_message.strip()
        match = cls.MESSAGE_PATTERN.match(trimmed)
        if not match:
            raise SmsProtocolException("ERR_MALFORMED", f"Message does not match protocol format: {trimmed[:30]}")

        student_id, action_str, raw_payload = match.groups()

        try:
            action_code = ActionCode(action_str)
        except ValueError:
            raise SmsProtocolException("ERR_UNKNOWN_ACTION", f"Unsupported action code: {action_str}")

        parsed_payload: Dict[str, Any] = {}

        if action_code == ActionCode.REG:
            # Payload: Name|Grade|Lang
            # Split only on unescaped field delimiters
            raw_parts = re.split(r"(?<!\\)\|", raw_payload)
            parts = [cls.unescape_text(p) for p in raw_parts]
            if len(parts) < 3:
                raise SmsProtocolException("ERR_INVALID_REG", "REG requires Name|Grade|Language")
            parsed_payload = {
                "name": parts[0],
                "grade": parts[1],
                "language": parts[2]
            }

        elif action_code == ActionCode.QZ:
            # Payload: QuizID|AnsString (e.g. 1:A,2:B)
            parts = raw_payload.split(cls.FIELD_DELIMITER)
            if len(parts) < 2:
                raise SmsProtocolException("ERR_INVALID_QZ", "QZ requires QuizID|AnsString")
            quiz_id = parts[0]
            ans_str = parts[1]
            answers: Dict[str, str] = {}
            if ans_str:
                for pair in ans_str.split(","):
                    if cls.SUBFIELD_DELIMITER in pair:
                        q_id, choice = pair.split(cls.SUBFIELD_DELIMITER, 1)
                        answers[q_id.strip()] = choice.strip()
            parsed_payload = {
                "quiz_id": quiz_id,
                "answers": answers,
                "raw_answers": ans_str
            }

        elif action_code == ActionCode.ASK:
            # Payload: Query text
            query_text = cls.unescape_text(raw_payload)
            if not query_text:
                raise SmsProtocolException("ERR_EMPTY_QUERY", "ASK query text cannot be empty")
            parsed_payload = {
                "query": query_text
            }

        elif action_code == ActionCode.PGR:
            # Payload: ModuleID|Score|Time
            parts = raw_payload.split(cls.FIELD_DELIMITER)
            if len(parts) < 3:
                raise SmsProtocolException("ERR_INVALID_PGR", "PGR requires ModuleID|Score|Time")
            try:
                score = float(parts[1])
                time_sec = int(parts[2])
            except ValueError:
                raise SmsProtocolException("ERR_INVALID_PGR_NUM", "Score must be numeric and Time integer")
            parsed_payload = {
                "module_id": parts[0],
                "score": score,
                "time_seconds": time_sec
            }

        elif action_code in (ActionCode.ACK, ActionCode.RES, ActionCode.ANS, ActionCode.ERR):
            parsed_payload = {"raw": raw_payload}

        return ParsedSmsMessage(
            student_id=student_id,
            action_code=action_code,
            raw_payload=raw_payload,
            parsed_payload=parsed_payload,
            is_valid=True
        )
