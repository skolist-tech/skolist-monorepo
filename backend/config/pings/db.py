# pylint: disable=broad-exception-caught
"""Async database connectivity checks."""

import logging

import httpx
from supabase import acreate_client

from .utils import with_retries

logger = logging.getLogger(__name__)


@with_retries(retries=5)
async def check_supabase_connection(supabase_url, supabase_anon_key) -> bool:
    """To check if SUPABASE_URL and SUPABASE_ANON_KEY works"""
    try:
        headers = {
            "apikey": supabase_anon_key,
            "Authorization": f"Bearer {supabase_anon_key}",
        }

        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{supabase_url}/rest/v1/", headers=headers)

        # 401 = key accepted but no resource (EXPECTED)
        if r.status_code in (200, 401, 404):
            logger.info(
                "Supabase connection check passed",
                extra={
                    "status": "success",
                    "http_status_code": r.status_code,
                },
            )
            return True
        raise RuntimeError(f"Unexpected status code: {r.status_code}")

    except Exception as e:
        logger.error(
            "Supabase connection check failed",
            extra={
                "status": "failure",
                "error": str(e),
            },
        )
        raise


@with_retries(retries=5)
async def check_supabase_service_key(supabase_url, service_key) -> bool:
    """To check if SUPABASE_SERVICE_KEY works"""
    try:
        supabase = await acreate_client(supabase_url, service_key)

        # Service key must bypass RLS
        # This query should succeed even if RLS is enabled
        await supabase.table("users").select("id").limit(1).execute()
        logger.info(
            "Supabase service key check passed",
            extra={
                "status": "success",
            },
        )
        return True

    except Exception as e:
        logger.error(
            "Supabase service key check failed",
            extra={
                "status": "failure",
                "error": str(e),
            },
        )
        raise
