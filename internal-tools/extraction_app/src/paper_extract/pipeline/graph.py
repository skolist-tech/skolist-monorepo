"""LangGraph that reads a scanned MHT-CET PDF into a Test object."""

import asyncio
import json
import logging
import re
from pathlib import Path
from typing import TypedDict

from langgraph.graph import END, StateGraph

from paper_extract.errors import EmptyPaperError, PartialQuestionError
from paper_extract.llm import ModelClient
from paper_extract.models import (
    AnswerBelongs,
    AnswerFragment,
    Block,
    ImageLink,
    MetadataSeen,
    PageRead,
    Question,
    QuestionOnPage,
    SvgDecision,
    SvgDrawing,
    Test,
)
from paper_extract.pipeline.assemble import (
    build_test,
    merge_metadata,
    namespace_blocks,
    normalize_number,
    take_page,
)
from paper_extract.pipeline.crops import crop_blocks
from paper_extract.pipeline.rasterize import rasterize
from paper_extract.prompts import image_link_prompt, orphan_pair_prompt, page_read_prompt, svg_decision_prompt, svg_draw_prompt

logger = logging.getLogger(__name__)


class ExtractState(TypedDict, total=False):
    pdf_path: str
    out_dir: str
    dpi: int
    model: str
    fast_model: str
    svg: bool
    pages: list[dict]
    page_index: int
    pending: dict | None
    drafts: list[dict]
    draft_pages: list[int]
    blocks: list[dict]
    answers: list[dict]
    metadata_pages: list[dict]
    test: dict


def _rel(path: str | None, out_dir: Path) -> str | None:
    if not path:
        return None
    try:
        return str(Path(path).resolve().relative_to(out_dir.resolve()))
    except ValueError:
        return path


