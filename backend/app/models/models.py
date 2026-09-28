import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone_number = Column(String(50), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    role = Column(String(20), default="STUDENT")  # STUDENT, TEACHER, ADMIN
    created_at = Column(DateTime, default=datetime.utcnow)

    student_profile = relationship("Student", back_populates="user", uselist=False)
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)


class School(Base):
    __tablename__ = "schools"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    district = Column(String(100), nullable=True)
    province = Column(String(100), nullable=True)
    code = Column(String(50), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    students = relationship("Student", back_populates="school")
    teachers = relationship("Teacher", back_populates="school")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=True)
    name = Column(String(255), nullable=False)
    subject_specialty = Column(String(100), default="General")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="teacher_profile")
    school = relationship("School", back_populates="teachers")


class Student(Base):
    __tablename__ = "students"

    id = Column(String(50), primary_key=True)  # e.g. STU101
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=True)
    name = Column(String(255), nullable=False)
    grade = Column(Integer, default=6)
    language = Column(String(50), default="urdu")  # urdu, english, sindhi, pashto
    phone_number = Column(String(50), nullable=True, index=True)
    learning_band = Column(String(20), default="ON_TRACK")  # REMEDIAL, ON_TRACK, ADVANCED
    overall_mastery = Column(Float, default=0.5)
    theta_ability = Column(Float, default=0.0)  # IRT latent ability parameter theta (-3.0 to +3.0)
    is_active = Column(Boolean, default=True)
    last_active_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="student_profile")
    school = relationship("School", back_populates="students")
    quiz_attempts = relationship("QuizAttempt", back_populates="student")
    progress_records = relationship("StudentProgress", back_populates="student")
    mastery_records = relationship("StudentMastery", back_populates="student")
    ai_interactions = relationship("AiInteraction", back_populates="student")
    sync_records = relationship("SyncRecord", back_populates="student")
    recommendations = relationship("LearningRecommendation", back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(50), primary_key=True)  # e.g. MATH, SCI, ENG
    code = Column(String(20), unique=True, index=True)
    name = Column(String(100), nullable=False)
    grade = Column(Integer, default=6)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="book")

    modules = relationship("Module", back_populates="subject")


class Module(Base):
    __tablename__ = "modules"

    id = Column(String(50), primary_key=True)  # e.g. MOD_MATH_01
    subject_id = Column(String(50), ForeignKey("subjects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    order_index = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    difficulty_level = Column(String(20), default="MEDIUM")

    subject = relationship("Subject", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String(50), primary_key=True)  # e.g. LES_MATH_101
    module_id = Column(String(50), ForeignKey("modules.id"), nullable=False)
    title = Column(String(255), nullable=False)
    concept_summary = Column(Text, nullable=False)
    audio_script = Column(Text, nullable=False)  # For native TTS reading
    order_index = Column(Integer, default=1)

    module = relationship("Module", back_populates="lessons")
    questions = relationship("Question", back_populates="lesson")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(50), primary_key=True)  # e.g. Q_MATH_001
    lesson_id = Column(String(50), ForeignKey("lessons.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_option = Column(String(5), nullable=False)  # A, B, C, D
    explanation = Column(Text, nullable=False)
    difficulty = Column(String(20), default="MEDIUM")
    irt_b = Column(Float, default=0.0)  # Item difficulty parameter b (-3.0 to +3.0)

    lesson = relationship("Lesson", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("students.id"), nullable=False)
    quiz_id = Column(String(50), nullable=False)
    score = Column(Float, nullable=False)  # 0.0 - 100.0
    answers_json = Column(JSON, nullable=True)  # e.g. {"1": "A", "2": "C"}
    transport = Column(String(20), default="HTTPS")  # HTTPS, SMS, OFFLINE_SYNC
    is_synced = Column(Boolean, default=True)
    completed_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="quiz_attempts")


class StudentProgress(Base):
    __tablename__ = "student_progress"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("students.id"), nullable=False)
    module_id = Column(String(50), nullable=False)
    lesson_id = Column(String(50), nullable=True)
    status = Column(String(20), default="IN_PROGRESS")  # NOT_STARTED, IN_PROGRESS, COMPLETED
    score = Column(Float, default=0.0)
    time_spent_sec = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="progress_records")


class StudentMastery(Base):
    __tablename__ = "student_mastery"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("students.id"), nullable=False)
    topic = Column(String(100), nullable=False)
    mastery_score = Column(Float, default=0.5)  # 0.0 to 1.0
    confidence = Column(Float, default=0.5)
    last_updated = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="mastery_records")


class AiInteraction(Base):
    __tablename__ = "ai_interactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("students.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    transport = Column(String(20), default="HTTPS")  # HTTPS, SMS, LOCAL_RULES
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="ai_interactions")


class SyncRecord(Base):
    __tablename__ = "sync_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    client_record_id = Column(String(100), unique=True, index=True)
    student_id = Column(String(50), ForeignKey("students.id"), nullable=False)
    operation_type = Column(String(50), nullable=False)  # REG, PROGRESS, QUIZ, AI_CHAT
    payload_json = Column(JSON, nullable=False)
    status = Column(String(20), default="SYNCED")  # PENDING, SYNCED, CONFLICT
    ack_code = Column(String(50), nullable=True)
    synced_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="sync_records")


class SmsMessage(Base):
    __tablename__ = "sms_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    direction = Column(String(20), default="INBOUND")  # INBOUND, OUTBOUND
    sender_number = Column(String(50), nullable=True)
    raw_text = Column(Text, nullable=False)
    student_id = Column(String(50), nullable=True)
    action_code = Column(String(10), nullable=True)
    status = Column(String(20), default="PROCESSED")  # PROCESSED, ERROR, SIMULATED
    response_text = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("students.id"), nullable=False)
    recommended_module_id = Column(String(50), nullable=False)
    reason = Column(String(255), nullable=False)
    priority = Column(Integer, default=1)  # 1 = highest
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="recommendations")
