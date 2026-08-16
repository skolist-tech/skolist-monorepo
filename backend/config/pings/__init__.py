"""To check if database, llm models etc. connect properly."""

import asyncio
from collections.abc import Awaitable, Callable

from .db import check_supabase_connection, check_supabase_service_key
from .llm import check_gemini_api_key, check_openai_api_key, check_qgen_model

__all__ = [
    "PingsExecutor",
    "check_gemini_api_key",
    "check_openai_api_key",
    "check_qgen_model",
    "check_supabase_connection",
    "check_supabase_service_key",
]


class PingsExecutor:
    def __init__(
        self,
        functions: list[Callable[..., bool]] | None = None,
        async_functions: list[Callable[..., Awaitable[bool]]] | None = None,
    ):
        self.functions = functions or []
        self.async_functions = async_functions or []

    async def execute(self):
        await asyncio.gather(
            *(asyncio.to_thread(check) for check in self.functions),
            *(check() for check in self.async_functions),
        )