class Extractor:
    def __init__(self, client: ModelClient) -> None:
        self.client = client
        self.graph = self._compile()

    def _compile(self):
        graph = StateGraph(ExtractState)
        graph.add_node("rasterize", self._rasterize)
        graph.add_node("read_pages", self._read_pages)
        graph.add_node("finish", self._finish)
        graph.set_entry_point("rasterize")
        graph.add_edge("rasterize", "read_pages")
        graph.add_edge("read_pages", "finish")
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
        out_dir.mkdir(parents=True, exist_ok=True)
        result = self.graph.invoke(
            {
                "pdf_path": str(pdf_path),
                "out_dir": str(out_dir),
                "dpi": dpi,
                "model": model,
                "fast_model": fast_model,
                "svg": svg,
                "pages": [],
                "page_index": 0,
                "pending": None,
                "drafts": [],
                "draft_pages": [],
                "blocks": [],
                "answers": [],
                "metadata_pages": [],
            }
        )
        return Test.model_validate(result["test"])

    def _rasterize(self, state: ExtractState) -> dict:
        pages = rasterize(Path(state["pdf_path"]), Path(state["out_dir"]) / "pages", state["dpi"])
        if not pages:
            raise EmptyPaperError("The PDF has no pages.")
        return {"pages": pages, "page_index": 0}

    def _read_pages(self, state: ExtractState) -> dict:
        return asyncio.run(self._read_pages_async(state))

    async def _read_pages_async(self, state: ExtractState) -> dict:
        page_count = len(state["pages"])
        logger.info("reading %s pages concurrently", page_count)
        reads = list(
            await asyncio.gather(
                *[self._fetch_page(state, index, None) for index in range(page_count)]
            )
        )
        pending: QuestionOnPage | None = None
        drafts: list[dict] = []
        draft_pages: list[int] = []
        blocks: list[dict] = []
        answers: list[dict] = []
        metadata_pages: list[dict] = []
        extraction_dir = Path(state["out_dir"]) / "extractions"
        extraction_dir.mkdir(parents=True, exist_ok=True)
        for index, page in enumerate(state["pages"]):
            read = reads[index]
            if pending is not None:
                logger.info("page %s continues a cut-off question", page["page_number"])
                read = await self._fetch_page(state, index, pending)
            accepted, pending = take_page(read, page_number=page["page_number"], pending=pending)
            _write_page_log(state["out_dir"], page["page_number"], read, accepted, pending)
            (extraction_dir / f"page-{page['page_number']:03d}.json").write_text(read.model_dump_json(indent=2))
            crops = crop_blocks(
                Path(page["path"]),
                read.blocks,
                Path(state["out_dir"]) / "crops",
                page_number=page["page_number"],
                width=page["width"],
                height=page["height"],
            )
            held = [pending] if pending is not None else []
            rebound, crops = namespace_blocks([*accepted, *held], crops, page["page_number"])
            accepted = rebound[: len(accepted)]
            if held:
                pending = rebound[len(accepted)]
            drafts.extend(item.model_dump() for item in accepted)
            draft_pages.extend([page["page_number"]] * len(accepted))
            blocks.extend(block.model_dump() for block in crops)
            answers.extend(answer.model_dump() for answer in read.answers)
            metadata_pages.append(read.metadata.model_dump())
        return {
            "pending": pending.model_dump() if pending else None,
            "drafts": drafts,
            "draft_pages": draft_pages,
            "blocks": blocks,
            "answers": answers,
            "metadata_pages": metadata_pages,
        }

    async def _fetch_page(
        self,
        state: ExtractState,
        index: int,
        pending: QuestionOnPage | None,
    ) -> PageRead:
        page = state["pages"][index]
        prompt = page_read_prompt(page["page_number"], len(state["pages"]), pending)
        image_paths = [Path(page["path"])]
        if pending is not None and index > 0:
            image_paths.insert(0, Path(state["pages"][index - 1]["path"]))
        task = _page_task(page["page_number"], pending)
        call = getattr(self.client, "acomplete", None)
        kwargs = {
            "model": state["model"],
            "prompt": prompt,
            "schema": PageRead,
            "image_paths": image_paths,
            "purpose": _page_purpose(page["page_number"], pending),
            "cache_key": _cache_key(state["pdf_path"], task),
        }
        if call is None:
            read = await asyncio.to_thread(self.client.complete, **kwargs)
        else:
            read = await call(**kwargs)
        assert isinstance(read, PageRead)
        return read

    async def _complete(self, **kwargs):
        call = getattr(self.client, "acomplete", None)
        if call is None:
            return await asyncio.to_thread(self.client.complete, **kwargs)
        return await call(**kwargs)

    def _finish(self, state: ExtractState) -> dict:
        if state.get("pending"):
            pending = QuestionOnPage.model_validate(state["pending"])
            last_page = state["pages"][-1]["page_number"] if state["pages"] else 1
            raise PartialQuestionError(
                page_number=last_page,
                question_number=pending.number,
                question_text=pending.question_text,
            )
        out_dir = Path(state["out_dir"])
        drafts = [QuestionOnPage.model_validate(item) for item in state["drafts"]]
        pages = list(state["draft_pages"])
        blocks = [Block.model_validate(item) for item in state["blocks"]]
        by_id = {block.id: block for block in blocks}
        answers = [AnswerFragment.model_validate(item) for item in state["answers"]]
        metadata = merge_metadata([MetadataSeen.model_validate(item) for item in state["metadata_pages"]])
        test, orphans = build_test(list(zip(drafts, pages, strict=True)), by_id, metadata, answers)
        warnings = self._link_orphan_answers(state, test, orphans)
        warnings.extend(self._link_cross_page_images(state, test, blocks))
        if state.get("svg", True):
            warnings.extend(self._replace_with_svg(state, test))
        test.warnings = warnings
        self._relativize(test, out_dir)
        (out_dir / "paper.json").write_text(test.model_dump_json(indent=2))
        (out_dir / "trace.json").write_text(
            json.dumps(
                {
                    "pages": len(state["pages"]),
                    "questions": sum(len(section.questions) for section in test.sections),
                    "warnings": warnings,
                },
                indent=2,
            )
        )
        return {"test": test.model_dump()}

    def _link_orphan_answers(self, state: ExtractState, test: Test, orphans: list[AnswerFragment]) -> list[str]:
        warnings: list[str] = []
        if not orphans:
            return warnings
        open_questions = [
            question
            for section in test.sections
            for question in section.questions
            if question.correct_mcq_option is None and question.number
        ]
        for answer in orphans:
            candidates = [question for question in open_questions if question.correct_mcq_option is None]
            candidates.sort(key=lambda question: normalize_number(question.number) != normalize_number(answer.question_number))
            matched = False
            for question in candidates:
                options = "\n".join(
                    f"{index}. {text}"
                    for index, text in enumerate(
                        (question.option1, question.option2, question.option3, question.option4),
                        start=1,
                    )
                )
                verdict = self.client.complete(
                    model=state["fast_model"],
                    prompt=orphan_pair_prompt(
                        answer,
                        question.number,
                        question.question_text[:400],
                        options,
                    ),
                    schema=AnswerBelongs,
                    purpose=f"orphan answer {answer.question_number or '?'} vs question {question.number or question.position}",
                    cache_key=_cache_key(
                        state["pdf_path"],
                        f"orphan-answer-{answer.question_number or 'none'}-question-{question.number or question.position}",
                    ),
                )
                assert isinstance(verdict, AnswerBelongs)
                if not verdict.belongs:
                    continue
                question.correct_mcq_option = answer.correct_mcq_option
                if answer.explanation and not question.explanation:
                    question.explanation = answer.explanation
                matched = True
                break
            if not matched:
                warnings.append(f"Unmatched answer for question {answer.question_number or '(no number)'}.")
        return warnings

    def _link_cross_page_images(self, state: ExtractState, test: Test, blocks: list[Block]) -> list[str]:
        warnings: list[str] = []
        used = {
            path
            for section in test.sections
            for question in section.questions
            for path in (
                question.image_path,
                question.option1_image_path,
                question.option2_image_path,
                question.option3_image_path,
                question.option4_image_path,
                question.explanation_image_path,
            )
            if path
        }
        free = [block for block in blocks if block.crop_path and block.crop_path not in used]
        if not free:
            return warnings
        catalog = "\n".join(
            f"- {block.id} page {block.page_number} ({block.kind})" for block in free
        )
        by_id = {block.id: block for block in free}
        for section in test.sections:
            for question in section.questions:
                missing = _missing_image_targets(question)
                if not missing:
                    continue
                link = self.client.complete(
                    model=state["fast_model"],
                    prompt=image_link_prompt(question.number, question.question_text, catalog),
                    schema=ImageLink,
                    image_paths=[Path(block.crop_path) for block in free if block.crop_path][:6],
                    purpose=f"page {question.page_number} question {question.number or question.position} image link",
                    cache_key=_cache_key(
                        state["pdf_path"],
                        f"image-link-page-{question.page_number}-question-{question.number or question.position}",
                    ),
                )
                assert isinstance(link, ImageLink)
                block = by_id.get(link.block_id or "")
                if block is None or not block.crop_path:
                    warnings.append(
                        f"Question {question.number or question.position} still has no figure."
                    )
                    continue
                target = link.target if link.target in missing else missing[0]
                _assign_image(question, target, block.crop_path)
                if block.id not in question.source_block_ids:
                    question.source_block_ids.append(block.id)
        return warnings

    def _replace_with_svg(self, state: ExtractState, test: Test) -> list[str]:
        return asyncio.run(self._replace_with_svg_async(state, test))

    async def _replace_with_svg_async(self, state: ExtractState, test: Test) -> list[str]:
        jobs = []
        for section in test.sections:
            for question in section.questions:
                for path_attr, svg_attr in (
                    ("image_path", "svg_image_code"),
                    ("option1_image_path", "option1_svg_image_code"),
                    ("option2_image_path", "option2_svg_image_code"),
                    ("option3_image_path", "option3_svg_image_code"),
                    ("option4_image_path", "option4_svg_image_code"),
                    ("explanation_image_path", "explanation_svg_image_code"),
                ):
                    if getattr(question, path_attr):
                        jobs.append(self._svg_one(state, question, path_attr, svg_attr))
        if not jobs:
            return []
        logger.info("checking %s figures for svg", len(jobs))
        warnings = await asyncio.gather(*jobs)
        return [warning for warning in warnings if warning]

    async def _svg_one(self, state: ExtractState, question: Question, path_attr: str, svg_attr: str) -> str | None:
        image_path = getattr(question, path_attr)
        slot = _svg_slot(path_attr)
        label = f"page {question.page_number} question {question.number or question.position} {slot}"
        image = _image_file(state["out_dir"], image_path)
        decision = await self._complete(
            model=state["fast_model"],
            prompt=svg_decision_prompt(),
            schema=SvgDecision,
            image_paths=[image],
            purpose=f"{label} svg check",
            cache_key=_cache_key(
                state["pdf_path"],
                f"svg-check-page-{question.page_number}-question-{question.number or question.position}-{slot}",
            ),
        )
        assert isinstance(decision, SvgDecision)
        if not decision.replaceable:
            return None
        drawing = await self._complete(
            model=state["model"],
            prompt=svg_draw_prompt(),
            schema=SvgDrawing,
            image_paths=[image],
            purpose=f"{label} svg draw",
            cache_key=_cache_key(
                state["pdf_path"],
                f"svg-draw-page-{question.page_number}-question-{question.number or question.position}-{slot}",
            ),
        )
        assert isinstance(drawing, SvgDrawing)
        svg = drawing.svg.strip()
        if not svg.startswith("<svg") or "</svg>" not in svg:
            return f"SVG redraw for question {question.number or question.position} was discarded."
        setattr(question, svg_attr, svg)
        return None

    def _relativize(self, test: Test, out_dir: Path) -> None:
        for section in test.sections:
            for question in section.questions:
                for attr in (
                    "image_path",
                    "option1_image_path",
                    "option2_image_path",
                    "option3_image_path",
                    "option4_image_path",
                    "explanation_image_path",
                ):
                    setattr(question, attr, _rel(getattr(question, attr), out_dir))


