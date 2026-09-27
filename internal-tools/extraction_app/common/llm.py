"""LiteLLM access. Tests pass a fake client with the same method.

litellm.completion and litellm.acompletion are wrapped once here. Callers keep
using them as usual. The wrapper limits in-flight requests and stores each
reply under extraction_app/.cache/llm/<pdf-name>-<task>.txt.
"""

import asyncio
import base64
import json
import logging
import os
import threading
from contextvars import ContextVar
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Protocol

import litellm
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

logging.getLogger("LiteLLM").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

_APP_ROOT = Path(__file__).resolve().parents[1]
_CACHE_DIR = _APP_ROOT / ".cache" / "llm"
_DEFAULT_MAX_IN_FLIGHT = 10
_async_sem: asyncio.Semaphore | None = None
_sync_sem: threading.Semaphore | None = None
_sem_limit: int | None = None
_raw_completion = litellm.completion
_raw_acompletion = litellm.acompletion
_cache_name: ContextVar[str | None] = ContextVar("paper_extract_cache_name", default=None)


def load_local_env() -> None:
    """Load extraction_app/.env, then a .env in the current working directory."""
    load_dotenv(_APP_ROOT / ".env")
    load_dotenv()


def max_in_flight() -> int:
    """PAPER_EXTRACT_MAX_CONCURRENT, default 10. Values below 1 fall back to the default."""
    load_local_env()
    raw = os.environ.get("PAPER_EXTRACT_MAX_CONCURRENT", str(_DEFAULT_MAX_IN_FLIGHT))
    try:
        value = int(raw)
    except ValueError:
        return _DEFAULT_MAX_IN_FLIGHT
    if value < 1:
        return _DEFAULT_MAX_IN_FLIGHT
    return value


def _semaphores() -> tuple[asyncio.Semaphore, threading.Semaphore]:
    global _async_sem, _sync_sem, _sem_limit
    limit = max_in_flight()
    if _async_sem is None or _sync_sem is None or _sem_limit != limit:
        _sem_limit = limit
        _async_sem = asyncio.Semaphore(limit)
        _sync_sem = threading.Semaphore(limit)
    return _async_sem, _sync_sem


class ModelClient(Protocol):
    def complete(
        self,
        *,
        model: str,
        prompt: str,
        schema: type[BaseModel],
        image_paths: list[Path] | None = None,
        purpose: str = "call",
        cache_key: str | None = None,
    ) -> BaseModel: ...


class ToolCall(BaseModel):
    """One tool call from a model turn."""

    id: str
    name: str
    arguments: dict = Field(default_factory=dict)


class ModelTurn(BaseModel):
    """Assistant turn that may request tools instead of a final schema."""

    content: str | None = None
    tool_calls: list[ToolCall] = Field(default_factory=list)


