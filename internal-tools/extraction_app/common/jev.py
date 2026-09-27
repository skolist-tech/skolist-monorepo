"""Yes/no checks through Jev on OpenRouter.

Jev is TypeSafe's System One model. It does not write text. A call sends a
page transcript and one yes/no question to the Decisions API and gets back
the probability that the answer is yes.
"""

import json
import logging
import os
import threading
import urllib.error
import urllib.request
from pathlib import Path

from common.errors import PaperExtractError
from common.llm import load_local_env

logger = logging.getLogger(__name__)

JEV_MODEL = "typesafe/jev-1.13"
DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions"

_APP_ROOT = Path(__file__).resolve().parents[1]
_CACHE_DIR = _APP_ROOT / ".cache" / "llm"
# Jev spend only. This is not added to LiteLLMClient.spent.
_spent = 0.0
_spent_lock = threading.Lock()


def noul(
    state: str,
    *,
    instructions: str,
    yes: str,
    no: str,
    purpose: str = "jev",
    cache_key: str | None = None,
) -> float:
    """Probability from 0 to 1 that the yes/no condition holds."""
    cached = _load(cache_key)
    if cached is not None:
        logger.info("jev %s cached noul=%.3f running=$%.6f", purpose, cached, _spent)
        return cached
    payload = _post(
        {
            "model": JEV_MODEL,
            "state": state,
            "questions": {
                "starts": {
                    "type": "noul",
                    "instructions": instructions,
                    "criteria": {"true": yes, "false": no},
                }
            },
        }
    )
    try:
        probability = float(payload["answers"]["starts"]["noul"])
    except (KeyError, TypeError, ValueError) as exc:
        raise PaperExtractError(f"Jev response for {purpose} did not include a yes/no probability.") from exc
    cost = _cost(payload)
    running = _add_cost(cost)
    _store(cache_key, probability)
    logger.info("jev %s noul=%.3f cost=$%.6f running=$%.6f", purpose, probability, cost, running)
    return probability


def _post(body: dict) -> dict:
    load_local_env()
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise PaperExtractError(
            "Set OPENROUTER_API_KEY in .env. Yes/no checks use the Jev model on OpenRouter."
        )
    request = urllib.request.Request(
        DECISIONS_URL,
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:500]
        raise PaperExtractError(f"Jev request failed ({exc.code}): {detail}") from exc
    except urllib.error.URLError as exc:
        raise PaperExtractError(f"Jev request failed: {exc.reason}") from exc


def _add_cost(cost: float) -> float:
    global _spent
    with _spent_lock:
        _spent += cost
        return _spent


def _cost(payload: dict) -> float:
    usage = payload.get("usage") or {}
    try:
        return float(usage.get("cost") or 0.0)
    except (TypeError, ValueError):
        return 0.0


def _cache_path(name: str | None) -> Path | None:
    if not name:
        return None
    return _CACHE_DIR / name


def _load(name: str | None) -> float | None:
    path = _cache_path(name)
    if path is None or not path.is_file():
        return None
    try:
        return float(json.loads(path.read_text())["noul"])
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError):
        return None


def _store(name: str | None, probability: float) -> None:
    path = _cache_path(name)
    if path is None:
        return
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"noul": probability}))
