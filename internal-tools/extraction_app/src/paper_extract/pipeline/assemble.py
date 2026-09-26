"""Deterministic assembly of page reads into an MHT-CET test object."""

from paper_extract.errors import EmptyPaperError, PartialQuestionError
from paper_extract.models import (
    AnswerFragment,
    Block,
    MetadataSeen,
    PageRead,
    Question,
    QuestionOnPage,
    Section,
    SectionStart,
    Test,
)


def _first(*values):
    for value in values:
        if value is not None and value != "":
            return value
    return None


def merge_question(pending: QuestionOnPage, completion: QuestionOnPage) -> QuestionOnPage:
    """Join a cut-off question with the page that finishes it."""
    completion_text = completion.question_text.strip()
    pending_text = pending.question_text.strip()
    if pending_text and pending_text not in completion_text:
        text = f"{pending_text}\n{completion_text}".strip()
    else:
        text = completion_text or pending_text
    figure_ids: list[str] = []
    for figure_id in [*pending.figure_ids, *completion.figure_ids]:
        if figure_id not in figure_ids:
            figure_ids.append(figure_id)
    return completion.model_copy(
        update={
            "number": _first(completion.number, pending.number),
            "question_text": text,
            "option1": _first(completion.option1, pending.option1),
            "option2": _first(completion.option2, pending.option2),
            "option3": _first(completion.option3, pending.option3),
            "option4": _first(completion.option4, pending.option4),
            "correct_mcq_option": _first(completion.correct_mcq_option, pending.correct_mcq_option),
            "explanation": _first(completion.explanation, pending.explanation),
            "explanation_image_required": pending.explanation_image_required or completion.explanation_image_required,
            "explanation_figure_id": _first(completion.explanation_figure_id, pending.explanation_figure_id),
            "section_name": _first(completion.section_name, pending.section_name),
            "image_required": pending.image_required or completion.image_required,
            "option1_image_required": pending.option1_image_required or completion.option1_image_required,
            "option2_image_required": pending.option2_image_required or completion.option2_image_required,
            "option3_image_required": pending.option3_image_required or completion.option3_image_required,
            "option4_image_required": pending.option4_image_required or completion.option4_image_required,
            "figure_ids": figure_ids,
            "option1_figure_id": _first(completion.option1_figure_id, pending.option1_figure_id),
            "option2_figure_id": _first(completion.option2_figure_id, pending.option2_figure_id),
            "option3_figure_id": _first(completion.option3_figure_id, pending.option3_figure_id),
            "option4_figure_id": _first(completion.option4_figure_id, pending.option4_figure_id),
            "is_complete": completion.is_complete,
            "continues_previous": False,
        }
    )


def apply_section_starts(questions: list[QuestionOnPage], starts: list[SectionStart]) -> None:
    by_number = {start.first_question_number: start.name for start in starts if start.first_question_number}
    for question in questions:
        if question.section_name:
            continue
        if question.number and question.number in by_number:
            question.section_name = by_number[question.number]


def take_page(
    page: PageRead,
    *,
    page_number: int,
    pending: QuestionOnPage | None,
) -> tuple[list[QuestionOnPage], QuestionOnPage | None]:
    """Accept one page read. Raise if a cut-off question is not continued."""
    questions = list(page.questions)
    accepted: list[QuestionOnPage] = []

    if pending is not None:
        completion = page.pending_completion
        if completion is None and questions and questions[0].continues_previous:
            completion = questions[0]
            questions = questions[1:]
        elif questions and questions[0].continues_previous:
            questions = questions[1:]
        if not page.completes_pending and completion is None:
            raise PartialQuestionError(
                page_number=page_number - 1,
                question_number=pending.number,
                question_text=pending.question_text,
            )
        if completion is None:
            raise PartialQuestionError(
                page_number=page_number - 1,
                question_number=pending.number,
                question_text=pending.question_text,
            )
        accepted.append(merge_question(pending, completion))

    apply_section_starts(questions, page.sections_starting)

    if not questions:
        return accepted, None

    body = questions[:-1]
    last = questions[-1]
    for question in body:
        if not question.is_complete:
            raise PartialQuestionError(
                page_number=page_number,
                question_number=question.number,
                question_text=question.question_text,
            )
        accepted.append(question)

    if last.is_complete:
        accepted.append(last)
        return accepted, None

    return accepted, last


