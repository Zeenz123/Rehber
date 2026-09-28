"""
Rehber Shared Domain Entities and Enums.
Used across Backend, Data Processors, and Seed generators.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class NetworkState(str, Enum):
    ONLINE = "ONLINE"
    LOW_BANDWIDTH = "LOW_BANDWIDTH"
    OFFLINE = "OFFLINE"
    MESSAGE_FALLBACK = "MESSAGE_FALLBACK"


class SyncStatus(str, Enum):
    PENDING = "PENDING"
    QUEUED = "QUEUED"
    SYNCING = "SYNCING"
    SYNCED = "SYNCED"
    FAILED = "FAILED"
    RETRYING = "RETRYING"
    CONFLICT = "CONFLICT"


class LearningBand(str, Enum):
    REMEDIAL = "REMEDIAL"
    ON_TRACK = "ON_TRACK"
    ADVANCED = "ADVANCED"


class SubjectCode(str, Enum):
    MATHEMATICS = "MATH"
    GENERAL_SCIENCE = "SCI"
    ENGLISH = "ENG"
    URDU = "URD"


class DifficultyLevel(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class StudentProfileEntity(BaseModel):
    id: str
    name: str
    grade: int
    language: str
    school_id: Optional[str] = "SCH-001"
    learning_band: LearningBand = LearningBand.ON_TRACK
    overall_mastery: float = 0.5
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_synced_at: Optional[datetime] = None


class LessonEntity(BaseModel):
    id: str
    module_id: str
    title: str
    concept_summary: str
    audio_script: str
    order_index: int
    prerequisite_lesson_id: Optional[str] = None


class MCQOptionEntity(BaseModel):
    id: str
    text: str


class QuestionEntity(BaseModel):
    id: str
    lesson_id: str
    prompt: str
    options: List[MCQOptionEntity]
    correct_option_id: str
    explanation: str
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    irt_b_parameter: float = 0.0  # Item difficulty parameter (-3.0 to +3.0)


class SyncRecordEntity(BaseModel):
    id: str
    student_id: str
    operation_type: str  # REG, PROGRESS, QUIZ, AI_CHAT
    payload: Dict[str, Any]
    status: SyncStatus = SyncStatus.PENDING
    retry_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    synced_at: Optional[datetime] = None
    server_ack: Optional[str] = None
