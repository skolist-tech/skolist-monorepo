"""Render each PDF page to one PNG."""

from pathlib import Path

import fitz


def rasterize(pdf_path: Path, pages_dir: Path, dpi: int) -> list[dict]:
    pages_dir.mkdir(parents=True, exist_ok=True)
    document = fitz.open(pdf_path)
    pages: list[dict] = []
    try:
        for index, page in enumerate(document, start=1):
            pixmap = page.get_pixmap(dpi=dpi, alpha=False)
            path = pages_dir / f"page-{index:03d}.png"
            pixmap.save(path)
            pages.append(
                {
                    "page_number": index,
                    "path": str(path),
                    "width": pixmap.width,
                    "height": pixmap.height,
                }
            )
    finally:
        document.close()
    return pages
