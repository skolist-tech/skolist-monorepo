"""Assembly rules that do not call a model."""

import pytest

from paper_extract.errors import EmptyPaperError, PartialQuestionError
from paper_extract.models import AnswerFragment, Block, MetadataSeen, PageRead, QuestionOnPage, SectionStart
from paper_extract.pipeline.assemble import (
    attach_answers,
    build_test,
    merge_metadata,
    merge_question,
    namespace_blocks,
    normalize_number,
    take_page,
)
from paper_extract.pipeline.crops import pixel_box


def _question(number: str, text: str, *, complete: bool = True, section: str | None = None) -> QuestionOnPage:
    return QuestionOnPage(
        number=number,
        question_text=text,
        option1="a",
        option2="b",
        option3="c",
        option4="d",
        is_complete=complete,
        section_name=section,
    )


def test_normalize_number_strips_q_prefix():
    assert normalize_number("Q.12") == "12"
    assert normalize_number(" 8 ") == "8"


def test_cut_off_question_merges_with_the_next_page():
    pending = _question("8", "A sphere of radius")
    pending = pending.model_copy(update={"is_complete": False, "option1": None})
    page = PageRead(
        completes_pending=True,
        pending_completion=_question("8", "A sphere of radius R carries charge."),
        questions=[_question("9", "Two point charges")],
    )
    accepted, still_pending = take_page(page, page_number=2, pending=pending)
    assert still_pending is None
    assert [item.number for item in accepted] == ["8", "9"]
    assert "charge" in accepted[0].question_text


def test_missing_continuation_raises():
    pending = _question("8", "A sphere")
    page = PageRead(questions=[_question("9", "Next")])
    with pytest.raises(PartialQuestionError) as caught:
        take_page(page, page_number=2, pending=pending)
    assert caught.value.page_number == 1
    assert caught.value.question_number == "8"


def test_incomplete_question_in_the_middle_of_a_page_raises():
    page = PageRead(
        questions=[
            _question("1", "First", complete=False),
            _question("2", "Second"),
        ]
    )
    with pytest.raises(PartialQuestionError) as caught:
        take_page(page, page_number=3, pending=None)
    assert caught.value.page_number == 3


def test_last_question_may_wait_for_the_next_page():
    page = PageRead(questions=[_question("1", "Done"), _question("2", "Cut off", complete=False)])
    accepted, pending = take_page(page, page_number=1, pending=None)
    assert [item.number for item in accepted] == ["1"]
    assert pending is not None
    assert pending.number == "2"


def test_section_start_sticks_until_the_next_heading():
    physics = _question("1", "Force")
    chemistry = _question("2", "Atom")
    page = PageRead(
        sections_starting=[SectionStart(name="Chemistry", first_question_number="2")],
        questions=[physics, chemistry],
    )
    accepted, _pending = take_page(page, page_number=1, pending=None)
    drafts = [(accepted[0], 1), (accepted[1].model_copy(update={"section_name": "Chemistry"}), 1)]
    # section_name is applied inside take_page
    drafts = [(item, 1) for item in accepted]
    test, orphans = build_test(drafts, {}, MetadataSeen(name="MHT-CET", year=2025), [])
    assert orphans == []
    assert [section.name for section in test.sections] == ["Paper", "Chemistry"]
    assert test.name == "MHT-CET 2025"


def test_answers_match_by_number_and_leave_orphans():
    page = PageRead(questions=[_question("1", "Force")])
    accepted, _pending = take_page(page, page_number=1, pending=None)
    test, orphans = build_test(
        [(accepted[0], 1)],
        {},
        MetadataSeen(),
        [
            AnswerFragment(question_number="Q.1", correct_mcq_option=2),
            AnswerFragment(question_number="99", correct_mcq_option=1),
        ],
    )
    assert test.sections[0].questions[0].correct_mcq_option == 2
    assert [item.question_number for item in orphans] == ["99"]


def test_empty_drafts_raise():
    with pytest.raises(EmptyPaperError):
        build_test([], {}, MetadataSeen(), [])


def test_merge_keeps_options_from_either_half():
    pending = QuestionOnPage(
        number="3",
        question_text="Work done",
        option1="11",
        option2="",
        option3="",
        option4="",
        is_complete=False,
    )
    completion = QuestionOnPage(
        number="3",
        question_text="is 3 J",
        option1="",
        option2="6",
        option3="",
        option4="",
        is_complete=True,
    )
    merged = merge_question(pending, completion)
    assert merged.option1 == "11"
    assert merged.option2 == "6"
    assert "Work done" in merged.question_text


def test_metadata_keeps_the_first_value():
    merged = merge_metadata(
        [MetadataSeen(name="MHT-CET"), MetadataSeen(name="Other", duration_minutes=180)]
    )
    assert merged.name == "MHT-CET"
    assert merged.duration_minutes == 180


def test_same_block_id_on_two_pages_stays_distinct():
    question = QuestionOnPage(
        question_text="See the figure",
        option1="a",
        option2="b",
        option3="c",
        option4="d",
        figure_ids=["b1"],
    )
    block = Block(id="b1", x=0.1, y=0.1, w=0.2, h=0.2, page_number=27, crop_path="/tmp/page-027-b1.png")
    questions, blocks = namespace_blocks([question], [block], 1)
    assert questions[0].figure_ids == ["p1-b1"]
    assert blocks[0].id == "p1-b1"
    assert blocks[0].crop_path == "/tmp/page-027-b1.png"


def test_pixel_box_clamps_to_the_page():
    block = Block(id="b1", x=0.1, y=0.2, w=0.5, h=0.25, page_number=1)
    assert pixel_box(block, 1000, 2000) == (100, 400, 600, 900)


def test_attach_answers_does_not_overwrite_a_printed_option():
    from paper_extract.models import Question

    question = Question(
        position=1,
        question_text="Force",
        option1="a",
        option2="b",
        option3="c",
        option4="d",
        number="1",
        correct_mcq_option=3,
        page_number=1,
    )
    orphans = attach_answers(
        [question],
        [AnswerFragment(question_number="1", correct_mcq_option=1)],
    )
    assert question.correct_mcq_option == 3
    assert orphans == []
