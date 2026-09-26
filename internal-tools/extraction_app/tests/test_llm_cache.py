"""Local reply cache and the in-flight cap on LiteLLM."""

import asyncio
from types import SimpleNamespace

import paper_extract.llm as llm
from paper_extract.models import SvgDecision


def _reply(text: str = '{"replaceable": false, "reason": "x"}') -> SimpleNamespace:
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=text))])


def test_repeat_task_is_read_from_its_file(monkeypatch, tmp_path):
    monkeypatch.setattr(llm, "_CACHE_DIR", tmp_path)
    calls = {"n": 0}

    def fake(*args, **kwargs):
        calls["n"] += 1
        return _reply()

    monkeypatch.setattr(llm, "_raw_completion", fake)
    token = llm._cache_name.set("mht-cet-2025-page-read-3.txt")
    try:
        first = llm.completion(
            model="gpt-6-luna",
            messages=[{"role": "user", "content": "same prompt"}],
            response_format=SvgDecision,
        )
        second = llm.completion(
            model="gpt-6-luna",
            messages=[{"role": "user", "content": "a different prompt"}],
            response_format=SvgDecision,
        )
    finally:
        llm._cache_name.reset(token)
    assert calls["n"] == 1
    assert second.choices[0].message.content == first.choices[0].message.content
    assert second._paper_extract_cached is True
    assert (tmp_path / "mht-cet-2025-page-read-3.txt").is_file()


def test_unknown_model_is_sent_as_openai(monkeypatch, tmp_path):
    monkeypatch.setattr(llm, "_CACHE_DIR", tmp_path)
    seen: list[str] = []

    def fake(*args, **kwargs):
        seen.append(kwargs["model"])
        return _reply()

    monkeypatch.setattr(llm, "_raw_completion", fake)
    llm.completion(model="gpt-6-luna", messages=[{"role": "user", "content": "page"}])
    llm.completion(model="openai/gpt-4.1", messages=[{"role": "user", "content": "other"}])
    assert seen == ["openai/gpt-6-luna", "openai/gpt-4.1"]


def test_at_most_ten_calls_run_at_once(monkeypatch, tmp_path):
    monkeypatch.setenv("PAPER_EXTRACT_MAX_CONCURRENT", "10")
    monkeypatch.setattr(llm, "_CACHE_DIR", tmp_path)
    state = {"inflight": 0, "max": 0}

    async def fake(*args, **kwargs):
        state["inflight"] += 1
        state["max"] = max(state["max"], state["inflight"])
        await asyncio.sleep(0.02)
        state["inflight"] -= 1
        return _reply("{}")

    monkeypatch.setattr(llm, "_raw_acompletion", fake)

    async def go() -> None:
        await asyncio.gather(
            *[
                llm.acompletion(model="gpt-6-luna", messages=[{"role": "user", "content": str(i)}])
                for i in range(20)
            ]
        )

    asyncio.run(go())
    assert 1 < state["max"] <= 10


def test_max_concurrent_is_read_from_the_environment(monkeypatch, tmp_path):
    monkeypatch.setenv("PAPER_EXTRACT_MAX_CONCURRENT", "2")
    monkeypatch.setattr(llm, "_CACHE_DIR", tmp_path)
    state = {"inflight": 0, "max": 0}

    async def fake(*args, **kwargs):
        state["inflight"] += 1
        state["max"] = max(state["max"], state["inflight"])
        await asyncio.sleep(0.02)
        state["inflight"] -= 1
        return _reply("{}")

    monkeypatch.setattr(llm, "_raw_acompletion", fake)

    async def go() -> None:
        await asyncio.gather(
            *[
                llm.acompletion(model="gpt-6-luna", messages=[{"role": "user", "content": f"limit-{i}"}])
                for i in range(6)
            ]
        )

    asyncio.run(go())
    assert state["max"] == 2
