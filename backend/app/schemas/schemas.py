from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Auth Schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    student_id: Optional[str] = None


class LoginRequest(BaseModel):
    identifier: str  # email or student_id or phone
    password: Optional[str] = None


# Student Schemas
class StudentBase(BaseModel):
    id: str
    name: str
    grade: int
    language: str
    school_id: Optional[str] = "SCH-001"
    phone_number: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentResponse(StudentBase):
    learning_band: str
    overall_mastery: float
    theta_ability: float
    is_active: bool
    last_active_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Curriculum Schemas
class QuestionResponse(BaseModel):
    id: str
    lesson_id: str
    prompt: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str
    difficulty: str
    irt_b: float

    class Config:
        from_attributes = True


class LessonResponse(BaseModel):
    id: str
    module_id: str
    title: str
    concept_summary: str
    audio_script: str
    order_index: int
    questions: Optional[List[QuestionResponse]] = []

    class Config:
        from_attributes = True


class ModuleResponse(BaseModel):
    id: str
    subject_id: str
    title: str
    order_index: int
    description: Optional[str] = None
    difficulty_level: str
    lessons: Optional[List[LessonResponse]] = []

    class Config:
        from_attributes = True


class SubjectResponse(BaseModel):
    id: str
    code: str
    name: str
    grade: int
    description: Optional[str] = None
    icon: str
    modules: Optional[List[ModuleResponse]] = []

    class Config:
        from_attributes = True


# Assessments & Quiz
class QuizSubmitRequest(BaseModel):
    student_id: str
    quiz_id: str
    answers: Dict[str, str]  # { "Q_MATH_001": "B" }
    transport: str = "HTTPS"  # HTTPS or SMS


class QuizSubmitResponse(BaseModel):
    student_id: str
    quiz_id: str
    score: float
    correct_count: int
    total_count: int
    updated_mastery: float
    theta_ability: float
    learning_band: str
    recommendation: Optional[str] = None


# Progress
class ProgressCheckpointRequest(BaseModel):
    student_id: str
    module_id: str
    lesson_id: Optional[str] = None
    score: float
    time_spent_sec: int
    status: str = "COMPLETED"


class ProgressResponse(BaseModel):
    id: str
    student_id: str
    module_id: str
    score: float
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True


# Sync Schemas
class ClientSyncItem(BaseModel):
    id: str  # Client-side unique UUID
    operation_type: str  # REG, PROGRESS, QUIZ, AI_CHAT
    payload: Dict[str, Any]
    created_at: datetime
    retry_count: int = 0


class BatchSyncRequest(BaseModel):
    student_id: str
    client_timestamp: datetime
    records: List[ClientSyncItem]


class BatchSyncResponse(BaseModel):
    status: str  # OK, PARTIAL, FAILED
    processed_ids: List[str]
    failed_ids: List[str] = []
    conflicts: List[Dict[str, Any]] = []
    server_timestamp: datetime = Field(default_factory=datetime.utcnow)
    curriculum_version: str = "2025.1.0"


# SMS Webhook Schemas
class SmsWebhookRequest(BaseModel):
    """Payload received from cellular SMS Gateway or simulator"""
    message_sid: Optional[str] = None
    from_number: str = "+923001234567"
    to_number: Optional[str] = "+923000000000"
    body: str  # e.g. "STU101#ASK#Why is water boiling at 100 degrees?"


class SmsWebhookResponse(BaseModel):
    status: str  # PROCESSED, ERROR
    student_id: Optional[str] = None
    action_code: Optional[str] = None
    reply_sms: str
    is_simulated: bool = False


# AI Chat Schemas
class AiChatRequest(BaseModel):
    student_id: str
    prompt: str
    subject: Optional[str] = None
    current_module_id: Optional[str] = None
    transport: str = "HTTPS"  # HTTPS, SMS_FALLBACK


class AiChatResponse(BaseModel):
    student_id: str
    prompt: str
    response: str
    transport: str
    is_fallback_rule: bool = False
    suggested_revision_module: Optional[str] = None


# Teacher Analytics & Interventions
class StudentBandSummary(BaseModel):
    remedial_count: int
    on_track_count: int
    advanced_count: int
    total_students: int


class StrugglingTopicAlert(BaseModel):
    module_id: str
    module_title: str
    subject_code: str
    average_score: float
    struggling_students_count: int


class TeacherDashboardAnalytics(BaseModel):
    total_students: int
    active_today: int
    band_distribution: StudentBandSummary
    pending_sync_count: int
    average_mastery: float
    struggling_topics: List[StrugglingTopicAlert]
    recent_activity: List[Dict[str, Any]]


class SmsLogItem(BaseModel):
    id: str
    direction: str
    sender_number: Optional[str] = None
    raw_text: str
    student_id: Optional[str] = None
    action_code: Optional[str] = None
    status: str
    response_text: Optional[str] = None
    error_details: Optional[str] = None
    created_at: datetime


class SyncRecordItem(BaseModel):
    id: str
    client_record_id: Optional[str] = None
    student_id: str
    operation_type: str
    payload_json: Dict[str, Any]
    status: str
    ack_code: Optional[str] = None
    synced_at: datetime

