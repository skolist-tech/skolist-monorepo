"""Crop figure boxes out of a rendered page."""

from pathlib import Path

from PIL import Image

from paper_extract.models import Block


def pixel_box(block: Block, width: int, height: int) -> tuple[int, int, int, int]:
    left = max(0, min(width - 1, round(block.x * width)))
    top = max(0, min(height - 1, round(block.y * height)))
    right = max(left + 1, min(width, round((block.x + block.w) * width)))
    bottom = max(top + 1, min(height, round((block.y + block.h) * height)))
    return left, top, right, bottom


def crop_blocks(
    page_image: Path,
    blocks: list[Block],
    crops_dir: Path,
    *,
    page_number: int,
    width: int,
    height: int,
) -> list[Block]:
    crops_dir.mkdir(parents=True, exist_ok=True)
    image = Image.open(page_image)
    cropped: list[Block] = []
    for index, block in enumerate(blocks, start=1):
        block_id = block.id or f"b{index}"
        box = pixel_box(block, width, height)
        crop = image.crop(box)
        filename = f"page-{page_number:03d}-{block_id}.png"
        destination = crops_dir / filename
        crop.save(destination)
        cropped.append(
            block.model_copy(
                update={
                    "id": block_id,
                    "page_number": page_number,
                    "crop_path": str(destination.resolve()),
                }
            )
        )
    return cropped
