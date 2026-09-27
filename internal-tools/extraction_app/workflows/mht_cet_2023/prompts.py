"""Prompts for the MHT-CET 2023 papers.

A question starts at a "Question n" heading and may continue across pages.
Its options are A B C D. The answer and explanation follow that question.
Diagrams are transcribed as SVG. Question numbers do not reset between subjects.
"""

# Same rule as backend/api/v1/qgen/prompts/common_instructions.py: inline KaTeX
# unless a formula cannot be read on one line.
_INLINE_MATH = """
Math is KaTeX. Write every formula as inline math: $...$.
Do not use display math ($$...$$) for a formula that fits on one line. A formula printed alone or centered on the page is still inline. Examples that stay inline: $ax^{2}+(2a+1)xy+2y^{2}=0$, $A=a$, $m_{1}=\\frac{1}{m_{2}}$, $\\frac{1}{2}\\times$ base $\\times$ height.
Display math is only for a formula that cannot be written inline: a matrix, a cases block, an alignment of several lines, or one long derivation that is unreadable as a single inline expression.
Do not place two $...$ spans next to each other with nothing between them. Put at least a space or a word between them.
""".strip()

SEE_NEXT_PAGE_TOOL = {
    "type": "function",
    "function": {
        "name": "see_next_page",
        "description": (
            "Read one later page. n is how many pages after the page where this question starts. "
            "n=1 is the immediately following page. n=2 is the page after that. "
            "Use this when the question, its options, its answer, or its explanation continues "
            "past the pages you already have."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "n": {
                    "type": "integer",
                    "minimum": 1,
                    "description": "Pages after the question's starting page. 1 is the next page.",
                }
            },
            "required": ["n"],
            "additionalProperties": False,
        },
    },
}


def transcription_prompt(page_number: int, page_count: int) -> str:
    return f"""You are transcribing one page of an MHT-CET 2023 paper.
Page {page_number} of {page_count}. The page is an image. Trust the image, not any hidden text layer.

Transcribe this page only. Do not solve it, correct it, or skip lines.
Reading order is top to bottom. If the page has two columns, read the left column from top to bottom, then the right column.

{_INLINE_MATH}

Copy words as printed. Do not paraphrase. Rewrite a printed display equation as inline math unless it is one of the rare cases above.

Every diagram, graph, geometric figure, circuit, or chemical structure becomes one standalone <svg>...</svg> document in the transcript, placed where the figure sits on the page. Keep labels, angles, arrows, and relative positions. A page may contain several figures. Do not replace a figure with a prose description.

Keep headings as printed, including "Question 1", "Question 2", and so on.
Keep options labeled A, B, C, and D.
Keep the worked answer and explanation that follow a question.
Ignore watermarks, logos, and running page numbers.

Put the full transcription in the transcript field.
"""


def title_prompt() -> str:
    return """This image is page 1 of an MHT-CET 2023 paper. The test title is printed on this page.

Return that printed title only. Do not return a subject heading such as Maths, Physics, or Chemistry.
Do not invent a title that is not printed.
"""


def question_starts_criteria(question_number: int) -> tuple[str, str, str]:
    """Instructions and yes/no criteria for one Jev check."""
    instructions = f"Does Question {question_number} start on this page?"
    yes = (
        f'This page contains the start of Question {question_number}: '
        f'a heading such as "Question {question_number}" that introduces that question.'
    )
    no = (
        "This page does not start that question. A continuation of an earlier question's "
        "options, answer, or explanation is no. Other question numbers do not count."
    )
    return instructions, yes, no


def question_tool_prompt(question_number: int, start_page: int, transcript: str) -> str:
    return f"""Extract only Question {question_number} from this MHT-CET 2023 paper.
It starts on page {start_page}. The transcript of that page is below.

The question begins at the "Question {question_number}" heading. It is one single-correct MCQ.
Options are labeled A, B, C, and D. The answer and the worked explanation follow those options.
Text, options, the answer, figures, and the explanation may continue on later pages.
Anything printed before the Question {question_number} heading belongs to the previous question. Ignore it.
Stop at the next question heading. Do not include that next question.

If the question, all four options, the answer, and the explanation are already complete on this page, do not call a tool.
If any of those parts continue later, call see_next_page. n=1 is the next page after page {start_page}. You may call it at most 10 times.

{_INLINE_MATH}

Figures are <svg>...</svg> documents already in the transcript. If a transcript used $$...$$ for a one-line formula, write that formula as inline math in the question you return.

Page {start_page} transcript:
{transcript}
"""


def question_output_prompt(question_number: int) -> str:
    return f"""Output Question {question_number} now from the pages in this conversation. Do not call tools.

option1 is A, option2 is B, option3 is C, option4 is D.
correct_mcq_option is 1 for A, 2 for B, 3 for C, 4 for D. Use the printed answer. Leave it null when this question has no answer in the pages you have.
explanation is the worked solution after the options. Leave it null when there is no solution.

{_INLINE_MATH}

Apply that math rule to the question, every option, and the explanation. A solution step on its own line is still $...$, not $$...$$.
question_svg, option1_svg, option2_svg, option3_svg, option4_svg, and explanation_svg are copied from <svg>...</svg> documents already in the transcripts. One field may contain several SVG documents if that part has several figures. Leave a field null when that part has no figure. Do not draw a new SVG.
If an option is only a figure, set its text to "(diagram)" and put the SVG in that option's svg field.
Do not include any other question.
"""
