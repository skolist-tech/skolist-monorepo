"""Pipeline wiring with a fake model client and a generated PDF."""

from pathlib import Path

import fitz
import pytest

from paper_extract.errors import PartialQuestionError
from paper_extract.models import Block, PageRead, QuestionOnPage, SvgDecision
from paper_extract.pipeline.graph import Extractor


class FakeClient:
    def __init__(self, pages: dict[int, PageRead], continuation: PageRead | None = None) -> None:
        self.pages = pages
        self.continuation = continuation
        self.calls: list[str] = []

    def complete(self, *, model: str, prompt: str, schema, image_paths=None, purpose: str = "call", cache_key: str | None = None):
        self.calls.append(schema.__name__)
        if schema is PageRead:
            if "Cut-off question number:" in prompt:
                assert self.continuation is not None
                return self.continuation.model_copy(deep=True)
            page_number = int(prompt.split("Page ", 1)[1].split(" ", 1)[0])
            return self.pages[page_number].model_copy(deep=True)
        if schema is SvgDecision:
            return SvgDecision(replaceable=False, reason="test")
        raise AssertionError(schema.__name__)


def _write_pdf(path: Path, pages: int) -> None:
    document = fitz.open()
    for index in range(pages):
        page = document.new_page()
        page.insert_text((72, 72), f"page {index + 1}")
    document.save(path)
    document.close()


def _mcq(number: str, *, complete: bool = True, image: bool = False) -> QuestionOnPage:
    return QuestionOnPage(
        number=number,
        question_text=f"Question {number}",
        option1="a",
        option2="b",
        option3="c",
        option4="d",
        is_complete=complete,
        image_required=image,
        section_name="Physics" if number == "1" else None,
    )


def test_graph_writes_paper_json(tmp_path: Path):
    pdf = tmp_path / "paper.pdf"
    _write_pdf(pdf, 2)
    out = tmp_path / "out"
    client = FakeClient(
        {
            1: PageRead(
                questions=[_mcq("1"), _mcq("2", complete=False)],
                blocks=[Block(id="b1", x=0.1, y=0.1, w=0.2, h=0.2, page_number=1)],
            ),
            2: PageRead(questions=[_mcq("3")]),
        },
        continuation=PageRead(
            completes_pending=True,
            pending_completion=_mcq("2"),
            questions=[_mcq("3")],
        ),
    )
    test = Extractor(client).run(pdf, out, model="fake", fast_model="fake-mini", dpi=72, svg=True)
    assert [question.number for section in test.sections for question in section.questions] == ["1", "2", "3"]
    assert test.sections[0].name == "Physics"
    assert (out / "paper.json").is_file()
    assert (out / "pages" / "page-001.png").is_file()
    assert list((out / "crops").glob("*.png"))
    page_log = (out / "logs" / "page-001.txt").read_text()
    assert "questions kept: 1" in page_log
    assert "waiting for next page: 2" in page_log
    assert "answers: none" in page_log
    assert "page 2" in (out / "logs" / "run.log").read_text()


def test_graph_raises_when_the_next_page_does_not_continue(tmp_path: Path):
    pdf = tmp_path / "paper.pdf"
    _write_pdf(pdf, 2)
    client = FakeClient(
        {
            1: PageRead(questions=[_mcq("1", complete=False)]),
            2: PageRead(questions=[_mcq("9")]),
        },
        continuation=PageRead(questions=[_mcq("9")]),
    )
    with pytest.raises(PartialQuestionError):
        Extractor(client).run(pdf, tmp_path / "out", model="fake", fast_model="fake-mini", dpi=72, svg=False)