class LiteLLMClient:
    """Vision-capable chat completion with a Pydantic response schema.

    One instance tracks the running spend of a single extraction request.
    """

    def __init__(self) -> None:
        self.spent = 0.0
        self._spent_lock = threading.Lock()

    def complete(
        self,
        *,
        model: str,
        prompt: str,
        schema: type[BaseModel],
        image_paths: list[Path] | None = None,
        purpose: str = "call",
        cache_key: str | None = None,
    ) -> BaseModel:
        load_local_env()
        logger.info("litellm start %s model=%s", purpose, model)
        content = _message_content(prompt, image_paths)
        token = _cache_name.set(cache_key)
        try:
            response = litellm.completion(
                model=model,
                messages=[{"role": "user", "content": content}],
                response_format=schema,
            )
        finally:
            _cache_name.reset(token)
        raw = response.choices[0].message.content or ""
        self._log_cost(purpose, model, response)
        return _parse_schema(schema, raw, purpose)

    async def acomplete(
        self,
        *,
        model: str,
        prompt: str,
        schema: type[BaseModel],
        image_paths: list[Path] | None = None,
        purpose: str = "call",
        cache_key: str | None = None,
    ) -> BaseModel:
        load_local_env()
        logger.info("litellm start %s model=%s", purpose, model)
        content = _message_content(prompt, image_paths)
        token = _cache_name.set(cache_key)
        try:
            response = await litellm.acompletion(
                model=model,
                messages=[{"role": "user", "content": content}],
                response_format=schema,
            )
        finally:
            _cache_name.reset(token)
        raw = response.choices[0].message.content or ""
        self._log_cost(purpose, model, response)
        return _parse_schema(schema, raw, purpose)

    def complete_messages(
        self,
        *,
        model: str,
        messages: list[dict],
        schema: type[BaseModel],
        purpose: str = "call",
        cache_key: str | None = None,
    ) -> BaseModel:
        load_local_env()
        logger.info("litellm start %s model=%s", purpose, model)
        token = _cache_name.set(cache_key)
        try:
            response = litellm.completion(
                model=model,
                messages=messages,
                response_format=schema,
            )
        finally:
            _cache_name.reset(token)
        raw = response.choices[0].message.content or ""
        self._log_cost(purpose, model, response)
        return _parse_schema(schema, raw, purpose)

    async def acomplete_messages(
        self,
        *,
        model: str,
        messages: list[dict],
        schema: type[BaseModel],
        purpose: str = "call",
        cache_key: str | None = None,
    ) -> BaseModel:
        load_local_env()
        logger.info("litellm start %s model=%s", purpose, model)
        token = _cache_name.set(cache_key)
        try:
            response = await litellm.acompletion(
                model=model,
                messages=messages,
                response_format=schema,
            )
        finally:
            _cache_name.reset(token)
        raw = response.choices[0].message.content or ""
        self._log_cost(purpose, model, response)
        return _parse_schema(schema, raw, purpose)

    def complete_turn(
        self,
        *,
        model: str,
        messages: list[dict],
        tools: list[dict],
        purpose: str = "call",
        cache_key: str | None = None,
    ) -> ModelTurn:
        load_local_env()
        logger.info("litellm start %s model=%s", purpose, model)
        cached = _load_turn(cache_key)
        if cached is not None:
            self._log_cached(purpose, model)
            return cached
        with _semaphores()[1]:
            cached = _load_turn(cache_key)
            if cached is not None:
                self._log_cached(purpose, model)
                return cached
            response = _raw_completion(
                **_with_provider(
                    {
                        "model": model,
                        "messages": messages,
                        "tools": tools,
                        "tool_choice": "auto",
                    }
                )
            )
        turn = _parse_turn(response)
        _store_turn(cache_key, turn)
        self._log_cost(purpose, model, response)
        return turn

    async def acomplete_turn(
        self,
        *,
        model: str,
        messages: list[dict],
        tools: list[dict],
        purpose: str = "call",
        cache_key: str | None = None,
    ) -> ModelTurn:
        load_local_env()
        logger.info("litellm start %s model=%s", purpose, model)
        cached = _load_turn(cache_key)
        if cached is not None:
            self._log_cached(purpose, model)
            return cached
        async with _semaphores()[0]:
            cached = _load_turn(cache_key)
            if cached is not None:
                self._log_cached(purpose, model)
                return cached
            response = await _raw_acompletion(
                **_with_provider(
                    {
                        "model": model,
                        "messages": messages,
                        "tools": tools,
                        "tool_choice": "auto",
                    }
                )
            )
        turn = _parse_turn(response)
        _store_turn(cache_key, turn)
        self._log_cost(purpose, model, response)
        return turn

    def _log_cached(self, purpose: str, model: str) -> None:
        logger.info(
            "litellm done %s model=%s cached cost=$0.000000 running=$%.6f",
            purpose,
            model,
            self.spent,
        )

    def _log_cost(self, purpose: str, model: str, response: object) -> None:
        try:
            cost = float(litellm.completion_cost(completion_response=response))
        except Exception:
            if getattr(response, "_paper_extract_cached", False):
                logger.info("litellm done %s model=%s cached cost=$0.000000 running=$%.6f", purpose, model, self.spent)
                return
            logger.info("litellm done %s model=%s cost=unknown running=$%.6f", purpose, model, self.spent)
            return
        with self._spent_lock:
            self.spent += cost
            running = self.spent
        logger.info(
            "litellm done %s model=%s cost=$%.6f running=$%.6f",
            purpose,
            model,
            cost,
            running,
        )


