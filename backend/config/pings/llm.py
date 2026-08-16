# pylint: disable=broad-exception-caught
"""Async LLM connectivity checks."""

import logging

import litellm
from google import genai
from openai import AsyncOpenAI

from .utils import with_retries

logger = logging.getLogger(__name__)


@with_retries(retries=5)
async def check_gemini_api_key(gemini_key) -> bool:
    """To Check if Gemini Key works"""
    try:
        client = genai.Client(api_key=gemini_key)
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents="Are you working?",
        )
        logger.info(
            "Gemini API key check passed",
            extra={
                "status": "success",
                "response_preview": response.text[:10] if response.text else None,
            },
        )
        return True

    except Exception as e:
        logger.error(
            "Gemini API key check failed",
            extra={
                "status": "failure",
                "error": str(e),
            },
        )
        raise


@with_retries(retries=5)
async def check_openai_api_key(openai_key) -> bool:
    """To Check if OPENAI API KEY works"""
    try:
        client = AsyncOpenAI(api_key=openai_key)
        resp = await client.responses.create(model="gpt-4.1-mini", input="Say OK")
        logger.info(
            "OpenAI API key check passed",
            extra={
                "status": "success",
                "response_preview": resp.output_text[:10] if resp.output_text else None,
            },
        )
        return True

    except Exception as e:
        logger.error(
            "OpenAI API key check failed",
            extra={
                "status": "failure",
                "error": str(e),
            },
        )
        raise


@with_retries(retries=5)
async def check_qgen_model(qgen_model: str) -> bool:
    """To check if QGEN_MODEL works"""
    try:
        response = await litellm.acompletion(
            model=qgen_model,
            messages=[{"role": "user", "content": "Hello, how are you?"}],
        )
        preview = response.choices[0].message.content if response.choices else None
        logger.info(
            "QGEN model check passed",
            extra={
                "status": "success",
                "model": qgen_model,
                "response_preview": preview[:10] if preview else None,
            },
        )
        return True

    except Exception as e:
        logger.error(
            "QGEN model check failed",
            extra={
                "status": "failure",
                "model": qgen_model,
                "error": str(e),
            },
        )
        raise
