"""Per-call and running LiteLLM cost logs."""

from types import SimpleNamespace
from unittest.mock import patch

from paper_extract.llm import LiteLLMClient
from paper_extract.models import SvgDecision


def _response() -> SimpleNamespace:
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content='{"replaceable": false, "reason": "x"}'))])


def test_each_call_logs_its_cost_and_the_running_total(caplog):
    client = LiteLLMClient()
    with (
        patch("paper_extract.llm.litellm.completion", return_value=_response()),
        patch("paper_extract.llm.litellm.completion_cost", side_effect=[0.01, 0.02]),
        caplog.at_level("INFO"),
    ):
        client.complete(model="gpt-6-luna", prompt="a", schema=SvgDecision, purpose="page 1 read")
        client.complete(model="gpt-6-luna", prompt="b", schema=SvgDecision, purpose="page 2 continuation")
    assert client.spent == 0.03
    assert "litellm start page 1 read model=gpt-6-luna" in caplog.text
    assert "litellm done page 1 read model=gpt-6-luna cost=$0.010000 running=$0.010000" in caplog.text
    assert "litellm done page 2 continuation model=gpt-6-luna cost=$0.020000 running=$0.030000" in caplog.text


def test_unknown_cost_does_not_change_the_running_total(caplog):
    client = LiteLLMClient()
    with (
        patch("paper_extract.llm.litellm.completion", return_value=_response()),
        patch("paper_extract.llm.litellm.completion_cost", side_effect=RuntimeError("no price")),
        caplog.at_level("INFO"),
    ):
        client.complete(model="gpt-6-luna", prompt="a", schema=SvgDecision, purpose="page 4 read")
    assert client.spent == 0.0
    assert "litellm done page 4 read model=gpt-6-luna cost=unknown running=$0.000000" in caplog.text
