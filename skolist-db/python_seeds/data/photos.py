"""SVG seed assets for user avatars and a few assessment question figures.

Uploaded to the public `seed_assets` bucket by the numbered seed scripts.
Object paths are stable so re-runs upsert the same files.
"""

from __future__ import annotations

from collections.abc import Callable

from .data_assessment.uuids_and_meta import (
    Q_ADV_CLOSED_PASSAGE,
    Q_ADV_DRAFT_PASSAGE,
    Q_MAIN_1_PHY_MCQ,
    Q_MAIN_2_PHY_MCQ,
    Q_NEET_LIVE_BIO,
    Q_NEET_OPEN_BIO,
)

SEED_ASSETS_BUCKET = "seed_assets"

# Distinct colours so seeded candidates are easy to tell apart in the NTA photo slot.
USER_AVATAR_COLORS = {
    "test@example.com": "#4f46e5",
    "teacher1@seed.skolist.com": "#0f766e",
    "teacher2@seed.skolist.com": "#1d4ed8",
    "student1@seed.skolist.com": "#b45309",
    "student2@seed.skolist.com": "#be123c",
    "student3@seed.skolist.com": "#15803d",
}


def avatar_object_path(email: str) -> str:
    slug = email.split("@", 1)[0].replace(".", "-")
    return f"avatars/{slug}.svg"


def _xml_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


# Portrait variants so seeded avatars look like photos, not name-initial chips.
_AVATAR_VARIANTS = {
    "test@example.com": {
        "skin": "#f3c6a8",
        "hair": "#1e293b",
        "hair_path": "M70 118 C70 62, 186 62, 186 118 L176 100 C160 70, 96 70, 80 100 Z",
        "glasses": False,
    },
    "teacher1@seed.skolist.com": {
        "skin": "#e8b896",
        "hair": "#78350f",
        "hair_path": "M78 108 C78 58, 178 58, 178 108 L170 92 C150 64, 106 64, 86 92 Z",
        "glasses": True,
    },
    "teacher2@seed.skolist.com": {
        "skin": "#d4a574",
        "hair": "#292524",
        "hair_path": "M74 112 C80 56, 176 56, 182 112 L168 88 C148 66, 108 66, 88 88 Z",
        "glasses": True,
    },
    "student1@seed.skolist.com": {
        "skin": "#f5d0c5",
        "hair": "#431407",
        "hair_path": (
            "M68 120 C72 58, 184 58, 188 120 L178 96 C168 64, 88 64, 78 96 Z "
            "M188 118 C210 150, 198 190, 176 168"
        ),
        "glasses": False,
    },
    "student2@seed.skolist.com": {
        "skin": "#c68642",
        "hair": "#0f172a",
        "hair_path": (
            "M76 110 C80 54, 176 54, 180 110 L168 86 C148 62, 108 62, 88 86 Z "
            "M180 108 C228 130, 220 200, 168 176"
        ),
        "glasses": False,
    },
    "student3@seed.skolist.com": {
        "skin": "#8d5524",
        "hair": "#1c1917",
        "hair_path": (
            "M70 118 C64 70, 192 70, 186 118 "
            "C200 100, 198 78, 176 72 C156 52, 100 52, 80 72 C58 78, 56 100, 70 118 Z"
        ),
        "glasses": False,
    },
}

_DEFAULT_VARIANT = {
    "skin": "#e8b896",
    "hair": "#1e293b",
    "hair_path": "M70 118 C70 62, 186 62, 186 118 L176 100 C160 70, 96 70, 80 100 Z",
    "glasses": False,
}


