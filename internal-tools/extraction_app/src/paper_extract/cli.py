"""Command line for paper extraction."""

import argparse
import logging
import os
import sys
from pathlib import Path

from paper_extract.errors import PaperExtractError
from paper_extract.llm import LiteLLMClient, load_local_env
from paper_extract.pipeline.graph import Extractor


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="paper-extract",
        description="Read a scanned MHT-CET PDF and write a test JSON object.",
    )
    sub = parser.add_subparsers(dest="command", required=True)
    extract = sub.add_parser("extract", help="Extract one PDF into an output directory.")
    extract.add_argument("pdf", type=Path, help="Path to the question-paper PDF.")
    extract.add_argument(
        "-o",
        "--out",
        type=Path,
        required=True,
        help="Directory for page images, crops, and paper.json.",
    )
    extract.add_argument(
        "--model",
        default=os.environ.get("PAPER_EXTRACT_MODEL") or None,
        help="LiteLLM model for page reading and SVG redraw. Defaults to PAPER_EXTRACT_MODEL in .env.",
    )
    extract.add_argument(
        "--fast-model",
        default=os.environ.get("PAPER_EXTRACT_FAST_MODEL") or None,
        help="LiteLLM model for yes/no checks. Defaults to PAPER_EXTRACT_FAST_MODEL in .env.",
    )
    extract.add_argument("--dpi", type=int, default=150, help="Rasterization DPI. Default: 150.")
    extract.add_argument(
        "--no-svg",
        action="store_true",
        help="Keep figure crops and skip SVG redraw.",
    )
    extract.add_argument("--verbose", action="store_true", help="Log each pipeline step.")
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
    if not args.model or not args.fast_model:
        parser.error("Set PAPER_EXTRACT_MODEL and PAPER_EXTRACT_FAST_MODEL in .env, or pass --model and --fast-model.")
    try:
        test = Extractor(LiteLLMClient()).run(
            args.pdf,
            args.out,
            model=args.model,
            fast_model=args.fast_model,
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
