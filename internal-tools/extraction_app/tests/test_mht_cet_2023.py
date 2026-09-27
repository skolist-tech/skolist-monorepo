"""MHT-CET 2023 graph: transcripts, two-pointer question starts, then one question per call."""

import asyncio
import json
from pathlib import Path

import fitz
import pytest

from common.llm import ModelTurn, ToolCall
from workflows.mht_cet_2023.graph import (
    QUESTION_COUNT,
    Extractor,
    QuestionNotFoundError,
    locate_question_pages,
    text_for_jev,
)
from workflows.mht_cet_2023.schemas import ExtractedQuestion, PageTranscript, PaperTitle


def test_next_question_is_sought_from_the_previous_start_page():
    calls: list[tuple[int, int]] = []

    def present(page: int, number: int) -> bool:
        calls.append((page, number))
        return (page, number) in {(0, 1), (0, 2), (2, 3)}

    starts = locate_question_pages(3, present, question_count=3)
    assert starts == [1, 1, 3]
    assert calls == [(0, 1), (0, 2), (0, 3), (1, 3), (2, 3)]


def test_missing_question_reports_the_page_the_search_started_on():
    with pytest.raises(QuestionNotFoundError) as caught:
        locate_question_pages(2, lambda page, number: number == 1 and page == 0, question_count=2)
    assert caught.value.question_number == 2
    assert caught.value.searched_from_page == 1


def test_every_question_may_start_on_page_one():
    starts = locate_question_pages(1, lambda page, number: page == 0)
    assert starts == [1] * QUESTION_COUNT


def test_see_next_page_stops_after_ten_calls():
    class AlwaysTool:
        def __init__(self) -> None:
            self.calls = 0

        def complete_turn(self, **kwargs):
            self.calls += 1
            return ModelTurn(
                tool_calls=[ToolCall(id=f"c{self.calls}", name="see_next_page", arguments={"n": 1})]
            )

    client = AlwaysTool()
    messages, opened = asyncio.run(
        Extractor(client)._follow(
            {"model": "fake", "pdf_path": "paper.pdf", "transcripts": ["one", "two"]},
            1,
            1,
        )
    )
    assert client.calls == 10
    assert opened == [2] * 10
    assert sum(1 for message in messages if message["role"] == "tool") == 10


class Fake2023:
    def complete(self, *, model: str, prompt: str, schema, image_paths=None, purpose: str = "call", cache_key=None):
        if schema is PageTranscript:
            page = int(purpose.split()[1])
            text = "PAGE-2-MARKER" if page == 2 else f"page-{page}"
            return PageTranscript(transcript=text)
        if schema is PaperTitle:
            return PaperTitle(title="14 May Morning")
        raise AssertionError(schema.__name__)

    def complete_turn(self, *, model: str, messages: list, tools: list, purpose: str = "call", cache_key=None):
        if purpose == "question 1 tool 0":
            return ModelTurn(tool_calls=[ToolCall(id="c1", name="see_next_page", arguments={"n": 1})])
        return ModelTurn()

    def complete_messages(self, *, model: str, messages: list, schema, purpose: str = "call", cache_key=None):
        number = int(purpose.split()[1])
        blob = json.dumps(messages)
        explanation = "saw-next" if "PAGE-2-MARKER" in blob else "same-page"
        svg = "<svg>stem</svg>" if number == 1 else "not-svg" if number == 2 else None
        return ExtractedQuestion(
            question_text=f"Q{number}",
            option1="A",
            option2="B",
            option3="C",
            option4="D",
            correct_mcq_option=2,
            explanation=explanation,
            question_svg=svg,
        )


def _write_pdf(path: Path, pages: int) -> None:
    document = fitz.open()
    for index in range(pages):
        page = document.new_page()
        page.insert_text((72, 72), f"page {index + 1}")
    document.save(path)
    document.close()


def _noul_from_purpose(purpose: str, *, only_question_one: bool = False) -> float:
    number = int(purpose.split()[1])
    page = int(purpose.rsplit(" ", 1)[-1])
    if only_question_one:
        return 1.0 if number == 1 and page == 1 else 0.0
    return 1.0 if page == 1 else 0.0


def test_diagrams_are_not_sent_to_jev():
    text = text_for_jev('Question 3\n<svg xmlns="http://www.w3.org/2000/svg"><text>P1</text></svg>\nOptions')
    assert "<svg" not in text
    assert "Question 3" in text
    assert "[diagram]" in text


def test_graph_writes_sections_from_fixed_ranges(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(
        "workflows.mht_cet_2023.graph.noul",
        lambda state, **kwargs: _noul_from_purpose(kwargs["purpose"]),
    )
    pdf = tmp_path / "paper.pdf"
    _write_pdf(pdf, 2)
    out = tmp_path / "out"
    test = Extractor(Fake2023()).run(pdf, out, model="fake", fast_model="fake-mini", dpi=72, svg=True)
    assert test.name == "14 May Morning"
    assert test.year == 2023
    assert [section.name for section in test.sections] == ["Maths", "Chemistry", "Physics"]
    assert [len(section.questions) for section in test.sections] == [50, 50, 50]
    assert test.sections[0].questions[0].number == "1"
    assert test.sections[1].questions[0].number == "51"
    assert test.sections[2].questions[0].number == "101"
    first = test.sections[0].questions[0]
    second = test.sections[0].questions[1]
    assert first.correct_mcq_option == 2
    assert first.option1 == "A"
    assert first.explanation == "saw-next"
    assert first.svg_image_code == "<svg>stem</svg>"
    assert first.image_path is None
    assert second.explanation == "same-page"
    assert second.svg_image_code is None
    assert any("Question 2" in warning for warning in test.warnings)
    assert (out / "paper.json").is_file()
    assert (out / "pages" / "page-001.png").is_file()
    assert "PAGE-2-MARKER" in (out / "transcripts" / "page-002.txt").read_text()
    pages = json.loads((out / "logs" / "question-pages.json").read_text())
    assert pages["1"] == 1
    assert pages["150"] == 1
    opened = json.loads((out / "extractions" / "question-001.json").read_text())
    assert opened["opened_pages"] == [2]
    assert not (out / "crops").exists()


def test_graph_stops_when_a_question_never_starts(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(
        "workflows.mht_cet_2023.graph.noul",
        lambda state, **kwargs: _noul_from_purpose(kwargs["purpose"], only_question_one=True),
    )
    pdf = tmp_path / "paper.pdf"
    _write_pdf(pdf, 1)
    with pytest.raises(QuestionNotFoundError) as caught:
        Extractor(Fake2023()).run(
            pdf,
            tmp_path / "out",
            model="fake",
            fast_model="fake-mini",
            dpi=72,
            svg=True,
        )
    assert caught.value.question_number == 2
