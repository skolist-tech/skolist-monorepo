"""Activity seed payload used by 003_seed_activities.py.

Auth teacher/student come from _002_data_user.py. Inserting the activity
fires DB triggers that create qgen_drafts, qgen_generation_panes, and
default instructions.
"""

from ._001_data_orgs import SEED_ORG
from ._002_data_user import STUDENT_1, TEACHER_1

ACTIVITY_ID = "00000000-0000-0000-0000-000000000002"
SECTION_ID = "00000000-0000-0000-0000-000000000007"

# Class 10 / Mathematics from SQL seeds 002_school_classes.sql and 003_subjects.sql
SCHOOL_CLASS_ID = "e763c901-a3b9-4472-9016-cebfa7a39902"
SUBJECT_ID = "f4ef2dbd-8278-4827-9c5b-7954c50a65ac"

SEED_USER = TEACHER_1
SEED_USER_TYPE = TEACHER_1["user_type"]
STUDENT_USER = STUDENT_1
STUDENT_USER_TYPE = STUDENT_1["user_type"]

ACTIVITY = {
    "id": ACTIVITY_ID,
    "name": "Seed Test Paper - Class 10 Math",
    "product_type": "qgen",
}

GENERATION_PANE = {
    "school_class_id": SCHOOL_CLASS_ID,
    "subject_id": SUBJECT_ID,
    "total_marks_count": 30,
    "total_time_count": 60,
}

DRAFT = {
    "paper_title": "Seed Test Paper - Class 10 Math",
    "paper_subtitle": "Mid-Term Examination",
    "institute_name": SEED_ORG["header_line"],
    "logo_url": None,
    "subject_name": "Mathematics",
    "school_class_name": "Class 10",
    "maximum_marks": 30,
    "max_position": 3,
    "is_show_instruction": True,
    "is_show_explanation_answer_key": True,
}

SECTION = {
    "id": SECTION_ID,
    "section_name": "Section A",
    "position_in_draft": 1,
}

QUESTIONS = [
    {
        "id": "00000000-0000-0000-0000-000000000010",
        "activity_id": ACTIVITY_ID,
        "is_in_draft": True,
        "marks": 4,
        "question_text": "What is the standard form of a quadratic equation?",
        "answer_text": (
            "The standard form of a quadratic equation is ax² + bx + c = 0, "
            "where a, b, c are real numbers and a ≠ 0."
        ),
        "explanation": (
            "A quadratic equation is a polynomial equation of degree 2. "
            "The standard form requires the coefficient of x² (which is a) "
            "to be non-zero, otherwise it would not be quadratic."
        ),
        "question_type": "mcq4",
        "hardness_level": "easy",
        "qgen_draft_section_id": SECTION_ID,
        "position_in_draft": 1,
        "is_page_break_below": False,
        "is_exercise_question": False,
        "is_solved_example": False,
        "is_new": True,
        "option1": "ax² + bx + c = 0 (a ≠ 0)",
        "option2": "x² + bx + c = 0",
        "option3": "ax + b = 0",
        "option4": "ax³ + bx² + cx + d = 0",
        "correct_mcq_option": 1,
    },
    {
        "id": "00000000-0000-0000-0000-000000000011",
        "activity_id": ACTIVITY_ID,
        "is_in_draft": True,
        "marks": 6,
        "question_text": (
            "Find the roots of the quadratic equation x² - 5x + 6 = 0 "
            "using the quadratic formula."
        ),
        "answer_text": (
            "Using the quadratic formula x = (-b ± √(b² - 4ac)) / (2a), "
            "where a = 1, b = -5, c = 6:\n"
            "x = (5 ± √(25 - 24)) / 2\n"
            "x = (5 ± 1) / 2\n"
            "Therefore, x = 3 or x = 2"
        ),
        "explanation": (
            "The quadratic formula x = (-b ± √(b² - 4ac)) / (2a) gives the roots "
            "of any quadratic equation ax² + bx + c = 0, provided the discriminant "
            "(b² - 4ac) is non-negative."
        ),
        "question_type": "short_answer",
        "hardness_level": "medium",
        "qgen_draft_section_id": SECTION_ID,
        "position_in_draft": 2,
        "is_page_break_below": False,
        "is_exercise_question": False,
        "is_solved_example": False,
        "is_new": True,
        "option1": None,
        "option2": None,
        "option3": None,
        "option4": None,
        "correct_mcq_option": None,
    },
    {
        "id": "00000000-0000-0000-0000-000000000012",
        "activity_id": ACTIVITY_ID,
        "is_in_draft": True,
        "marks": 2,
        "question_text": (
            "A pair of linear equations that has at least one solution is called "
            "a consistent pair of linear equations."
        ),
        "answer_text": "True",
        "explanation": (
            "By definition, a consistent system of linear equations is one that "
            "has at least one solution. If it has no solution, it is called an "
            "inconsistent system."
        ),
        "question_type": "true_or_false",
        "hardness_level": "easy",
        "qgen_draft_section_id": SECTION_ID,
        "position_in_draft": 3,
        "is_page_break_below": False,
        "is_exercise_question": False,
        "is_solved_example": False,
        "is_new": True,
        "option1": None,
        "option2": None,
        "option3": None,
        "option4": None,
        "correct_mcq_option": None,
    },
]