def _clip(text: str, limit: int = 110) -> str:
    flat = " ".join(text.split())
    if len(flat) <= limit:
        return flat
    return flat[: limit - 1] + "…"


def _summarize_page(
    page_number: int,
    read: PageRead,
    accepted: list[QuestionOnPage],
    pending: QuestionOnPage | None,
) -> str:
    lines = [f"page {page_number}"]
    if read.sections_starting:
        lines.append("  sections: " + ", ".join(section.name for section in read.sections_starting))
    else:
        lines.append("  sections: none")
    lines.append(f"  questions kept: {len(accepted)}")
    for question in accepted:
        state = "complete" if question.is_complete else "INCOMPLETE"
        option_count = sum(
            1 for option in (question.option1, question.option2, question.option3, question.option4) if option
        )
        answer = f" correct={question.correct_mcq_option}" if question.correct_mcq_option else ""
        lines.append(
            f"    {question.number or '?'} {state} options={option_count}{answer} {_clip(question.question_text)}"
        )
    if pending is not None:
        lines.append(f"  waiting for next page: {pending.number or '?'} {_clip(pending.question_text)}")
    if read.answers:
        for answer in read.answers:
            lines.append(f"  answer: {answer.question_number} -> option {answer.correct_mcq_option}")
    else:
        lines.append("  answers: none")
    if read.blocks:
        lines.append("  figures: " + ", ".join(f"{block.id} {block.kind}" for block in read.blocks))
    else:
        lines.append("  figures: none")
    if read.completes_pending:
        lines.append("  completed a question from the previous page")
    return "\n".join(lines)


