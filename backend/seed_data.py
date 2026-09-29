import asyncio
from datetime import datetime, timedelta
from app.core.database import AsyncSessionLocal, init_db
from app.models.models import (
    School, Teacher, Student, Subject, Module, Lesson,
    Question, QuizAttempt, StudentProgress, StudentMastery,
    User, StudentRegistry
)


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        existing_school = await db.execute(select(School).limit(1))
        if existing_school.scalar_one_or_none():
            print("Database already has records. Skipping initial seeding.")
            return

        print("Seeding Rehber initial database...")

        # 0. Create Auth Users
        demo_password_hash = "41bd876b085d6031cb0e04de35b88d77f83a4ba39f879fee40805ac19e356023" # hash of 'demo-password'
        
        teacher_user = User(
            id="USR-TEA-001",
            email="teacher@rehber.demo",
            hashed_password=demo_password_hash,
            role="TEACHER"
        )
        admin_user = User(
            id="USR-ADM-001",
            email="admin@rehber.demo",
            hashed_password=demo_password_hash,
            role="ADMIN"
        )
        student_user_1 = User(
            id="USR-STU-001",
            email="student1@rehber.demo",
            hashed_password=demo_password_hash,
            role="STUDENT"
        )
        db.add_all([teacher_user, admin_user, student_user_1])

        # 1. School & Teacher
        school = School(
            id="SCH-001",
            name="Govt Community School Chak 42",
            district="Rahim Yar Khan",
            province="Punjab",
            code="GCS-42"
        )
        db.add(school)

        teacher = Teacher(
            id="TEA-001",
            user_id="USR-TEA-001",
            school_id="SCH-001",
            name="Teacher Parveen Akhtar",
            subject_specialty="Mathematics & Science"
        )
        db.add(teacher)

        # 2. Students representing different learning bands
        students = [
            Student(
                id="STU101",
                user_id="USR-STU-001",
                school_id="SCH-001",
                name="Amina Khan",
                grade=6,
                language="urdu",
                learning_band="ON_TRACK",
                overall_mastery=0.68,
                theta_ability=0.45,
                phone_number="+923011111101",
                last_active_at=datetime.utcnow() - timedelta(minutes=15)
            ),
            Student(
                id="STU102",
                school_id="SCH-001",
                name="Bilal Ahmed",
                grade=6,
                language="urdu",
                learning_band="REMEDIAL",
                overall_mastery=0.35,
                theta_ability=-0.95,
                phone_number="+923011111102",
                last_active_at=datetime.utcnow() - timedelta(hours=3)
            ),
            Student(
                id="STU103",
                school_id="SCH-001",
                name="Zainab Bibi",
                grade=6,
                language="english",
                learning_band="ADVANCED",
                overall_mastery=0.88,
                theta_ability=1.65,
                phone_number="+923011111103",
                last_active_at=datetime.utcnow() - timedelta(minutes=45)
            ),
            Student(
                id="STU104",
                school_id="SCH-001",
                name="Tariq Mehmood",
                grade=6,
                language="urdu",
                learning_band="ON_TRACK",
                overall_mastery=0.55,
                theta_ability=0.10,
                phone_number="+923011111104",
                last_active_at=datetime.utcnow() - timedelta(hours=1)
            ),
        ]
        for s in students:
            db.add(s)

        registry_1 = StudentRegistry(
            government_school_student_id="GOV-SCH-001-STU-0001",
            student_name="Amina Khan",
            linked_user_id="USR-STU-001"
        )
        db.add(registry_1)

        # 3. Subjects
        sub_math = Subject(
            id="SUB_MATH",
            code="MATH",
            name="Mathematics",
            grade=6,
            description="Foundational arithmetic, fractions, and introductory algebra.",
            icon="calculator"
        )
        sub_sci = Subject(
            id="SUB_SCI",
            code="SCI",
            name="General Science",
            grade=6,
            description="Living organisms, plant biology, environment, and physical matter.",
            icon="beaker"
        )
        db.add(sub_math)
        db.add(sub_sci)

        # 4. Modules
        mod_math_1 = Module(
            id="MOD_MATH_01",
            subject_id="SUB_MATH",
            title="Understanding Fractions & Equal Parts",
            order_index=1,
            description="Visualizing fractions, numerators, and denominators with everyday items.",
            difficulty_level="EASY"
        )
        mod_math_2 = Module(
            id="MOD_MATH_02",
            subject_id="SUB_MATH",
            title="Fraction Addition and Subtraction",
            order_index=2,
            description="Common denominators and combining parts of quantities.",
            difficulty_level="MEDIUM"
        )
        mod_sci_1 = Module(
            id="MOD_SCI_01",
            subject_id="SUB_SCI",
            title="Plant Life & Photosynthesis",
            order_index=1,
            description="How plants capture sunlight to create nutrients and oxygen.",
            difficulty_level="EASY"
        )
        mod_sci_2 = Module(
            id="MOD_SCI_02",
            subject_id="SUB_SCI",
            title="Cell Organelles & Respiration",
            order_index=2,
            description="The microscopic building blocks of animals and plants.",
            difficulty_level="HARD"
        )
        db.add_all([mod_math_1, mod_math_2, mod_sci_1, mod_sci_2])

        # 5. Lessons
        les_math_1 = Lesson(
            id="LES_MATH_101",
            module_id="MOD_MATH_01",
            title="What is a Fraction?",
            concept_summary="A fraction represents a part of a whole. The bottom number (denominator) tells how many equal parts the whole is divided into. The top number (numerator) tells how many parts you have.",
            audio_script="Welcome to Rehber Mathematics. Imagine you have one flatbread, a roti, cut into two equal halves. If you eat one piece, you have eaten one out of two parts, written as one over two. The number two is the denominator, and the number one is the numerator.",
            order_index=1
        )
        les_sci_1 = Lesson(
            id="LES_SCI_101",
            module_id="MOD_SCI_01",
            title="How Green Leaves Make Food",
            concept_summary="Plants are living solar factories. Leaves contain chlorophyll which absorbs sunlight. They absorb water from roots and carbon dioxide from the air to make glucose.",
            audio_script="Welcome to Rehber Science. Look at a green leaf in the sun. The leaf has tiny green particles called chlorophyll. Using sunlight, the leaf turns water from the soil and gas from the air into sweet food called glucose, releasing fresh oxygen for us to breathe.",
            order_index=1
        )
        db.add(les_math_1)
        db.add(les_sci_1)

        # 6. Questions with IRT parameters
        q1 = Question(
            id="Q_MATH_001",
            lesson_id="LES_MATH_101",
            prompt="In the fraction 3/4, what does the number 4 represent?",
            option_a="The total number of equal parts the whole is divided into",
            option_b="The number of parts you selected",
            option_c="The result of multiplication",
            option_d="The leftover remainder",
            correct_option="A",
            explanation="The denominator (4) always indicates the total equal parts comprising one whole object.",
            difficulty="EASY",
            irt_b=-0.60
        )
        q2 = Question(
            id="Q_MATH_002",
            lesson_id="LES_MATH_101",
            prompt="If a farmer divides an acre into 5 equal plots and plants wheat in 2 plots, what fraction has wheat?",
            option_a="5/2",
            option_b="2/5",
            option_c="3/5",
            option_d="1/5",
            correct_option="B",
            explanation="There are 2 parts planted out of 5 equal total parts, so the fraction is 2/5.",
            difficulty="EASY",
            irt_b=-0.40
        )
        q3 = Question(
            id="Q_SCI_001",
            lesson_id="LES_SCI_101",
            prompt="Which green pigment in leaves captures solar energy for photosynthesis?",
            option_a="Hemoglobin",
            option_b="Chlorophyll",
            option_c="Melanin",
            option_d="Carotene",
            correct_option="B",
            explanation="Chlorophyll is the green pigment in chloroplasts that absorbs sunlight energy.",
            difficulty="EASY",
            irt_b=-0.50
        )
        q4 = Question(
            id="Q_SCI_002",
            lesson_id="LES_SCI_101",
            prompt="What vital gas do green plants release into the atmosphere during photosynthesis?",
            option_a="Carbon Dioxide",
            option_b="Methane",
            option_c="Oxygen",
            option_d="Nitrogen",
            correct_option="C",
            explanation="During photosynthesis, water molecules are split, releasing pure oxygen into the atmosphere.",
            difficulty="MEDIUM",
            irt_b=0.10
        )
        db.add_all([q1, q2, q3, q4])

        # 7. Sample quiz attempts
        attempt1 = QuizAttempt(
            student_id="STU101",
            quiz_id="QZ_MATH_01",
            score=80.0,
            answers_json={"Q_MATH_001": "A", "Q_MATH_002": "B"},
            transport="HTTPS",
            is_synced=True,
            completed_at=datetime.utcnow() - timedelta(days=1)
        )
        attempt2 = QuizAttempt(
            student_id="STU102",
            quiz_id="QZ_MATH_01",
            score=40.0,
            answers_json={"Q_MATH_001": "B", "Q_MATH_002": "B"},
            transport="SMS",
            is_synced=True,
            completed_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(attempt1)
        db.add(attempt2)

        # 8. Sample mastery
        m1 = StudentMastery(
            student_id="STU101",
            topic="Fractions",
            mastery_score=0.72,
            confidence=0.85
        )
        m2 = StudentMastery(
            student_id="STU102",
            topic="Fractions",
            mastery_score=0.38,
            confidence=0.70
        )
        db.add(m1)
        db.add(m2)

        await db.commit()
        print("Rehber initial database successfully seeded!")


if __name__ == "__main__":
    asyncio.run(seed())
