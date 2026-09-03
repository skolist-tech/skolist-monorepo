from .uuids_and_meta import (
    ATTEMPT_ADV_CLOSED_S1,
    ATTEMPT_ADV_CLOSED_S2,
    ATTEMPT_ADV_CLOSED_S3,
    ATTEMPT_MAIN_2_S1,
    ATTEMPT_MAIN_2_S2,
    ATTEMPT_NEET_LIVE_S1,
    ATTEMPT_NEET_LIVE_S2,
    ATTEMPT_NEET_LIVE_S2_RETAKE,
    ATTEMPT_NEET_LIVE_S3,
    Q_ADV_CLOSED_INT,
    Q_ADV_CLOSED_MSQ,
    Q_MAIN_2_CHEM_MCQ,
    Q_MAIN_2_MATH_INT,
    Q_MAIN_2_PHY_MCQ,
    Q_MAIN_2_PHY_NUM,
    Q_NEET_LIVE_BIO,
    Q_NEET_LIVE_CHEM,
    Q_NEET_LIVE_PHY,
    RESPONSE_ID_START,
    seed_uuid,
)


def _response(*, n: int, attempt_id: str, question_id: str, answered_at: str, **fields) -> dict:
    row = {
        "id": seed_uuid(n),
        "attempt_id": attempt_id,
        "question_id": question_id,
        "selected_mcq_option": None,
        "selected_msq_options": None,
        "numerical_answer": None,
        "integer_answer": None,
        "is_correct": None,
        "marks_obtained": None,
        "answered_at": answered_at,
        "created_at": answered_at,
        "updated_at": answered_at,
    }
    row.update(fields)
    return row


def _build_responses() -> list[dict]:
    n = RESPONSE_ID_START
    rows: list[dict] = []

    def add(**kwargs):
        nonlocal n
        rows.append(_response(n=n, **kwargs))
        n += 1

    # student1 — NEET live in progress (no scores yet)
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S1,
        question_id=Q_NEET_LIVE_PHY,
        answered_at="2026-08-18T08:20:00+00:00",
        selected_mcq_option=3,
    )

    # student2 — NEET live attempt 1, weak score (retake below)
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S2,
        question_id=Q_NEET_LIVE_PHY,
        answered_at="2026-08-18T05:20:00+00:00",
        selected_mcq_option=1,
        is_correct=False,
        marks_obtained=-1,
    )
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S2,
        question_id=Q_NEET_LIVE_CHEM,
        answered_at="2026-08-18T05:40:00+00:00",
        selected_mcq_option=3,
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S2,
        question_id=Q_NEET_LIVE_BIO,
        answered_at="2026-08-18T06:00:00+00:00",
        selected_mcq_option=1,
        is_correct=False,
        marks_obtained=-1,
    )

    # student2 — NEET live retake, all correct
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S2_RETAKE,
        question_id=Q_NEET_LIVE_PHY,
        answered_at="2026-08-18T09:15:00+00:00",
        selected_mcq_option=3,
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S2_RETAKE,
        question_id=Q_NEET_LIVE_CHEM,
        answered_at="2026-08-18T09:35:00+00:00",
        selected_mcq_option=3,
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S2_RETAKE,
        question_id=Q_NEET_LIVE_BIO,
        answered_at="2026-08-18T09:50:00+00:00",
        selected_mcq_option=2,
        is_correct=True,
        marks_obtained=4,
    )

    # student3 — NEET live, mixed
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S3,
        question_id=Q_NEET_LIVE_PHY,
        answered_at="2026-08-18T05:25:00+00:00",
        selected_mcq_option=3,
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S3,
        question_id=Q_NEET_LIVE_CHEM,
        answered_at="2026-08-18T05:50:00+00:00",
        selected_mcq_option=1,
        is_correct=False,
        marks_obtained=-1,
    )
    add(
        attempt_id=ATTEMPT_NEET_LIVE_S3,
        question_id=Q_NEET_LIVE_BIO,
        answered_at="2026-08-18T06:10:00+00:00",
        selected_mcq_option=2,
        is_correct=True,
        marks_obtained=4,
    )

    # All three students — closed JEE Advanced
    add(
        attempt_id=ATTEMPT_ADV_CLOSED_S1,
        question_id=Q_ADV_CLOSED_MSQ,
        answered_at="2026-08-16T05:30:00+00:00",
        selected_msq_options=[True, True, False, False],
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_ADV_CLOSED_S1,
        question_id=Q_ADV_CLOSED_INT,
        answered_at="2026-08-16T06:00:00+00:00",
        integer_answer=3,
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_ADV_CLOSED_S2,
        question_id=Q_ADV_CLOSED_MSQ,
        answered_at="2026-08-16T05:35:00+00:00",
        selected_msq_options=[True, True, False, False],
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_ADV_CLOSED_S2,
        question_id=Q_ADV_CLOSED_INT,
        answered_at="2026-08-16T06:05:00+00:00",
        integer_answer=2,
        is_correct=False,
        marks_obtained=0,
    )
    add(
        attempt_id=ATTEMPT_ADV_CLOSED_S3,
        question_id=Q_ADV_CLOSED_MSQ,
        answered_at="2026-08-16T05:40:00+00:00",
        selected_msq_options=[True, False, True, False],
        is_correct=False,
        marks_obtained=-2,
    )
    add(
        attempt_id=ATTEMPT_ADV_CLOSED_S3,
        question_id=Q_ADV_CLOSED_INT,
        answered_at="2026-08-16T06:20:00+00:00",
        integer_answer=3,
        is_correct=True,
        marks_obtained=4,
    )

    # JEE Main 2 — student1 complete; student2 in progress; student3 not started
    add(
        attempt_id=ATTEMPT_MAIN_2_S1,
        question_id=Q_MAIN_2_PHY_MCQ,
        answered_at="2026-08-18T04:20:00+00:00",
        selected_mcq_option=2,
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_MAIN_2_S1,
        question_id=Q_MAIN_2_PHY_NUM,
        answered_at="2026-08-18T04:40:00+00:00",
        numerical_answer=10.0,
        is_correct=False,
        marks_obtained=0,
    )
    add(
        attempt_id=ATTEMPT_MAIN_2_S1,
        question_id=Q_MAIN_2_CHEM_MCQ,
        answered_at="2026-08-18T05:00:00+00:00",
        selected_mcq_option=1,
        is_correct=False,
        marks_obtained=-1,
    )
    add(
        attempt_id=ATTEMPT_MAIN_2_S1,
        question_id=Q_MAIN_2_MATH_INT,
        answered_at="2026-08-18T05:20:00+00:00",
        integer_answer=2,
        is_correct=True,
        marks_obtained=4,
    )
    add(
        attempt_id=ATTEMPT_MAIN_2_S2,
        question_id=Q_MAIN_2_PHY_MCQ,
        answered_at="2026-08-18T11:10:00+00:00",
        selected_mcq_option=2,
    )

    return rows


RESPONSES = _build_responses()
