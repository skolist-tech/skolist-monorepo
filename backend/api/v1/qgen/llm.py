"""
Central LLM utilities for qgen.

Switch providers by setting QGEN_MODEL in the environment:
  gemini/gemini-2.5-flash   (default)
  gpt-4o
  claude-sonnet-4-6
  ... any LiteLLM-supported model string

Required API key env vars:
  GEMINI_API_KEY   for gemini/* models
  OPENAI_API_KEY   for gpt-* models
  ANTHROPIC_API_KEY for claude-* models
"""

import base64
import os

import instructor
import litellm


def get_model() -> str:
    return os.getenv("QGEN_MODEL", "gemini/gemini-2.5-flash")


def get_async_client() -> instructor.AsyncInstructor:
    return instructor.from_litellm(litellm.acompletion)


def to_image_block(data: bytes, mime_type: str) -> dict:
    b64 = base64.b64encode(data).decode()
    return {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}}


def to_file_block(data: bytes, mime_type: str, filename: str) -> dict:
    """OpenAI chat completions reject PDFs as image_url; send them as file parts.

    LiteLLM maps this block to Gemini inline file data as well.
    """
    b64 = base64.b64encode(data).decode()
    return {
        "type": "file",
        "file": {
            "filename": filename,
            "file_data": f"data:{mime_type};base64,{b64}",
        },
    }


def to_media_block(data: bytes, mime_type: str, filename: str | None = None) -> dict:
    is_pdf = mime_type == "application/pdf" or (filename is not None and filename.lower().endswith(".pdf"))
    if is_pdf:
        return to_file_block(data, "application/pdf", filename or "document.pdf")
    return to_image_block(data, mime_type)


def to_text_block(text: str) -> dict:
    return {"type": "text", "text": text}
