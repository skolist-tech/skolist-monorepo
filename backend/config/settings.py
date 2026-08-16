"""
Loads configuration from environment variables.
"""

import logging
import os
from functools import partial

from dotenv import load_dotenv

from .pings import (
    PingsExecutor,
    check_gemini_api_key,
    check_openai_api_key,
    check_qgen_model,
    check_supabase_connection,
    check_supabase_service_key,
)

logger = logging.getLogger(__name__)


load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# LiteLLM model string for qgen — e.g. "gemini/gemini-2.5-flash", "gpt-4o", "claude-sonnet-4-6"
QGEN_MODEL = os.getenv("QGEN_MODEL")
SMS_HOOK_SECRET = os.getenv("SMS_HOOK_SECRET")
# MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY")
# MSG91_TEMPLATE_ID = os.getenv("MSG91_TEMPLATE_ID")
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS")
DEPLOYMENT_ENV = os.getenv("DEPLOYMENT_ENV")
LOGGING_LEVEL = os.getenv("LOGGING_LEVEL", "INFO").upper()
PING = os.getenv("PING", "FALSE").upper()
LOG_IMAGES = os.getenv("LOG_IMAGES", "false").lower() == "true"

logger.info(
    "Configuration loaded",
    extra={
        "deployment_env": DEPLOYMENT_ENV,
        "logging_level": LOGGING_LEVEL,
    },
)

if not SUPABASE_URL:
    logger.warning(
        "Environment variable not set",
        extra={"variable_name": "SUPABASE_URL"},
    )
if not SUPABASE_SERVICE_KEY:
    logger.warning(
        "Environment variable not set",
        extra={"variable_name": "SUPABASE_SERVICE_KEY"},
    )
if not QGEN_MODEL:
    logger.warning(
        "Environment variable not set",
        extra={"variable_name": "QGEN_MODEL"},
    )
    logger.warning(
        "Defaulting to gemini/gemini-2.5-flash",
        extra={"variable_name": "QGEN_MODEL", "default_value": "gemini/gemini-2.5-flash"},
    )
    QGEN_MODEL = "gemini/gemini-2.5-flash"
if not GEMINI_API_KEY:
    logger.warning(
        "Environment variable not set",
        extra={"variable_name": "GEMINI_API_KEY"},
    )
if not OPENAI_API_KEY:
    logger.warning(
        "Environment variable not set",
        extra={"variable_name": "OPENAI_API_KEY"},
    )

if not SMS_HOOK_SECRET:
    logger.warning(
        "Environment variable not set",
        extra={"variable_name": "SMS_HOOK_SECRET"},
    )

if not FIREBASE_CREDENTIALS:
    logger.warning(
        "Environment variable not set",
        extra={"variable_name": "FIREBASE_CREDENTIALS"},
    )

if not DEPLOYMENT_ENV or DEPLOYMENT_ENV not in {"PRODUCTION", "STAGE", "LOCAL"}:
    logger.warning(
        "Invalid or missing DEPLOYMENT_ENV, defaulting to LOCAL",
        extra={
            "variable_name": "DEPLOYMENT_ENV",
            "current_value": DEPLOYMENT_ENV,
            "default_value": "LOCAL",
        },
    )
    DEPLOYMENT_ENV = "LOCAL"


def _build_pings() -> PingsExecutor:
    async_functions = []
    if GEMINI_API_KEY:
        async_functions.append(partial(check_gemini_api_key, GEMINI_API_KEY))
    if OPENAI_API_KEY:
        async_functions.append(partial(check_openai_api_key, OPENAI_API_KEY))
    if QGEN_MODEL:
        async_functions.append(partial(check_qgen_model, QGEN_MODEL))
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        async_functions.append(partial(check_supabase_connection, SUPABASE_URL, SUPABASE_SERVICE_KEY))
        async_functions.append(partial(check_supabase_service_key, SUPABASE_URL, SUPABASE_SERVICE_KEY))
    return PingsExecutor(async_functions=async_functions)


async def run_pings() -> None:
    if PING != "TRUE":
        logger.info("Ping Skipped")
        return
    await _build_pings().execute()
