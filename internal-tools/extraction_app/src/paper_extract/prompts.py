"""Prompts for page reading, cheap checks, and SVG redraw."""

from paper_extract.models import AnswerFragment, QuestionOnPage


def page_read_prompt(page_number: int, page_count: int, pending: QuestionOnPage | None) -> str:
    pending_block = "There is no question waiting from the previous page."
    if pending is not None:
        pending_block = (
            "The previous page ended with a cut-off question. "
            "Before you decide it is not on this page, read the whole page, both columns. "
            "The rest of the question may be at the top of the other column, not only at the top of the left column. "
            "If it continues anywhere on this page, set completes_pending true and put the "
            "FULL question (text already read plus the rest, and any options) in pending_completion. "
            "Do not also list that question in questions. If it is nowhere on this page, set "
            "completes_pending false and leave pending_completion null.\n"
            f"Cut-off question number: {pending.number}\n"
            f"Cut-off text so far:\n{pending.question_text}"
        )
    return f"""You are reading one page of a scanned MHT-CET question paper.
Page {page_number} of {page_count}. The page is an image. Trust the image, not any hidden text layer.

Reading order: left column from top to bottom, then the right column from top to bottom.
Ignore watermarks, logos, page numbers, and running headers.

Return only what is on this page.

Extract every question and every answer printed on this page. They are different objects.

Questions:
- A question has a stem. An answer key line is not a question. Never put an answer key into questions.
- Every question is a single-correct MCQ. option1, option2, option3, and option4 are required strings. Copy each option as printed.
- Put the printed question number in number when it is visible. Leave number null when the page shows no number.
- Transcribe text as printed. Use $...$ for inline math and $$...$$ only for display math.
- Do not paraphrase. Do not invent options or answers.
- If this page also shows the correct option for a question, and that question is complete on this page, set correct_mcq_option on the question. Do not also emit an answer object for it.
- explanation is the worked solution in KaTeX. Use $...$ for inline math and $$...$$ only for display math. Leave it null when the page has no solution.
- If the solution has a figure, set explanation_image_required true and explanation_figure_id to that block id.
- A question that stops at the bottom of the left column usually continues at the top of the right column on this same page. Before you mark a question incomplete, or decide a cut-off question is not on this page, read the whole page, including the next column.
- is_complete is false only when the question is still unfinished at the bottom of the page, after both columns, and must continue on the next page.
- Only the last question in reading order may be incomplete.
- continues_previous is true only for the question that finishes a cut-off question from the previous page.
- If a new section heading starts on this page (Physics, Chemistry, Mathematics, or a printed section title), add it to sections_starting and set section_name on the first question of that section.
- image_required / optionN_image_required are true when a figure or table is required to understand that part.
- blocks lists every figure, diagram, graph, chemical structure, or table. Coordinates are fractions of the page image: x, y, w, h, each between 0 and 1, origin at the top-left. Give each block an id like b1, b2.
- figure_ids and optionN_figure_id refer to block ids on THIS page.

Metadata:
- Fill metadata only with facts printed on this page (exam name, year, duration, total marks, marks per correct answer, negative marks, instructions). Leave unknown fields null.

Answers:
- Output an answer object when you see an answer, not a question. This includes answer-key pages and lines like "26 (c)" or "26. 3".
- question_number is the printed number when it is visible, otherwise null. correct_mcq_option is 1, 2, 3, or 4. Do not guess.
- explanation is the worked solution in KaTeX ($...$ inline, $$...$$ for display) when it is printed with that answer and the question is not complete on this page. Leave it null when there is no solution text.
- If that solution has a figure, set explanation_image_required true and explanation_figure_id to that block id.
- If the matching question is not on this page, or it is on this page but not complete, emit the answer object. Do not invent a question to hold it.

{pending_block}
"""


def orphan_pair_prompt(answer: AnswerFragment, question_number: str | None, question_text: str, options: str) -> str:
    return f"""Decide if this answer is the key for this one question. No other question is in view.
Answer: question_number={answer.question_number!r}, correct_mcq_option={answer.correct_mcq_option}.
Question number: {question_number}
Question: {question_text}
Options:
{options}

Set belongs true only when this answer is for this question. Otherwise set belongs false.
"""


def image_link_prompt(question_number: str | None, question_text: str, block_catalog: str) -> str:
    return f"""Attach one unused figure to this MHT-CET question if the figure belongs to it.
Question {question_number}: {question_text}

Candidate figures from this page, the previous page, and the next page:
{block_catalog}

If none belong to the question, set block_id to null.
target is stem when the figure illustrates the question, explanation when it illustrates the solution, or option1/option2/option3/option4 when it is that option.
"""


def svg_decision_prompt() -> str:
    return (
        "Can this exam figure be redrawn faithfully as a simple SVG "
        "(axes, geometry, circuits, rays, free-body diagrams, clean graphs)? "
        "Photographs, dense scanned handwriting, and blurry crops are not replaceable. "
        "Set replaceable true only when a clean SVG would preserve the meaning."
    )


def svg_draw_prompt() -> str:
    return (
        "Redraw this exam figure as one standalone SVG document. "
        "Keep labels, angles, arrows, and relative positions. "
        "No explanation. The svg field must be a single <svg>...</svg> document."
    )
