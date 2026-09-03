"""Shared Pydantic models for the assessment API."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

TEACHER_USER_TYPES = frozenset({"teacher", "admin", "principal", "skolist-admin"})
STUDENT_USER_TYPE = "student"

EXAM_TYPES = ("jee_main", "jee_advanced", "neet", "other")
TEST_STATUSES = ("draft", "published", "closed")
QUESTION_TYPES = ("mcq", "msq", "numerical", "integer")
HARDNESS_LEVELS = ("easy", "medium", "hard")
ATTEMPT_STATUSES = ("in_progress", "submitted", "timed_out", "graded")

QUESTION_SECRET_FIELDS = frozenset(
    {
        "correct_mcq_option",
        "msq_option1_answer",
        "msq_option2_answer",
        "msq_option3_answer",
        "msq_option4_answer",
        "numerical_answer",
        "integer_answer",
        "answer",
        "explanation",
    }
)

RESPONSE_GRADING_FIELDS = frozenset({"is_correct", "marks_obtained"})


class AssessmentActor(BaseModel):
    id: str
    email: str | None = None
    user_type: str
    org_id: str | None = None

    @property
    def is_teacher(self) -> bool:
        return self.user_type in TEACHER_USER_TYPES

    @property
    def is_student(self) -> bool:
        return self.user_type == STUDENT_USER_TYPE

    @property
    def is_platform_admin(self) -> bool:
        return self.user_type == "skolist-admin"

    @property
    def role(self) -> Literal["teacher", "student", "other"]:
        if self.is_student:
            return "student"
        if self.is_teacher:
            return "teacher"
        return "other"


class MeResponse(BaseModel):
    id: str
    email: str | None = None
    user_type: str
    org_id: str | None = None
    role: Literal["teacher", "student", "other"]


class TestCreate(BaseModel):
    name: str
    description: str | None = None
    exam_type: str = "jee_main"
    duration_minutes: int = Field(..., gt=0)
    total_marks: float | None = None
    default_correct_marks: float = Field(default=4, ge=0)
    default_negative_marks: float = Field(default=1, ge=0)
    starts_at: datetime | None = None
    ends_at: datetime | None = None


class TestUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    exam_type: str | None = None
    status: str | None = None
    duration_minutes: int | None = Field(default=None, gt=0)
    total_marks: float | None = None
    default_correct_marks: float | None = Field(default=None, ge=0)
    default_negative_marks: float | None = Field(default=None, ge=0)
    starts_at: datetime | None = None
    ends_at: datetime | None = None


class SectionCreate(BaseModel):
    name: str
    position: int = Field(default=1, ge=1)
    subject: str | None = "other"
    correct_marks: float | None = None
    negative_marks: float | None = None


class SectionUpdate(BaseModel):
    name: str | None = None
    position: int | None = Field(default=None, ge=1)
    subject: str | None = None
    correct_marks: float | None = None
    negative_marks: float | None = None


class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "mcq"
    hardness_level: str = "easy"
    position: int = Field(..., ge=1)
    marks: float = Field(..., ge=0)
    negative_marks: float = Field(default=0, ge=0)
    parent_question_id: UUID | None = None
    option1: str | None = None
    option2: str | None = None
    option3: str | None = None
    option4: str | None = None
    correct_mcq_option: int | None = Field(default=None, ge=1, le=4)
    msq_option1_answer: bool | None = None
    msq_option2_answer: bool | None = None
    msq_option3_answer: bool | None = None
    msq_option4_answer: bool | None = None
    numerical_answer: float | None = None
    integer_answer: int | None = None
    answer: str | None = None
    explanation: str | None = None


class QuestionUpdate(BaseModel):
    question_text: str | None = None
    question_type: str | None = None
    hardness_level: str | None = None
    position: int | None = Field(default=None, ge=1)
    marks: float | None = Field(default=None, ge=0)
    negative_marks: float | None = Field(default=None, ge=0)
    parent_question_id: UUID | None = None
    option1: str | None = None
    option2: str | None = None
    option3: str | None = None
    option4: str | None = None
    correct_mcq_option: int | None = Field(default=None, ge=1, le=4)
    msq_option1_answer: bool | None = None
    msq_option2_answer: bool | None = None
    msq_option3_answer: bool | None = None
    msq_option4_answer: bool | None = None
    numerical_answer: float | None = None
    integer_answer: int | None = None
    answer: str | None = None
    explanation: str | None = None


class AssigneeCreate(BaseModel):
    user_id: UUID


class ResponseUpsert(BaseModel):
    selected_mcq_option: int | None = Field(default=None, ge=1, le=4)
    selected_msq_options: list[bool] | None = None
    numerical_answer: float | None = None
    integer_answer: int | None = None


class StudentQuestion(BaseModel):
    id: str
    test_id: str
    section_id: str
    parent_question_id: str | None = None
    position: int
    question_text: str
    question_type: str
    hardness_level: str | None = None
    marks: float
    negative_marks: float
    option1: str | None = None
    option2: str | None = None
    option3: str | None = None
    option4: str | None = None


class TeacherQuestion(StudentQuestion):
    correct_mcq_option: int | None = None
    msq_option1_answer: bool | None = None
    msq_option2_answer: bool | None = None
    msq_option3_answer: bool | None = None
    msq_option4_answer: bool | None = None
    numerical_answer: float | None = None
    integer_answer: int | None = None
    answer: str | None = None
    explanation: str | None = None


class StudentResponse(BaseModel):
    id: str
    attempt_id: str
    question_id: str
    selected_mcq_option: int | None = None
    selected_msq_options: list[bool] | None = None
    numerical_answer: float | None = None
    integer_answer: int | None = None
    answered_at: datetime | str | None = None


class GradedResponse(StudentResponse):
    is_correct: bool | None = None
    marks_obtained: float | None = None


class OkResponse(BaseModel):
    ok: bool = True


def dump_unset(model: BaseModel) -> dict[str, Any]:
    payload = model.model_dump(exclude_unset=True)
    for key, value in list(payload.items()):
        if isinstance(value, UUID):
            payload[key] = str(value)
        elif isinstance(value, datetime):
            payload[key] = value.isoformat()
    return payload