QUESTION_VERSIONS = [
    {
        "id": "00000000-0000-0000-0000-000000000020",
        "gen_question_id": "00000000-0000-0000-0000-000000000010",
        "version_index": 0,
        "is_active": True,
        "is_deleted": False,
        "marks": 4,
        "question_text": "What is the standard form of a quadratic equation?",
        "answer_text": (
            "The standard form of a quadratic equation is ax² + bx + c = 0, "
            "where a, b, c are real numbers and a ≠ 0."
        ),
        "explanation": (
            "A quadratic equation is a polynomial equation of degree 2. "
            "The standard form requires the coefficient of x² (which is a) "
            "to be non-zero, otherwise it would not be quadratic."
        ),
        "question_type": "mcq4",
        "hardness_level": "easy",
        "option1": "ax² + bx + c = 0 (a ≠ 0)",
        "option2": "x² + bx + c = 0",
        "option3": "ax + b = 0",
        "option4": "ax³ + bx² + cx + d = 0",
        "correct_mcq_option": 1,
    },
    {
        "id": "00000000-0000-0000-0000-000000000021",
        "gen_question_id": "00000000-0000-0000-0000-000000000011",
        "version_index": 0,
        "is_active": True,
        "is_deleted": False,
        "marks": 6,
        "question_text": (
            "Find the roots of the quadratic equation x² - 5x + 6 = 0 "
            "using the quadratic formula."
        ),
        "answer_text": (
            "Using the quadratic formula x = (-b ± √(b² - 4ac)) / (2a), "
            "where a = 1, b = -5, c = 6:\n"
            "x = (5 ± √(25 - 24)) / 2\n"
            "x = (5 ± 1) / 2\n"
            "Therefore, x = 3 or x = 2"
        ),
        "explanation": (
            "The quadratic formula x = (-b ± √(b² - 4ac)) / (2a) gives the roots "
            "of any quadratic equation ax² + bx + c = 0, provided the discriminant "
            "(b² - 4ac) is non-negative."
        ),
        "question_type": "short_answer",
        "hardness_level": "medium",
        "option1": None,
        "option2": None,
        "option3": None,
        "option4": None,
        "correct_mcq_option": None,
    },
    {
        "id": "00000000-0000-0000-0000-000000000022",
        "gen_question_id": "00000000-0000-0000-0000-000000000012",
        "version_index": 0,
        "is_active": True,
        "is_deleted": False,
        "marks": 2,
        "question_text": (
            "A pair of linear equations that has at least one solution is called "
            "a consistent pair of linear equations."
        ),
        "answer_text": "True",
        "explanation": (
            "By definition, a consistent system of linear equations is one that "
            "has at least one solution. If it has no solution, it is called an "
            "inconsistent system."
        ),
        "question_type": "true_or_false",
        "hardness_level": "easy",
        "option1": None,
        "option2": None,
        "option3": None,
        "option4": None,
        "correct_mcq_option": None,
    },
]

QUESTION_CONCEPT_MAPS = [
    {
        "id": "00000000-0000-0000-0000-000000000030",
        "gen_question_id": "00000000-0000-0000-0000-000000000010",
        "concept_id": "88fd0488-f076-47f0-9aef-0c43830e8b5a",
    },
    {
        "id": "00000000-0000-0000-0000-000000000031",
        "gen_question_id": "00000000-0000-0000-0000-000000000011",
        "concept_id": "faf493af-48f5-4ba1-a0a6-bea8520fc234",
    },
    {
        "id": "00000000-0000-0000-0000-000000000032",
        "gen_question_id": "00000000-0000-0000-0000-000000000012",
        "concept_id": "7afba2fe-aa0e-4dc9-ac57-1ce3d75f1517",
    },
]
