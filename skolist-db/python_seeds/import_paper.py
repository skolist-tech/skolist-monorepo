"""Create one assessment test from an extracted paper.json.

The test is owned by teacher1@seed.skolist.com so it shows up in that
teacher's assessment UI. Not auto-run by seed.py.

    cd skolist-db
    python python_seeds/import_paper.py ../extraction_app/runs/mht-cet-2025/paper.json
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

from python_seeds.client import SUPABASE_URL, get_supabase_admin_client, require_public_user

TEACHER_EMAIL = "teacher1@seed.skolist.com"
QUESTION_IMAGES_BUCKET = "assessment_question_images"
IMAGE_FIELDS = (
    ("image_path", "image_url", "stem"),
    ("option1_image_path", "option1_image_url", "option1"),
    ("option2_image_path", "option2_image_url", "option2"),
    ("option3_image_path", "option3_image_url", "option3"),
    ("option4_image_path", "option4_image_url", "option4"),
    ("explanation_image_path", "explanation_image_url", "explanation"),
)
SVG_FIELDS = (
    "svg_image_code",
    "option1_svg_image_code",
    "option2_svg_image_code",
    "option3_svg_image_code",
    "option4_svg_image_code",
    "explanation_svg_image_code",
)


def assessment_table(supabase, table_name: str):
    return supabase.schema("assessment").table(table_name)


def upload_question_image(supabase, object_path: str, content: bytes) -> str:
    bucket = supabase.storage.from_(QUESTION_IMAGES_BUCKET)
    options = {"content-type": "image/png", "upsert": "true"}
    try:
        bucket.upload(object_path, content, file_options=options)
    except Exception as exc:
        message = str(exc).lower()
        if "already exists" not in message and "duplicate" not in message:
            raise
        bucket.update(object_path, content, file_options=options)
    return f"storage:{QUESTION_IMAGES_BUCKET}/{object_path}"


def attach_images(supabase, question: dict, source: dict, paper_dir: Path, test_id: str, index: int) -> None:
    for path_key, column, slot in IMAGE_FIELDS:
        relative = source.get(path_key)
        if not relative:
            continue
        file_path = paper_dir / relative
        if not file_path.is_file():
            print(f"⚠ missing image for question {index} {slot}: {file_path}")
            continue
        object_path = f"papers/{test_id}/{index:03d}-{slot}.png"
        question[column] = upload_question_image(supabase, object_path, file_path.read_bytes())
    for column in SVG_FIELDS:
        value = source.get(column)
        if value:
            question[column] = value


def import_paper(paper_path: Path) -> str:
    paper = json.loads(paper_path.read_text())
    paper_dir = paper_path.parent
    supabase = get_supabase_admin_client()
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    teacher = require_public_user(supabase, TEACHER_EMAIL, "Teacher")
    now = datetime.now(timezone.utc).isoformat()
    test_id = str(uuid4())
    correct = float(paper.get("default_correct_marks") or 1)
    negative = float(paper.get("default_negative_marks") or 0)
    duration = int(paper.get("duration_minutes") or 180)
    question_count = sum(len(section.get("questions") or []) for section in paper.get("sections") or [])

    test = {
        "id": test_id,
        "org_id": teacher["org_id"],
        "created_by": teacher["id"],
        "name": paper.get("name") or paper_path.stem,
        "description": paper.get("instructions"),
        "exam_type": "other",
        "status": "draft",
        "duration_minutes": duration,
        "total_marks": paper.get("total_marks") if paper.get("total_marks") is not None else question_count * correct,
        "default_correct_marks": correct,
        "default_negative_marks": negative,
        "created_at": now,
        "updated_at": now,
    }
    assessment_table(supabase, "tests").insert(test).execute()
    assessment_table(supabase, "test_teacher_access").insert(
        {"test_id": test_id, "teacher_id": teacher["id"]}
    ).execute()

    question_rows = []
    running_index = 0
    for section_index, section in enumerate(paper.get("sections") or [], start=1):
        section_id = str(uuid4())
        assessment_table(supabase, "sections").insert(
            {
                "id": section_id,
                "test_id": test_id,
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
                "test_id": test_id,
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
            attach_images(supabase, row, source, paper_dir, test_id, running_index)
            question_rows.append(row)

    if question_rows:
        assessment_table(supabase, "questions").insert(question_rows).execute()

    print(f"✓ Draft test {test['name']}")
    print(f"  id: {test_id}")
    print(f"  teacher: {teacher['email']}")
    print(f"  sections: {len(paper.get('sections') or [])}")
    print(f"  questions: {len(question_rows)}")
    return test_id


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Import an extracted paper.json as a draft test for teacher1.")
    parser.add_argument("paper_json", type=Path, help="Path to paper.json from paper-extract.")
    args = parser.parse_args(argv)
    if not args.paper_json.is_file():
        parser.error(f"paper.json not found: {args.paper_json}")
    import_paper(args.paper_json)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
