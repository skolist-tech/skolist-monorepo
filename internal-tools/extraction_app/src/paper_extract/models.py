"""MHT-CET test object and the structured reads the model returns per page.

Every question is a single-correct MCQ with four options. Stem and option
figures may be a cropped raster, an SVG, or both.
"""

from typing import Literal

from pydantic import BaseModel, Field

QuestionType = Literal["mcq"]


class Block(BaseModel):
    """A non-text region on a rendered page. Coordinates are fractions of the page."""

    id: str
    kind: Literal["figure", "table", "other"] = "figure"
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    w: float = Field(gt=0, le=1)
    h: float = Field(gt=0, le=1)
    page_number: int = Field(ge=1)
    crop_path: str | None = None


class MetadataSeen(BaseModel):
    name: str | None = None
    year: int | None = None
    duration_minutes: int | None = None
    total_marks: float | None = None
    default_correct_marks: float | None = None
    default_negative_marks: float | None = None
    instructions: str | None = None


class SectionStart(BaseModel):
    name: str
    first_question_number: str | None = None


class AnswerFragment(BaseModel):
    """A printed answer that is not already attached to a complete question on the same page."""

    question_number: str | None = None
    correct_mcq_option: int = Field(ge=1, le=4)
    explanation: str | None = None
    explanation_image_required: bool = False
    explanation_figure_id: str | None = None


class QuestionOnPage(BaseModel):
    """One question as read from a single page image."""

    number: str | None = None
    question_text: str
    option1: str
    option2: str
    option3: str
    option4: str
    correct_mcq_option: int | None = Field(default=None, ge=1, le=4)
    explanation: str | None = None
    explanation_image_required: bool = False
    explanation_figure_id: str | None = None
    is_complete: bool = True
    continues_previous: bool = False
    section_name: str | None = None
    image_required: bool = False
    option1_image_required: bool = False
    option2_image_required: bool = False
    option3_image_required: bool = False
    option4_image_required: bool = False
    figure_ids: list[str] = Field(default_factory=list)
    option1_figure_id: str | None = None
    option2_figure_id: str | None = None
    option3_figure_id: str | None = None
    option4_figure_id: str | None = None


class PageRead(BaseModel):
    """Everything worth taking from one page in a single model call."""

    metadata: MetadataSeen = Field(default_factory=MetadataSeen)
    sections_starting: list[SectionStart] = Field(default_factory=list)
    blocks: list[Block] = Field(default_factory=list)
    questions: list[QuestionOnPage] = Field(default_factory=list)
    answers: list[AnswerFragment] = Field(default_factory=list)
    completes_pending: bool = False
    pending_completion: QuestionOnPage | None = None


class Question(BaseModel):
    question_type: QuestionType = "mcq"
    number: str | None = None
    position: int = Field(ge=1)
    question_text: str
    option1: str
    option2: str
    option3: str
    option4: str
    correct_mcq_option: int | None = Field(default=None, ge=1, le=4)
    explanation: str | None = None
    explanation_image_path: str | None = None
    explanation_svg_image_code: str | None = None
    image_path: str | None = None
    option1_image_path: str | None = None
    option2_image_path: str | None = None
    option3_image_path: str | None = None
    option4_image_path: str | None = None
    svg_image_code: str | None = None
    option1_svg_image_code: str | None = None
    option2_svg_image_code: str | None = None
    option3_svg_image_code: str | None = None
    option4_svg_image_code: str | None = None
    page_number: int = Field(ge=1)
    source_block_ids: list[str] = Field(default_factory=list)
    image_required: bool = False
    explanation_image_required: bool = False
    option1_image_required: bool = False
    option2_image_required: bool = False
    option3_image_required: bool = False
    option4_image_required: bool = False


class Section(BaseModel):
    name: str
    position: int = Field(ge=1)
    questions: list[Question]


class Test(BaseModel):
    """The object this package returns."""

    exam: Literal["mht_cet"] = "mht_cet"
    name: str
    year: int | None = None
    duration_minutes: int | None = None
    total_marks: float | None = None
    default_correct_marks: float | None = None
    default_negative_marks: float | None = None
    instructions: str | None = None
    sections: list[Section]
    warnings: list[str] = Field(default_factory=list)


class SvgDecision(BaseModel):
    replaceable: bool
    reason: str = ""


class SvgDrawing(BaseModel):
    svg: str


class AnswerBelongs(BaseModel):
    """Whether one orphan answer is the key for one question."""

    belongs: bool


class ImageLink(BaseModel):
    block_id: str | None = None
    target: Literal["stem", "option1", "option2", "option3", "option4", "explanation"] = "stem"
