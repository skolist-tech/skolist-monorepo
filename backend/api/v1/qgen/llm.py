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


def to_text_block(text: str) -> dict:
    return {"type": "text", "text": text}
