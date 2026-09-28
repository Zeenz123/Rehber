import pytest
from sms_protocol import SmsProtocol, ActionCode, SmsProtocolException
from app.services.sms.parser import SmsParser
from app.services.sms.serializer import SmsSerializer
from app.services.sms.validator import SmsValidator
from app.services.sms.response_builder import SmsResponseBuilder
from app.services.sms.router import SmsRouter
from app.models.models import Student, Question


def test_valid_registration_serialization_and_parsing():
    msg = SmsSerializer.serialize_registration(
        student_id="STU101",
        name="Amina Khan",
        grade=6,
        language="urdu"
    )
    assert msg == "STU101#REG#Amina Khan|6|urdu"

    parsed = SmsParser.parse_message(msg)
    assert parsed.student_id == "STU101"
    assert parsed.action_code == ActionCode.REG
    assert parsed.parsed_payload["name"] == "Amina Khan"
    assert parsed.parsed_payload["grade"] == "6"
    assert parsed.parsed_payload["language"] == "urdu"


def test_valid_quiz_serialization_and_parsing():
    msg = SmsSerializer.serialize_quiz(
        student_id="STU102",
        quiz_id="QZ_MATH_01",
        answers={"Q_MATH_001": "A", "Q_MATH_002": "B"}
    )
    assert "STU102#QZ#QZ_MATH_01|" in msg
    assert "Q_MATH_001:A" in msg
    assert "Q_MATH_002:B" in msg

    parsed = SmsParser.parse_message(msg)
    assert parsed.student_id == "STU102"
    assert parsed.action_code == ActionCode.QZ
    assert parsed.parsed_payload["quiz_id"] == "QZ_MATH_01"
    assert parsed.parsed_payload["answers"]["Q_MATH_001"] == "A"
    assert parsed.parsed_payload["answers"]["Q_MATH_002"] == "B"


def test_valid_ask_serialization_and_parsing():
    query = "Why is the sky blue?"
    msg = SmsSerializer.serialize_ask(student_id="STU103", query=query)
    assert msg == "STU103#ASK#Why is the sky blue?"

    parsed = SmsParser.parse_message(msg)
    assert parsed.student_id == "STU103"
    assert parsed.action_code == ActionCode.ASK
    assert parsed.parsed_payload["query"] == query


def test_valid_progress_serialization_and_parsing():
    msg = SmsSerializer.serialize_progress(
        student_id="STU104",
        module_id="MOD_SCI_01",
        score=85,
        time_seconds=1200
    )
    assert msg == "STU104#PGR#MOD_SCI_01|85|1200"

    parsed = SmsParser.parse_message(msg)
    assert parsed.student_id == "STU104"
    assert parsed.action_code == ActionCode.PGR
    assert parsed.parsed_payload["module_id"] == "MOD_SCI_01"
    assert parsed.parsed_payload["score"] == 85.0
    assert parsed.parsed_payload["time_seconds"] == 1200


def test_escaping_special_characters():
    name = "Amina #1 | Special"
    msg = SmsSerializer.serialize_registration(
        student_id="STU105",
        name=name,
        grade=7,
        language="english"
    )
    # Check escaped characters
    assert r"\#" in msg
    assert r"\|" in msg

    parsed = SmsParser.parse_message(msg)
    assert parsed.parsed_payload["name"] == name


def test_malformed_payload_raises_exception():
    with pytest.raises(SmsProtocolException) as exc:
        SmsParser.parse_message("BAD_MESSAGE_WITHOUT_DELIMITERS")
    assert exc.value.code == "ERR_MALFORMED"


def test_unknown_action_code_raises_exception():
    with pytest.raises(SmsProtocolException) as exc:
        SmsParser.parse_message("STU101#XYZ#SomeData")
    assert exc.value.code == "ERR_UNKNOWN_ACTION"


def test_oversized_payload_validation():
    long_text = "A" * 350
    with pytest.raises(SmsProtocolException) as exc:
        SmsValidator.validate_length(long_text)
    assert exc.value.code == "ERR_PAYLOAD_TOO_LARGE"


def test_response_builder_formats():
    ack = SmsResponseBuilder.build_ack("STU101", status="OK", sync_code="SYNCED")
    assert ack == "STU101#ACK#OK|SYNCED|0"

    quiz_res = SmsResponseBuilder.build_quiz_result("STU101", score=85.0, mastery_delta=0.15, next_recommendation="MOD_02")
    assert "STU101#RES#QZ|Score:85%|Mastery:+0.15|Next:MOD_02" == quiz_res

    err_res = SmsResponseBuilder.build_error("STU101", "ERR_INVALID", "Invalid input")
    assert "STU101#ERR#ERR_INVALID|Invalid input" == err_res


@pytest.mark.asyncio
async def test_sms_router_registration_and_quiz_flow(test_db):
    # 1. Register student via SMS
    reg_msg = "STU201#REG#Fatima Noor|6|urdu"
    parsed_reg = SmsParser.parse_message(reg_msg)
    reply_reg = await SmsRouter.route_and_execute(test_db, parsed_reg)
    assert "STU201#ACK#OK|REG_SUCCESS|Fatima Noor" == reply_reg

    # 2. Add question to test DB
    q = Question(
        id="Q_TEST_01",
        lesson_id="LES_TEST",
        prompt="Sample Q?",
        option_a="Option A",
        option_b="Option B",
        option_c="Option C",
        option_d="Option D",
        correct_option="A",
        explanation="Explain",
        difficulty="EASY",
        irt_b=-0.5
    )
    test_db.add(q)
    await test_db.commit()

    # 3. Submit quiz via SMS
    qz_msg = "STU201#QZ#QZ_TEST_01|Q_TEST_01:A"
    parsed_qz = SmsParser.parse_message(qz_msg)
    reply_qz = await SmsRouter.route_and_execute(test_db, parsed_qz)
    assert "STU201#RES#QZ|Score:100%" in reply_qz
