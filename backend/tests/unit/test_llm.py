import base64

from api.v1.qgen.llm import to_image_block, to_media_block


def test_to_media_block_sends_pdf_as_file_part():
    data = b"%PDF-1.4 fake"
    block = to_media_block(data, "application/pdf", "paper.pdf")

    assert block["type"] == "file"
    assert block["file"]["filename"] == "paper.pdf"
    assert block["file"]["file_data"] == "data:application/pdf;base64," + base64.b64encode(data).decode()


def test_to_media_block_uses_filename_when_mime_is_wrong():
    data = b"%PDF-1.4 fake"
    block = to_media_block(data, "application/octet-stream", "scan.PDF")

    assert block["type"] == "file"
    assert block["file"]["filename"] == "scan.PDF"


def test_to_media_block_keeps_images_as_image_url():
    data = b"\x89PNG"
    block = to_media_block(data, "image/png", "q1.png")

    assert block == to_image_block(data, "image/png")
    assert block["type"] == "image_url"
