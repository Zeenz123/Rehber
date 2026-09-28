import asyncio
from app.core.database import AsyncSessionLocal, init_db
from app.models.models import School, User, Student, Teacher, StudentRegistry, Subject, Module, Lesson, Question
from app.core.security import get_password_hash

async def seed_data():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Create School
        school = School(id="SCH-DEMO-001", name="Demo Government Higher Secondary School", code="GOV001")
        db.add(school)
        
        # Create Admin
        admin_user = User(
            id="USR-ADMIN-001",
            email="admin@rehber.demo",
            hashed_password=get_password_hash("demo-password"),
            role="ADMIN"
        )
        db.add(admin_user)
        
        # Create Teacher
        teacher_user = User(
            id="USR-TCH-001",
            email="teacher@rehber.demo",
            hashed_password=get_password_hash("demo-password"),
            role="TEACHER"
        )
        db.add(teacher_user)
        
        teacher = Teacher(
            id="TCH-DEMO-001",
            user_id="USR-TCH-001",
            school_id="SCH-DEMO-001",
            name="Demo Teacher"
        )
        db.add(teacher)

        # Create Student
        student_user = User(
            id="USR-STU-001",
            hashed_password=get_password_hash("demo-password"),
            role="STUDENT"
        )
        db.add(student_user)

        student = Student(
            id="STU-001",
            user_id="USR-STU-001",
            school_id="SCH-DEMO-001",
            name="Demo Student",
            grade=8,
            language="English"
        )
        db.add(student)

        # Create Student Registry
        registry = StudentRegistry(
            id="REG-001",
            government_school_student_id="GOV-SCH-001-STU-0001",
            school_id="SCH-DEMO-001",
            student_name="Demo Student",
            grade=8,
            section="A",
            language="English",
            linked_user_id="USR-STU-001"
        )
        db.add(registry)
        
        # Create Curriculum
        subject = Subject(id="MATH8", code="M08", name="Mathematics", grade=8, description="Grade 8 Math")
        db.add(subject)
        
        module = Module(id="MOD-MATH-01", subject_id="MATH8", title="Algebra", order_index=1, difficulty_level="EASY")
        db.add(module)
        
        lesson = Lesson(id="LES-MATH-01", module_id="MOD-MATH-01", title="Linear Equations", concept_summary="Equations with variables", audio_script="Welcome to linear equations.", order_index=1)
        db.add(lesson)
        
        question = Question(
            id="Q-MATH-01",
            lesson_id="LES-MATH-01",
            prompt="Solve for x: 2x = 4",
            option_a="1",
            option_b="2",
            option_c="3",
            option_d="4",
            correct_option="B",
            explanation="Divide by 2",
            difficulty="EASY",
            irt_b=0.0
        )
        db.add(question)

        try:
            await db.commit()
            print("Seed data created successfully.")
        except Exception as e:
            print(f"Seed data might already exist or error: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(seed_data())
