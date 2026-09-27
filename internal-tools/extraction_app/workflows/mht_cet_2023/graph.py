"""LangGraph for the MHT-CET 2023 papers.

Input is a PDF path. Output is paper.json.

Assumptions for this sitting:
- The test title is printed on page 1.
- There are 150 four-option MCQs. Numbers do not reset.
- Questions 1-50 are Maths, 51-100 Chemistry, 101-150 Physics.
- A question starts at a "Question n" heading, may continue across pages,
  and is followed by its own answer and explanation. Options are A B C D.
- Figures are SVG only. The paper JSON does not store raster crops.
"""

import asyncio
import json
import logging
import re
from collections.abc import Callable
from pathlib import Path
from typing import TypedDict

from langgraph.graph import END, StateGraph

from common.errors import EmptyPaperError, PaperExtractError
from common.jev import noul
from common.llm import ModelTurn
from common.models import Question, Section, Test
from common.rasterize import rasterize
from workflows.mht_cet_2023.prompts import (
    SEE_NEXT_PAGE_TOOL,
    question_output_prompt,
    question_starts_criteria,
    question_tool_prompt,
    title_prompt,
    transcription_prompt,
)
from workflows.mht_cet_2023.schemas import ExtractedQuestion, PageTranscript, PaperTitle

logger = logging.getLogger(__name__)

QUESTION_COUNT = 150
MAX_NEXT_PAGE_CALLS = 10
# Jev returns the probability that the answer is yes. At 0.5 it is a toss-up.
JEV_YES_AT = 0.5
_SVG_BLOCK = re.compile(r"<svg\b.*?</svg>", re.IGNORECASE | re.DOTALL)
YEAR = 2023
SUBJECTS = (
    (1, 50, "Maths"),
    (51, 100, "Chemistry"),
    (101, 150, "Physics"),
)


class QuestionNotFoundError(PaperExtractError):
    """The two-pointer search never found the start of this question."""

    def __init__(self, question_number: int, searched_from_page: int) -> None:
        self.question_number = question_number
        self.searched_from_page = searched_from_page
        super().__init__(
            f"Question {question_number} does not start on any page from page {searched_from_page} onward."
        )


class ExtractState(TypedDict, total=False):
    pdf_path: str
    out_dir: str
    dpi: int
    model: str
    fast_model: str
    pages: list[dict]
    transcripts: list[str]
    title: str
    starts: list[int]
    questions: list[dict]
    test: dict


def text_for_jev(transcript: str) -> str:
    """Drop SVG markup. Jev only needs the words to decide whether a question starts."""
    return _SVG_BLOCK.sub(" [diagram] ", transcript)


def locate_question_pages(
    page_count: int,
    present: Callable[[int, int], bool],
    *,
    question_count: int = QUESTION_COUNT,
) -> list[int]:
    """Return the 1-based start page of each question.

    present(page_index, question_number) is true when that question starts on
    that 0-based page. The search for question n starts on the page where
    question n-1 started, because one page can hold two questions.
    """
    starts: list[int] = []
    cursor = 0
    for number in range(1, question_count + 1):
        found = None
        for page in range(cursor, page_count):
            if present(page, number):
                found = page
                break
        if found is None:
            raise QuestionNotFoundError(number, cursor + 1)
        logger.info("question %s starts on page %s", number, found + 1)
        starts.append(found + 1)
        cursor = found
    return starts


