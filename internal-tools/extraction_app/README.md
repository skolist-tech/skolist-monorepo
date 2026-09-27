# extraction_app

Turn a scanned question-paper PDF into `paper.json`.

This is a project, not a library. It does not import the rest of the monorepo, and it is not installed as a package. Shared image and model helpers live in `common/`. Each paper has its own LangGraph under `workflows/`. That graph takes a PDF and writes `paper.json`.

## Layout

```
extraction_app/
├── common/                  # PDF to page images, crops, LiteLLM, paper JSON assembly
├── workflows/
│   ├── mht_cet_2023/        # graph for the 2023 papers in data/mht-cet-2023/
│   ├── mht_cet_2024/        # graph for data/mht-cet-2024.pdf
│   └── mht_cet_2025/        # graph for data/mht-cet-2025.pdf
├── cli.py
└── tests/
```

A new paper gets a new folder under `workflows/`. Put layout assumptions in that folder's `graph.py` and `prompts.py`. Leave `common/` for steps that are the same for every paper, such as rasterizing a PDF to PNGs.

## What it extracts

Every question is a single-correct MCQ with four options. `paper.json` is the test object.

The 2024 and 2025 graphs crop figures to PNG and redraw a clean diagram as SVG. Answer fields stay null when that paper has no key. A question cut off at the bottom of a page must continue on the next page, or the run raises `PartialQuestionError`.

The 2023 graph does not crop rasters. Figures are SVG only. Each question is followed by its answer and explanation, so those fields are filled from the paper.

## Setup

```bash
cd internal-tools/extraction_app
uv sync --group dev
cp .env.example .env
```

Put your key and model names in `.env`. The CLI loads that file before it starts. `PAPER_EXTRACT_MODEL` is the OpenAI model that transcribes pages and writes questions. `OPENROUTER_API_KEY` pays for the 2023 yes/no checks, which go to Jev (`typesafe/jev-1.13`) on OpenRouter. `PAPER_EXTRACT_FAST_MODEL` is only used by the 2024 and 2025 graphs. `--model` and `--fast-model` override the OpenAI model names for one run.

## Run

```bash
uv run python cli.py mht_cet_2025 ../../data/mht-cet-2025.pdf -o ./runs/mht-cet-2025
uv run python cli.py mht_cet_2024 ../../data/mht-cet-2024.pdf -o ./runs/mht-cet-2024
uv run python cli.py mht_cet_2023 ../../data/mht-cet-2023/2023-09-05-evening.pdf -o ./runs/mht-cet-2023-09-05-evening
```

Skip SVG redraw:

```bash
uv run python cli.py mht_cet_2025 ../../data/mht-cet-2025.pdf -o ./runs/mht-cet-2025 --no-svg
```

## 2023 pipeline

This sitting has a fixed shape: the title is on page 1, there are 150 questions, and the numbers do not reset. Questions 1–50 are Maths, 51–100 Chemistry, and 101–150 Physics. A question starts at a `Question n` heading, may run across pages, and is followed by its own A–D options, answer, and explanation.

1. Rasterize the PDF to one PNG per page.
2. Transcribe every page with `PAPER_EXTRACT_MODEL`. Math is inline KaTeX (`$...$`). Display math (`$$...$$`) is only for a formula that cannot sit on one line, such as a matrix or a multi-line alignment. Each diagram is an SVG in the transcript. Files land in `transcripts/page-NNN.txt`.
3. Read the title from the page 1 image.
4. Find where each question starts. Jev, through the OpenRouter Decisions API, sees one page transcript and returns the probability that this question number starts there. A probability of at least 0.5 counts as yes. SVG markup is left out of that call. Search for question 1 from page 1. The next question starts its search on the same page as the previous hit, because one page can contain two questions. The map is `logs/question-pages.json`.
5. For each question, send the starting page's transcript to `PAPER_EXTRACT_MODEL` with a `see_next_page` tool. `n=1` is the next page after the start. The model may open at most 10 later pages, then returns the question, options, answer, explanation, and SVG fields. No raster crops are written.
6. Assemble the three sections into `paper.json`.

A repeated model call is read from `.cache/llm/<pdf-name>-<task>.txt`. Delete that file to run the task again. At most `PAPER_EXTRACT_MAX_CONCURRENT` calls run at once (default 10).

Jev and OpenAI keep separate running totals. A Jev line looks like `jev question 3 present on page 2 noul=0.910 cost=$0.000012 running=$0.000024`. An OpenAI line looks like `litellm done page 1 transcript model=openai/gpt-5-luna cost=$0.010000 running=$0.010000`. The `running` figure on a Jev line is only Jev spend. The `running` figure on a LiteLLM line is only OpenAI spend. The two numbers are not added together. A cached Jev call is logged and does not increase the Jev total.

## 2024 and 2025 pipeline

1. Rasterize the PDF to one PNG per page (`common.rasterize`).
2. Pages are read together. At most `PAPER_EXTRACT_MAX_CONCURRENT` LiteLLM calls run at once (default 10). Each call returns questions, section headings, paper metadata, answer-key rows, and figure boxes. A repeated task is read from `.cache/llm/<pdf-name>-<task>.txt`, for example `mht-cet-2025-page-read-3.txt`. Delete that file to run the task again.
3. If a page ends mid-question, one follow-up call receives that page and the next page and must complete the question, or the run raises `PartialQuestionError`.
4. Figure boxes are cropped and attached to the question that named them.
5. Section headings stick to the following questions until the next heading.
6. Answer-key rows attach by printed question number. Rows that do not match go to the fast model once each.
7. Questions that still need a figure are shown nearby unused crops. The fast model links a crop or the run records a warning.
8. Figure crops are checked together, up to `PAPER_EXTRACT_MAX_CONCURRENT` at a time. A replaceable diagram is redrawn as SVG after its own check.

`extractions/page-NNN.json` is the raw read for that page.

## Tests

```bash
uv run pytest
```

The tests use a fake model client. They do not call OpenAI.