def avatar_svg(name: str, color: str, *, email: str = "") -> bytes:
    """Simple portrait SVG (person + camera badge), not name initials."""
    variant = _AVATAR_VARIANTS.get(email, _DEFAULT_VARIANT)
    fill = _xml_escape(color)
    skin = variant["skin"]
    hair = variant["hair"]
    hair_path = variant["hair_path"]
    title = _xml_escape(name)
    glasses = ""
    if variant["glasses"]:
        glasses = """
  <circle cx="108" cy="122" r="16" fill="none" stroke="#1e293b" stroke-width="4"/>
  <circle cx="148" cy="122" r="16" fill="none" stroke="#1e293b" stroke-width="4"/>
  <line x1="124" y1="122" x2="132" y2="122" stroke="#1e293b" stroke-width="4"/>
"""
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <title>{title}</title>
  <rect width="256" height="256" fill="#e2e8f0"/>
  <rect width="256" height="256" fill="{fill}" fill-opacity="0.45"/>
  <ellipse cx="128" cy="292" rx="108" ry="92" fill="{fill}"/>
  <rect x="108" y="154" width="40" height="36" rx="10" fill="{skin}"/>
  <circle cx="128" cy="118" r="50" fill="{skin}"/>
  <path d="{hair_path}" fill="{hair}"/>
  {glasses}
  <circle cx="128" cy="128" r="118" fill="none" stroke="#ffffff" stroke-width="16"/>
  <g transform="translate(178 178)">
    <rect width="56" height="42" rx="8" fill="#0f172a"/>
    <rect x="20" y="-8" width="16" height="10" rx="2" fill="#0f172a"/>
    <circle cx="28" cy="22" r="11" fill="#e2e8f0"/>
    <circle cx="28" cy="22" r="6" fill="#38bdf8"/>
  </g>
</svg>
"""
    return svg.encode("utf-8")


def force_mass_svg() -> bytes:
    return b"""<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#dc2626"/>
    </marker>
  </defs>
  <rect width="480" height="220" fill="#f8fafc"/>
  <line x1="40" y1="160" x2="440" y2="160" stroke="#334155" stroke-width="3"/>
  <rect x="180" y="90" width="120" height="70" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>
  <text x="240" y="132" text-anchor="middle" font-size="20" font-family="Arial, sans-serif">m = 2 kg</text>
  <line x1="300" y1="125" x2="400" y2="125" stroke="#dc2626" stroke-width="4" marker-end="url(#arrow)"/>
  <text x="350" y="110" text-anchor="middle" font-size="18" fill="#dc2626" font-family="Arial, sans-serif">F = 10 N</text>
</svg>
"""


def shm_spring_svg() -> bytes:
    return b"""<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180" viewBox="0 0 480 180">
  <rect width="480" height="180" fill="#f8fafc"/>
  <rect x="20" y="30" width="16" height="120" fill="#334155"/>
  <path d="M36 90 L56 70 L76 110 L96 70 L116 110 L136 70 L156 110 L176 90"
        fill="none" stroke="#0f766e" stroke-width="4"/>
  <rect x="176" y="65" width="70" height="50" fill="#94a3b8" stroke="#1e293b" stroke-width="2"/>
  <text x="211" y="95" text-anchor="middle" font-size="16" font-family="Arial, sans-serif">m</text>
  <line x1="36" y1="140" x2="420" y2="140" stroke="#334155" stroke-width="2"/>
  <text x="300" y="50" font-size="16" font-family="Arial, sans-serif">F = -kx, k = 4 N/m</text>
</svg>
"""


def mitochondria_svg() -> bytes:
    return b"""<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220" viewBox="0 0 420 220">
  <rect width="420" height="220" fill="#f8fafc"/>
  <ellipse cx="210" cy="110" rx="150" ry="70" fill="#fecaca" stroke="#b91c1c" stroke-width="3"/>
  <ellipse cx="210" cy="110" rx="125" ry="48" fill="#fee2e2" stroke="#b91c1c" stroke-width="2"/>
  <path d="M95 110 C130 70, 160 150, 200 110 S260 60, 300 110 S340 150, 360 110"
        fill="none" stroke="#991b1b" stroke-width="3"/>
  <text x="210" y="200" text-anchor="middle" font-size="16" font-family="Arial, sans-serif">Mitochondrion</text>
</svg>
"""


QUESTION_FIGURES: dict[str, tuple[str, Callable[[], bytes]]] = {
    Q_MAIN_1_PHY_MCQ: ("questions/force-mass.svg", force_mass_svg),
    Q_MAIN_2_PHY_MCQ: ("questions/force-mass.svg", force_mass_svg),
    Q_ADV_DRAFT_PASSAGE: ("questions/shm-spring.svg", shm_spring_svg),
    Q_ADV_CLOSED_PASSAGE: ("questions/shm-spring.svg", shm_spring_svg),
    Q_NEET_OPEN_BIO: ("questions/mitochondria.svg", mitochondria_svg),
    Q_NEET_LIVE_BIO: ("questions/mitochondria.svg", mitochondria_svg),
}