def namespace_blocks(
    questions: list[QuestionOnPage],
    blocks: list[Block],
    page_number: int,
) -> tuple[list[QuestionOnPage], list[Block]]:
    """Give each figure an id unique across the paper. b1 on two pages must not collide."""
    mapping: dict[str, str] = {}
    renamed: list[Block] = []
    for block in blocks:
        new_id = f"p{page_number}-{block.id}"
        mapping[block.id] = new_id
        renamed.append(block.model_copy(update={"id": new_id}))

    def mapped(value: str | None) -> str | None:
        if value is None:
            return None
        return mapping.get(value, value)

    rebound = [
        question.model_copy(
            update={
                "figure_ids": [mapping.get(figure_id, figure_id) for figure_id in question.figure_ids],
                "option1_figure_id": mapped(question.option1_figure_id),
                "option2_figure_id": mapped(question.option2_figure_id),
                "option3_figure_id": mapped(question.option3_figure_id),
                "option4_figure_id": mapped(question.option4_figure_id),
                "explanation_figure_id": mapped(question.explanation_figure_id),
            }
        )
        for question in questions
    ]
    return rebound, renamed


def normalize_number(value: str | None) -> str:
    if not value:
        return ""
    cleaned = value.strip().lower().replace(" ", "")
    for prefix in ("q.", "q", "question"):
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix) :]
            break
    return cleaned.lstrip(".").strip()


def attach_answers(
    questions: list[Question],
    answers: list[AnswerFragment],
) -> list[AnswerFragment]:
    """Match answer-key rows by printed number. Return rows that did not match."""
    by_number: dict[str, Question] = {}
    for question in questions:
        key = normalize_number(question.number)
        if key and key not in by_number:
            by_number[key] = question
    orphans: list[AnswerFragment] = []
    for answer in answers:
        question = by_number.get(normalize_number(answer.question_number))
        if question is None:
            orphans.append(answer)
            continue
        if question.correct_mcq_option is None:
            question.correct_mcq_option = answer.correct_mcq_option
        if answer.explanation and not question.explanation:
            question.explanation = answer.explanation
    return orphans


def question_from_page(
    draft: QuestionOnPage,
    *,
    position: int,
    page_number: int,
    blocks: dict[str, Block],
) -> Question:
    def path_for(block_id: str | None) -> str | None:
        if not block_id:
            return None
        block = blocks.get(block_id)
        return block.crop_path if block else None

    stem_ids = list(draft.figure_ids)
    return Question(
        number=draft.number,
        position=position,
        question_text=draft.question_text,
        option1=draft.option1,
        option2=draft.option2,
        option3=draft.option3,
        option4=draft.option4,
        correct_mcq_option=draft.correct_mcq_option,
        explanation=draft.explanation,
        explanation_image_path=path_for(draft.explanation_figure_id),
        image_path=path_for(stem_ids[0]) if stem_ids else None,
        option1_image_path=path_for(draft.option1_figure_id),
        option2_image_path=path_for(draft.option2_figure_id),
        option3_image_path=path_for(draft.option3_figure_id),
        option4_image_path=path_for(draft.option4_figure_id),
        page_number=page_number,
        image_required=draft.image_required,
        option1_image_required=draft.option1_image_required,
        option2_image_required=draft.option2_image_required,
        option3_image_required=draft.option3_image_required,
        option4_image_required=draft.option4_image_required,
        explanation_image_required=draft.explanation_image_required,
        source_block_ids=[*stem_ids, *[
            block_id
            for block_id in (
                draft.option1_figure_id,
                draft.option2_figure_id,
                draft.option3_figure_id,
                draft.option4_figure_id,
                draft.explanation_figure_id,
            )
            if block_id
        ]],
    )


def build_test(
    drafts: list[tuple[QuestionOnPage, int]],
    blocks: dict[str, Block],
    metadata: MetadataSeen,
    answers: list[AnswerFragment],
) -> tuple[Test, list[AnswerFragment]]:
    if not drafts:
        raise EmptyPaperError("No questions were read from the PDF.")

    questions: list[Question] = []
    section_names: list[str] = []
    current = "Paper"
    grouped: dict[str, list[Question]] = {}

    for position, (draft, page_number) in enumerate(drafts, start=1):
        if draft.section_name:
            current = draft.section_name
        question = question_from_page(draft, position=position, page_number=page_number, blocks=blocks)
        if current not in grouped:
            section_names.append(current)
            grouped[current] = []
        grouped[current].append(question)
        questions.append(question)

    orphans = attach_answers(questions, answers)
    sections = [
        Section(name=name, position=index, questions=grouped[name])
        for index, name in enumerate(section_names, start=1)
    ]
    name = metadata.name or "MHT-CET"
    if metadata.year and str(metadata.year) not in name:
        name = f"{name} {metadata.year}"
    test = Test(
        name=name,
        year=metadata.year,
        duration_minutes=metadata.duration_minutes,
        total_marks=metadata.total_marks,
        default_correct_marks=metadata.default_correct_marks,
        default_negative_marks=metadata.default_negative_marks,
        instructions=metadata.instructions,
        sections=sections,
    )
    return test, orphans


def merge_metadata(pages: list[MetadataSeen]) -> MetadataSeen:
    merged = MetadataSeen()
    for page in pages:
        data = merged.model_dump()
        for key, value in page.model_dump().items():
            if data[key] is None and value is not None:
                data[key] = value
        merged = MetadataSeen.model_validate(data)
    return merged