def _write_page_log(
    out_dir: str,
    page_number: int,
    read: PageRead,
    accepted: list[QuestionOnPage],
    pending: QuestionOnPage | None,
) -> None:
    summary = _summarize_page(page_number, read, accepted, pending)
    logger.info("%s", summary)
    log_dir = Path(out_dir) / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    (log_dir / f"page-{page_number:03d}.txt").write_text(summary + "\n")
    with (log_dir / "run.log").open("a", encoding="utf-8") as handle:
        handle.write(summary + "\n\n")


def _image_file(out_dir: str, image_path: str) -> Path:
    path = Path(image_path)
    if path.is_file():
        return path
    return Path(out_dir) / path


def _cache_key(pdf_path: str, task: str) -> str:
    stem = Path(pdf_path).stem
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", task).strip("-")
    return f"{stem}-{slug}.txt"


def _page_task(page_number: int, pending: QuestionOnPage | None) -> str:
    if pending is None:
        return f"page-read-{page_number}"
    return f"page-continuation-{page_number}"


def _page_purpose(page_number: int, pending: QuestionOnPage | None) -> str:
    if pending is None:
        return f"page {page_number} read"
    return f"page {page_number} continuation"


def _svg_slot(path_attr: str) -> str:
    if path_attr == "image_path":
        return "stem"
    return path_attr.removesuffix("_image_path")


def _missing_image_targets(question: Question) -> list[str]:
    missing: list[str] = []
    if question.image_required and not question.image_path:
        missing.append("stem")
    if question.option1_image_required and not question.option1_image_path:
        missing.append("option1")
    if question.option2_image_required and not question.option2_image_path:
        missing.append("option2")
    if question.option3_image_required and not question.option3_image_path:
        missing.append("option3")
    if question.option4_image_required and not question.option4_image_path:
        missing.append("option4")
    if question.explanation_image_required and not question.explanation_image_path:
        missing.append("explanation")
    return missing


def _assign_image(question: Question, target: str, path: str) -> None:
    if target == "option1":
        question.option1_image_path = path
    elif target == "option2":
        question.option2_image_path = path
    elif target == "option3":
        question.option3_image_path = path
    elif target == "option4":
        question.option4_image_path = path
    elif target == "explanation":
        question.explanation_image_path = path
    else:
        question.image_path = path
