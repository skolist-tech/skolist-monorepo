"""Structured model outputs for the MHT-CET 2023 graph."""

from pydantic import BaseModel, Field


class PageTranscript(BaseModel):
    """Faithful transcription of one page image."""

    transcript: str


class PaperTitle(BaseModel):
    """Title printed on page 1."""

    title: str


class ExtractedQuestion(BaseModel):
    """One MCQ, its answer, and any SVG figures. Options are A B C D in order."""

    question_text: str
    option1: str = Field(description="Option A.")
    option2: str = Field(description="Option B.")
    option3: str = Field(description="Option C.")
    option4: str = Field(description="Option D.")
    correct_mcq_option: int | None = Field(
        default=None,
        ge=1,
        le=4,
        description="1 is A, 2 is B, 3 is C, 4 is D.",
    )
    explanation: str | None = None
    question_svg: str | None = None
    option1_svg: str | None = None
    option2_svg: str | None = None
    option3_svg: str | None = None
    option4_svg: str | None = None
    explanation_svg: str | None = None
