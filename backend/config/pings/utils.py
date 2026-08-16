# pylint: disable=broad-exception-caught
"""Retry helper for async ping checks."""

import asyncio
import functools
import logging

logger = logging.getLogger(__name__)


def with_retries(retries: int = 5, initial_delay: float = 1.0):
    """Decorator to retry an async function with exponential backoff."""

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            delay = initial_delay
            last_exc = None
            for attempt in range(retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    if attempt < retries - 1:
                        logger.warning(
                            "Retry attempt failed",
                            extra={
                                "function_name": func.__name__,
                                "attempt": attempt + 1,
                                "max_retries": retries,
                                "error": str(e),
                                "retry_delay_seconds": delay,
                            },
                        )
                        await asyncio.sleep(delay)
                        delay = min(delay * 2, 16.0)
            logger.error(
                "Function failed after all retries",
                extra={
                    "function_name": func.__name__,
                    "max_retries": retries,
                    "final_error": str(last_exc),
                },
            )
            return False

        return wrapper

    return decorator