def _message_content(prompt: str, image_paths: list[Path] | None) -> list[dict]:
    content: list[dict] = [{"type": "text", "text": prompt}]
    for path in image_paths or []:
        encoded = base64.standard_b64encode(path.read_bytes()).decode("ascii")
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{encoded}"},
            }
        )
    return content


def _cache_file(name: str | None) -> Path | None:
    if not name:
        return None
    return _CACHE_DIR / name


def _cached_response(content: str) -> Any:
    message = SimpleNamespace(content=content)
    response = SimpleNamespace(choices=[SimpleNamespace(message=message)])
    response._paper_extract_cached = True
    return response


def _store_reply(name: str | None, response: Any) -> None:
    path = _cache_file(name)
    if path is None or getattr(response, "_paper_extract_cached", False):
        return
    content = response.choices[0].message.content or ""
    if not content:
        return
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def _load_reply(name: str | None) -> Any | None:
    path = _cache_file(name)
    if path is None or not path.is_file():
        return None
    return _cached_response(path.read_text())


def _load_turn(name: str | None) -> ModelTurn | None:
    path = _cache_file(name)
    if path is None or not path.is_file():
        return None
    return ModelTurn.model_validate_json(path.read_text())


def _store_turn(name: str | None, turn: ModelTurn) -> None:
    path = _cache_file(name)
    if path is None:
        return
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(turn.model_dump_json())


def _parse_turn(response: Any) -> ModelTurn:
    message = response.choices[0].message
    calls: list[ToolCall] = []
    for index, call in enumerate(getattr(message, "tool_calls", None) or []):
        function = call.function if hasattr(call, "function") else call["function"]
        name = function.name if hasattr(function, "name") else function["name"]
        raw_args = function.arguments if hasattr(function, "arguments") else function["arguments"]
        call_id = call.id if hasattr(call, "id") else call.get("id")
        if isinstance(raw_args, str):
            try:
                arguments = json.loads(raw_args) if raw_args else {}
            except json.JSONDecodeError:
                arguments = {}
        elif isinstance(raw_args, dict):
            arguments = raw_args
        else:
            arguments = {}
        if not isinstance(arguments, dict):
            arguments = {}
        calls.append(ToolCall(id=call_id or f"call-{index}", name=name, arguments=arguments))
    content = message.content or None
    return ModelTurn(content=content, tool_calls=calls)


def _parse_schema(schema: type[BaseModel], raw: str, purpose: str) -> BaseModel:
    try:
        return schema.model_validate_json(raw)
    except ValidationError as exc:
        raise ValueError(f"{purpose}: model JSON does not match {schema.__name__}: {exc}") from exc


def _with_provider(kwargs: dict) -> dict:
    """LiteLLM only infers OpenAI for model names it already knows. Prefix the rest."""
    model = kwargs.get("model")
    if not isinstance(model, str) or "/" in model:
        return kwargs
    return {**kwargs, "model": f"openai/{model}"}


def completion(*args, **kwargs):
    key = _cache_name.get()
    cached = _load_reply(key)
    if cached is not None:
        return cached
    with _semaphores()[1]:
        cached = _load_reply(key)
        if cached is not None:
            return cached
        response = _raw_completion(*args, **_with_provider(kwargs))
        _store_reply(key, response)
        return response


async def acompletion(*args, **kwargs):
    key = _cache_name.get()
    cached = _load_reply(key)
    if cached is not None:
        return cached
    async with _semaphores()[0]:
        cached = _load_reply(key)
        if cached is not None:
            return cached
        response = await _raw_acompletion(*args, **_with_provider(kwargs))
        _store_reply(key, response)
        return response


litellm.completion = completion
litellm.acompletion = acompletion