class Extractor:
    def __init__(self, client: object) -> None:
        self.client = client
        self.graph = self._compile()

    def _compile(self):
        graph = StateGraph(ExtractState)
        graph.add_node("rasterize", self._rasterize)
        graph.add_node("transcribe", self._transcribe)
        graph.add_node("locate", self._locate)
        graph.add_node("extract", self._extract)
        graph.add_node("assemble", self._assemble)
        graph.set_entry_point("rasterize")
        graph.add_edge("rasterize", "transcribe")
        graph.add_edge("transcribe", "locate")
        graph.add_edge("locate", "extract")
        graph.add_edge("extract", "assemble")
        graph.add_edge("assemble", END)
        return graph.compile()

    def run(
        self,
        pdf_path: Path,
        out_dir: Path,
        *,
        model: str,
        fast_model: str,
        dpi: int,
        svg: bool,
    ) -> Test:
        if not svg:
            logger.info("mht_cet_2023 always writes SVG and does not write raster crops")
        out_dir.mkdir(parents=True, exist_ok=True)
        result = self.graph.invoke(
            {
                "pdf_path": str(pdf_path),
                "out_dir": str(out_dir),
                "dpi": dpi,
                "model": model,
                "fast_model": fast_model,
                "pages": [],
                "transcripts": [],
                "title": "",
                "starts": [],
                "questions": [],
            }
        )
        return Test.model_validate(result["test"])

    def _rasterize(self, state: ExtractState) -> dict:
        pages = rasterize(Path(state["pdf_path"]), Path(state["out_dir"]) / "pages", state["dpi"])
        if not pages:
            raise EmptyPaperError("The PDF has no pages.")
        return {"pages": pages}

    def _transcribe(self, state: ExtractState) -> dict:
        return asyncio.run(self._transcribe_async(state))

    async def _transcribe_async(self, state: ExtractState) -> dict:
        page_count = len(state["pages"])
        logger.info("transcribing %s pages", page_count)

        async def one(page: dict) -> str:
            read = await self._schema(
                model=state["model"],
                prompt=transcription_prompt(page["page_number"], page_count),
                schema=PageTranscript,
                image_paths=[Path(page["path"])],
                purpose=f"page {page['page_number']} transcript",
                cache_key=_cache_key(state["pdf_path"], f"transcript-{page['page_number']}"),
            )
            assert isinstance(read, PageTranscript)
            return read.transcript

        transcripts = list(await asyncio.gather(*(one(page) for page in state["pages"])))
        transcript_dir = Path(state["out_dir"]) / "transcripts"
        transcript_dir.mkdir(parents=True, exist_ok=True)
        for page, text in zip(state["pages"], transcripts, strict=True):
            (transcript_dir / f"page-{page['page_number']:03d}.txt").write_text(text + "\n")
        return {"transcripts": transcripts}

    def _locate(self, state: ExtractState) -> dict:
        title_read = self.client.complete(
            model=state["model"],
            prompt=title_prompt(),
            schema=PaperTitle,
            image_paths=[Path(state["pages"][0]["path"])],
            purpose="paper title",
            cache_key=_cache_key(state["pdf_path"], "paper-title"),
        )
        assert isinstance(title_read, PaperTitle)
        title = title_read.title.strip() or "MHT-CET 2023"
        transcripts = state["transcripts"]

        def present(page_index: int, number: int) -> bool:
            page_number = page_index + 1
            instructions, yes, no = question_starts_criteria(number)
            probability = noul(
                text_for_jev(transcripts[page_index]),
                instructions=instructions,
                yes=yes,
                no=no,
                purpose=f"question {number} present on page {page_number}",
                cache_key=_cache_key(state["pdf_path"], f"present-{number}-page-{page_number}"),
            )
            return probability >= JEV_YES_AT

        starts = locate_question_pages(len(transcripts), present)
        log_dir = Path(state["out_dir"]) / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        (log_dir / "question-pages.json").write_text(
            json.dumps({str(number): page for number, page in enumerate(starts, start=1)}, indent=2)
        )
        return {"title": title, "starts": starts}

    def _extract(self, state: ExtractState) -> dict:
        return asyncio.run(self._extract_async(state))

    async def _extract_async(self, state: ExtractState) -> dict:
        logger.info("extracting %s questions", QUESTION_COUNT)
        extracted = await asyncio.gather(
            *(
                self._extract_one(state, number, state["starts"][number - 1])
                for number in range(1, QUESTION_COUNT + 1)
            )
        )
        extraction_dir = Path(state["out_dir"]) / "extractions"
        extraction_dir.mkdir(parents=True, exist_ok=True)
        dumped: list[dict] = []
        for number, (question, opened) in enumerate(extracted, start=1):
            payload = {
                "start_page": state["starts"][number - 1],
                "opened_pages": opened,
                "question": question.model_dump(),
            }
            (extraction_dir / f"question-{number:03d}.json").write_text(json.dumps(payload, indent=2))
            dumped.append(question.model_dump())
        return {"questions": dumped}

    async def _extract_one(self, state: ExtractState, number: int, start_page: int) -> tuple[ExtractedQuestion, list[int]]:
        messages, opened = await self._follow(state, number, start_page)
        messages.append({"role": "user", "content": question_output_prompt(number)})
        question = await self._schema_messages(
            model=state["model"],
            messages=messages,
            schema=ExtractedQuestion,
            purpose=f"question {number} extract",
            cache_key=_cache_key(state["pdf_path"], f"question-{number}-extract"),
        )
        assert isinstance(question, ExtractedQuestion)
        return question, opened

    async def _follow(self, state: ExtractState, number: int, start_page: int) -> tuple[list[dict], list[int]]:
        transcripts = state["transcripts"]
        messages: list[dict] = [
            {
                "role": "user",
                "content": question_tool_prompt(number, start_page, transcripts[start_page - 1]),
            }
        ]
        opened: list[int] = []
        seen = 0
        for turn_index in range(MAX_NEXT_PAGE_CALLS + 1):
            turn = await self._turn(
                model=state["model"],
                messages=messages,
                tools=[SEE_NEXT_PAGE_TOOL],
                purpose=f"question {number} tool {turn_index}",
                cache_key=_cache_key(state["pdf_path"], f"question-{number}-tool-{turn_index}"),
            )
            messages.append(_assistant_message(turn))
            if not turn.tool_calls or seen >= MAX_NEXT_PAGE_CALLS:
                break
            for call in turn.tool_calls:
                if seen >= MAX_NEXT_PAGE_CALLS:
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": call.id,
                            "content": "No further pages can be opened.",
                        }
                    )
                    continue
                seen += 1
                page_number, content = _open_next_page(call.name, call.arguments.get("n"), start_page, transcripts)
                if page_number is not None:
                    opened.append(page_number)
                messages.append({"role": "tool", "tool_call_id": call.id, "content": content})
            if seen >= MAX_NEXT_PAGE_CALLS:
                break
        return messages, opened

    async def _schema(self, **kwargs):
        call = getattr(self.client, "acomplete", None)
        if call is None:
            return await asyncio.to_thread(self.client.complete, **kwargs)
        return await call(**kwargs)

    async def _schema_messages(self, **kwargs):
        call = getattr(self.client, "acomplete_messages", None)
        if call is None:
            return await asyncio.to_thread(self.client.complete_messages, **kwargs)
        return await call(**kwargs)

    async def _turn(self, **kwargs) -> ModelTurn:
        call = getattr(self.client, "acomplete_turn", None)
        if call is None:
            turn = await asyncio.to_thread(self.client.complete_turn, **kwargs)
        else:
            turn = await call(**kwargs)
        assert isinstance(turn, ModelTurn)
        return turn

    def _assemble(self, state: ExtractState) -> dict:
        warnings: list[str] = []
        sections: list[Section] = []
        for index, (first, last, name) in enumerate(SUBJECTS, start=1):
            questions: list[Question] = []
            for number in range(first, last + 1):
                raw = ExtractedQuestion.model_validate(state["questions"][number - 1])
                questions.append(
                    Question(
                        number=str(number),
                        position=number - first + 1,
                        question_text=raw.question_text,
                        option1=raw.option1,
                        option2=raw.option2,
                        option3=raw.option3,
                        option4=raw.option4,
                        correct_mcq_option=raw.correct_mcq_option,
                        explanation=raw.explanation,
                        svg_image_code=_take_svg(raw.question_svg, number, "stem", warnings),
                        option1_svg_image_code=_take_svg(raw.option1_svg, number, "option A", warnings),
                        option2_svg_image_code=_take_svg(raw.option2_svg, number, "option B", warnings),
                        option3_svg_image_code=_take_svg(raw.option3_svg, number, "option C", warnings),
                        option4_svg_image_code=_take_svg(raw.option4_svg, number, "option D", warnings),
                        explanation_svg_image_code=_take_svg(raw.explanation_svg, number, "explanation", warnings),
                        page_number=state["starts"][number - 1],
                    )
                )
            sections.append(Section(name=name, position=index, questions=questions))
        test = Test(name=state["title"], year=YEAR, sections=sections, warnings=warnings)
        out_dir = Path(state["out_dir"])
        (out_dir / "paper.json").write_text(test.model_dump_json(indent=2))
        (out_dir / "trace.json").write_text(
            json.dumps(
                {
                    "pages": len(state["pages"]),
                    "questions": QUESTION_COUNT,
                    "warnings": warnings,
                },
                indent=2,
            )
        )
        return {"test": test.model_dump()}


