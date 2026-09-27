"""Create one catalog blueprint from an extracted paper.json.

Blueprints are not owned by a teacher. This inserts test_blueprints,
blueprint_sections, and blueprint_questions only. Not auto-run by seed.py.

    cd skolist-db
    python python_seeds/import_blueprint.py --kind full_syllabus ../internal-tools/extraction_app/out/paper.json
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python_seeds.client import SUPABASE_URL, get_supabase_admin_client
from python_seeds.import_paper import assessment_table, attach_images

ALLOWED_KINDS = ("full_syllabus",)


def require_kind(kind: str) -> str:
    if kind not in ALLOWED_KINDS:
        allowed = ", ".join(ALLOWED_KINDS)
        raise ValueError(f"kind must be one of: {allowed}")
    return kind


def import_blueprint(paper_path: Path, kind: str) -> str:
    kind = require_kind(kind)
    paper = json.loads(paper_path.read_text())
    paper_dir = paper_path.parent
    supabase = get_supabase_admin_client()
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    now = datetime.now(timezone.utc).isoformat()
    blueprint_id = str(uuid4())
    correct = float(paper.get("default_correct_marks") or 1)
    negative = float(paper.get("default_negative_marks") or 0)
    duration = int(paper.get("duration_minutes") or 180)
    question_count = sum(len(section.get("questions") or []) for section in paper.get("sections") or [])

    blueprint = {
        "id": blueprint_id,
        "name": paper.get("name") or paper_path.stem,
        "description": paper.get("instructions"),
        "exam_type": "other",
        "duration_minutes": duration,
        "total_marks": paper.get("total_marks") if paper.get("total_marks") is not None else question_count * correct,
        "default_correct_marks": correct,
        "default_negative_marks": negative,
        "kind": kind,
        "created_at": now,
        "updated_at": now,
    }
    assessment_table(supabase, "test_blueprints").insert(blueprint).execute()

    question_rows = []
    running_index = 0
    for section_index, section in enumerate(paper.get("sections") or [], start=1):
        section_id = str(uuid4())
        assessment_table(supabase, "blueprint_sections").insert(
            {
                "id": section_id,
                "blueprint_id": blueprint_id,
                "name": section.get("name") or f"Section {section_index}",
                "position": section.get("position") or section_index,
                "subject": "other",
                "correct_marks": correct,
                "negative_marks": negative,
                "created_at": now,
                "updated_at": now,
            }
        ).execute()
        for position, source in enumerate(section.get("questions") or [], start=1):
            running_index += 1
            row = {
                "id": str(uuid4()),
                "blueprint_id": blueprint_id,
                "section_id": section_id,
                "position": position,
                "question_text": source.get("question_text") or "",
                "question_type": "mcq",
                "hardness_level": "easy",
                "marks": correct,
                "negative_marks": negative,
                "option1": source.get("option1"),
                "option2": source.get("option2"),
                "option3": source.get("option3"),
                "option4": source.get("option4"),
                "correct_mcq_option": source.get("correct_mcq_option"),
                "explanation": source.get("explanation"),
                "created_at": now,
                "updated_at": now,
            }
            attach_images(supabase, row, source, paper_dir, blueprint_id, running_index)
            question_rows.append(row)

    if question_rows:
        assessment_table(supabase, "blueprint_questions").insert(question_rows).execute()

    print(f"✓ Blueprint {blueprint['name']}")
    print(f"  id: {blueprint_id}")
    print(f"  kind: {kind}")
    print(f"  sections: {len(paper.get('sections') or [])}")
    print(f"  questions: {len(question_rows)}")
    return blueprint_id


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Import an extracted paper.json as a catalog blueprint.")
    parser.add_argument("paper_json", type=Path, help="Path to paper.json from paper-extract.")
    parser.add_argument(
        "--kind",
        required=True,
        help=f"Blueprint kind. Accepted: {', '.join(ALLOWED_KINDS)}.",
    )
    args = parser.parse_args(argv)
    require_kind(args.kind)
    if not args.paper_json.is_file():
        parser.error(f"paper.json not found: {args.paper_json}")
    import_blueprint(args.paper_json, args.kind)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
