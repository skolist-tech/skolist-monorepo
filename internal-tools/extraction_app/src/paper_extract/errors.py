"""Errors raised while turning a scanned paper into a test object."""


class PaperExtractError(Exception):
    """Base error for this package."""


class PartialQuestionError(PaperExtractError):
    """A question is cut off and the following page does not continue it."""

    def __init__(
        self,
        *,
        page_number: int,
        question_number: str | None,
        question_text: str,
    ) -> None:
        self.page_number = page_number
        self.question_number = question_number
        self.question_text = question_text
        label = question_number or "(unnumbered)"
        super().__init__(
            f"Question {label} on page {page_number} is cut off and does not continue on the next page."
        )


class EmptyPaperError(PaperExtractError):
    """The PDF produced no questions."""