def _open_next_page(
    name: str,
    offset: object,
    start_page: int,
    transcripts: list[str],
) -> tuple[int | None, str]:
    if name != "see_next_page":
        return None, "Unknown tool. Use see_next_page."
    n = _offset(offset)
    if n is None:
        return None, "n must be an integer >= 1. n=1 is the next page after the question's first page."
    page_number = start_page + n
    if page_number < 1 or page_number > len(transcripts):
        return None, f"There is no page {page_number}."
    return page_number, f"Page {page_number} transcript:\n{transcripts[page_number - 1]}"


def _offset(value: object) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int) and value >= 1:
        return value
    if isinstance(value, str) and value.isdigit() and int(value) >= 1:
        return int(value)
    return None


def _assistant_message(turn: ModelTurn) -> dict:
    message: dict = {"role": "assistant", "content": turn.content or ""}
    if turn.tool_calls:
        message["tool_calls"] = [
            {
                "id": call.id,
                "type": "function",
                "function": {"name": call.name, "arguments": json.dumps(call.arguments)},
            }
            for call in turn.tool_calls
        ]
    return message


def _take_svg(value: str | None, number: int, slot: str, warnings: list[str]) -> str | None:
    if value is None or not value.strip():
        return None
    text = value.strip()
    if "<svg" not in text or "</svg>" not in text:
        warnings.append(f"Question {number} {slot} SVG was discarded.")
        return None
    return text


def _cache_key(pdf_path: str, task: str) -> str:
    stem = Path(pdf_path).stem
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", task).strip("-")
    return f"{stem}-{slug}.txt"
