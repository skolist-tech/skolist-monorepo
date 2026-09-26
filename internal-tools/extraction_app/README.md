# paper-extract

Turn a scanned MHT-CET question paper PDF into a test JSON object.

The package does not import the rest of the monorepo. It reads a PDF path you pass in and writes a directory of page images, figure crops, and `paper.json`.

## What it extracts

Every question is a single-correct MCQ with four options. A question may carry a stem figure and a figure for each option, as a cropped PNG and, when the figure is a clean diagram, an SVG. Answer fields stay null when the paper has no key. A question that is cut off at the bottom of a page must continue on the next page; otherwise the run stops with `PartialQuestionError`.

## Setup

```bash
cd internal-tools/extraction_app
uv sync --group dev
cp .env.example .env
```

Put your key and model names in `.env`. The CLI loads that file before it starts. `PAPER_EXTRACT_MODEL` reads each page and redraws SVGs. `PAPER_EXTRACT_FAST_MODEL` does the cheap checks. `--model` and `--fast-model` override those values for one run.

## Run

```bash
uv run paper-extract extract ../../data/mht-cet-2025.pdf -o ./runs/mht-cet-2025
```

Skip SVG redraw:

```bash
uv run paper-extract extract ../../data/mht-cet-2025.pdf -o ./runs/mht-cet-2025 --no-svg
```

## Pipeline

1. Rasterize the PDF to one PNG per page.
2. Pages are read together. At most `PAPER_EXTRACT_MAX_CONCURRENT` LiteLLM calls run at once (default 10). Each call returns questions, section headings, paper metadata, answer-key rows, and figure boxes. A repeated task is read from `.cache/llm/<pdf-name>-<task>.txt`, for example `mht-cet-2025-page-read-3.txt`. Delete that file to run the task again.
3. If a page ends mid-question, one follow-up call receives that page and the next page and must complete the question, or the run raises `PartialQuestionError`.
4. Figure boxes are cropped and attached to the question that named them.
5. Section headings stick to the following questions until the next heading.
6. Answer-key rows attach by printed question number. Rows that do not match go to the fast model once each.
7. Questions that still need a figure are shown nearby unused crops. The fast model links a crop or the run records a warning.
8. Figure crops are checked together, up to `PAPER_EXTRACT_MAX_CONCURRENT` at a time. A replaceable diagram is redrawn as SVG after its own check.

`paper.json` is the test object. `extractions/page-NNN.json` is the raw read for that page.

## Tests

```bash
uv run pytest
```

The tests use a fake model client. They do not call OpenAI.
