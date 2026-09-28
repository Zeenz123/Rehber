import pytest
from app.models.models import Student, Subject, Module, Lesson, Question


@pytest.mark.asyncio
async def test_health_check_endpoint(client):
    res = await client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Rehber" in data["app"]


@pytest.mark.asyncio
async def test_student_registration_and_retrieval(client):
    # Register student
    payload = {
        "id": "STU_API_01",
        "name": "Maryam Bibi",
        "grade": 7,
        "language": "urdu",
        "school_id": "SCH-001"
    }
    create_res = await client.post("/api/students/", json=payload)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["id"] == "STU_API_01"
    assert created["learning_band"] == "ON_TRACK"

    # Fetch student
    get_res = await client.get("/api/students/STU_API_01")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Maryam Bibi"


@pytest.mark.asyncio
async def test_sms_webhook_endpoint(client, test_db):
    # Create student in DB first
    stu = Student(
        id="STU_SMS_API",
        name="Arsalan",
        grade=6,
        language="urdu",
        learning_band="ON_TRACK",
        overall_mastery=0.5
    )
    test_db.add(stu)
    await test_db.commit()

    # Call SMS webhook with ASK action
    sms_payload = {
        "from_number": "+923001234567",
        "body": "STU_SMS_API#ASK#What is photosynthesis?"
    }
    res = await client.post("/api/sms/webhook", json=sms_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PROCESSED"
    assert data["student_id"] == "STU_SMS_API"
    assert "STU_SMS_API#ANS#" in data["reply_sms"]


@pytest.mark.asyncio
async def test_analytics_dashboard_endpoint(client, test_db):
    # Seed a couple students
    s1 = Student(id="S1", name="A", grade=6, language="urdu", learning_band="REMEDIAL", overall_mastery=0.3)
    s2 = Student(id="S2", name="B", grade=6, language="urdu", learning_band="ON_TRACK", overall_mastery=0.6)
    s3 = Student(id="S3", name="C", grade=6, language="urdu", learning_band="ADVANCED", overall_mastery=0.9)
    test_db.add_all([s1, s2, s3])
    await test_db.commit()

    res = await client.get("/api/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total_students"] >= 3
    assert data["band_distribution"]["remedial_count"] >= 1
    assert data["band_distribution"]["advanced_count"] >= 1
