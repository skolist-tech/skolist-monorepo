"""Run one paper workflow. The graph reads a PDF and writes paper.json."""

import argparse
import logging
import os
import sys
from pathlib import Path

from common.errors import PaperExtractError
from common.llm import LiteLLMClient, load_local_env
from workflows.mht_cet_2023.graph import Extractor as Extractor2023
from workflows.mht_cet_2024.graph import Extractor as Extractor2024
from workflows.mht_cet_2025.graph import Extractor as Extractor2025

WORKFLOWS = {
    "mht_cet_2023": Extractor2023,
    "mht_cet_2024": Extractor2024,
    "mht_cet_2025": Extractor2025,
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python cli.py",
        description="Read a scanned question-paper PDF with that paper's workflow and write paper.json.",
    )
    parser.add_argument(
        "workflow",
        choices=sorted(WORKFLOWS),
        help="Workflow under workflows/. Each one is a LangGraph for one paper.",
    )
    parser.add_argument("pdf", type=Path, help="Path to the question-paper PDF.")
    parser.add_argument(
        "-o",
        "--out",
        type=Path,
        required=True,
        help="Directory for page images, crops, and paper.json.",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("PAPER_EXTRACT_MODEL") or None,
        help="LiteLLM model for page reading and SVG redraw. Defaults to PAPER_EXTRACT_MODEL in .env.",
    )
    parser.add_argument(
        "--fast-model",
        default=os.environ.get("PAPER_EXTRACT_FAST_MODEL") or None,
        help="LiteLLM model for the 2024 and 2025 checks. Defaults to PAPER_EXTRACT_FAST_MODEL in .env.",
    )
    parser.add_argument("--dpi", type=int, default=150, help="Rasterization DPI. Default: 150.")
    parser.add_argument(
        "--no-svg",
        action="store_true",
        help="Keep figure crops and skip SVG redraw.",
    )
    parser.add_argument("--verbose", action="store_true", help="Log each pipeline step.")
    return parser


def main(argv: list[str] | None = None) -> int:
    load_local_env()
    parser = build_parser()
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, format="%(message)s")
    if not args.pdf.is_file():
        parser.error(f"PDF not found: {args.pdf}")
    if args.dpi < 72:
        parser.error("--dpi must be at least 72.")
    if not args.model:
        parser.error("Set PAPER_EXTRACT_MODEL in .env, or pass --model.")
    if args.workflow != "mht_cet_2023" and not args.fast_model:
        parser.error("Set PAPER_EXTRACT_FAST_MODEL in .env, or pass --fast-model.")
    extractor = WORKFLOWS[args.workflow]
    try:
        test = extractor(LiteLLMClient()).run(
            args.pdf,
            args.out,
            model=args.model,
            fast_model=args.fast_model or "",
            dpi=args.dpi,
            svg=not args.no_svg,
        )
    except PaperExtractError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    count = sum(len(section.questions) for section in test.sections)
    print(f"Wrote {args.out / 'paper.json'} ({count} questions, {len(test.sections)} sections).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
