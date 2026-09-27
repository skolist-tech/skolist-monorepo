"""Jev yes/no calls go to the OpenRouter Decisions API, not to a chat model."""

import json

import pytest

import common.jev as jev
from common.errors import PaperExtractError


class _Response:
    def __init__(self, payload: dict) -> None:
        self._payload = json.dumps(payload).encode()

    def read(self) -> bytes:
        return self._payload

    def __enter__(self):
        return self

    def __exit__(self, *args) -> bool:
        return False


def test_noul_posts_jev_on_openrouter(monkeypatch, tmp_path):
    monkeypatch.setattr(jev, "load_local_env", lambda: None)
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setattr(jev, "_CACHE_DIR", tmp_path)
    monkeypatch.setattr(jev, "_spent", 0.0)
    calls: list[dict] = []

    def fake_urlopen(request, timeout):
        calls.append(
            {
                "url": request.full_url,
                "auth": request.get_header("Authorization"),
                "body": json.loads(request.data.decode()),
                "timeout": timeout,
            }
        )
        return _Response(
            {
                "answers": {"starts": {"type": "noul", "noul": 0.91}},
                "usage": {"cost": 0.000012},
            }
        )

    monkeypatch.setattr(jev.urllib.request, "urlopen", fake_urlopen)
    first = jev.noul(
        "Question 3 starts here",
        instructions="Does Question 3 start on this page?",
        yes="The heading is on this page.",
        no="It does not start here.",
        purpose="question 3 present on page 2",
        cache_key="present-3-page-2.txt",
    )
    second = jev.noul(
        "ignored on cache hit",
        instructions="Does Question 3 start on this page?",
        yes="The heading is on this page.",
        no="It does not start here.",
        purpose="question 3 present on page 2",
        cache_key="present-3-page-2.txt",
    )
    assert first == 0.91
    assert second == 0.91
    assert len(calls) == 1
    assert calls[0]["url"] == "https://openrouter.ai/api/alpha/decisions"
    assert calls[0]["auth"] == "Bearer test-key"
    assert calls[0]["body"]["model"] == "typesafe/jev-1.13"
    assert calls[0]["body"]["state"] == "Question 3 starts here"
    assert calls[0]["body"]["questions"]["starts"]["type"] == "noul"
    assert json.loads((tmp_path / "present-3-page-2.txt").read_text()) == {"noul": 0.91}


def test_noul_requires_an_openrouter_key(monkeypatch):
    monkeypatch.setattr(jev, "load_local_env", lambda: None)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(PaperExtractError, match="OPENROUTER_API_KEY"):
        jev.noul("page", instructions="?", yes="yes", no="no")
