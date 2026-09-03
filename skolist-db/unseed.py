#!/usr/bin/env python3
"""
Wipe application tables filled by python seeds / local testing, then re-seed
with `python seed.py`.

Does not TRUNCATE auth.* or other Supabase-internal schemas. Users are removed
one-by-one through Auth Admin so GoTrue stays consistent.

Usage:
    python unseed.py
    python unseed.pu -a
    python unseed.py --all
    python unseed.py --table-name users
    python unseed.py --table-name assessment.tests
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


class Colors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


def print_header(message: str):
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'=' * 70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{message.center(70)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'=' * 70}{Colors.ENDC}\n")


def print_success(message: str):
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")


def print_error(message: str):
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")


def print_warning(message: str):
    print(f"{Colors.WARNING}⚠ {message}{Colors.ENDC}")


def print_info(message: str):
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")


BATCH = 500


def _table(supabase, schema: str, table: str):
    if schema == "public":
        return supabase.table(table)
    return supabase.schema(schema).table(table)


def _resolve_assessment_responses(supabase) -> str:
    for name in ("responses", "answers"):
        try:
            _table(supabase, "assessment", name).select("id").limit(1).execute()
            return name
        except Exception:
            continue
    raise RuntimeError("Neither assessment.responses nor assessment.answers is reachable.")


def wipe_table(supabase, schema: str, table: str, *, child_fk: str | None = None) -> int:
    """Delete every row in schema.table."""
    api = _table(supabase, schema, table)
    label = f"{schema}.{table}"
    total = 0

    try:
        if child_fk:
            total += _delete_batches(api, lambda: api.select("id").not_.is_(child_fk, "null"))
        total += _delete_batches(api, lambda: api.select("id"))
    except Exception as exc:
        text = str(exc).lower()
        if "does not exist" in text or "schema cache" in text or "pgrst205" in text:
            print_warning(f"{label}: table not present, skipped")
            return 0
        raise

    print_success(f"{label}: wiped {total} row(s)")
    return total


def _delete_batches(api, build_query) -> int:
    total = 0
    while True:
        rows = build_query().limit(BATCH).execute().data or []
        if not rows:
            return total
        ids = [row["id"] for row in rows]
        api.delete().in_("id", ids).execute()
        total += len(ids)
        if len(ids) < BATCH:
            return total


def wipe_users(supabase) -> None:
    print_info("Wiping public.users via Auth Admin (does not truncate auth schema tables)")
    total = 0
    while True:
        rows = supabase.table("users").select("id, email").limit(BATCH).execute().data or []
        if not rows:
            break
        for row in rows:
            supabase.auth.admin.delete_user(row["id"])
            print_success(f"  deleted {row.get('email') or row['id']}")
            total += 1
    print_success(f"public.users: wiped {total} user(s)")


def wipe_orgs(supabase) -> None:
    print_warning(
        "Wiping public.orgs. New signups will fail until seed.py recreates "
        "Seed Organisation (auth trigger still uses that org id)."
    )
    wipe_table(supabase, "public", "orgs")


def make_steps(supabase):
    responses = _resolve_assessment_responses(supabase)

    def assessment(table: str, child_fk: str | None = None):
        return lambda: wipe_table(supabase, "assessment", table, child_fk=child_fk)

    def public(table: str, child_fk: str | None = None):
        return lambda: wipe_table(supabase, "public", table, child_fk=child_fk)

    return (
        ("assessment.responses", assessment(responses)),
        ("assessment.attempts", assessment("attempts")),
        ("assessment.questions", assessment("questions", child_fk="parent_question_id")),
        ("assessment.sections", assessment("sections")),
        ("assessment.test_assignees", assessment("test_assignees")),
        ("assessment.tests", assessment("tests")),
        ("gen_images", public("gen_images")),
        ("gen_questions_concepts_maps", public("gen_questions_concepts_maps")),
        ("gen_question_versions", public("gen_question_versions")),
        ("gen_questions", public("gen_questions")),
        ("gen_artifacts", public("gen_artifacts")),
        ("concepts_activities_maps", public("concepts_activities_maps")),
        ("generation_pane_concepts_maps", public("generation_pane_concepts_maps")),
        ("qgen_draft_instructions_drafts_maps", public("qgen_draft_instructions_drafts_maps")),
        ("qgen_draft_sections", public("qgen_draft_sections")),
        ("qgen_drafts", public("qgen_drafts")),
        ("qgen_generation_panes", public("qgen_generation_panes")),
        ("activities", public("activities")),
        ("users", lambda: wipe_users(supabase)),
        ("orgs", lambda: wipe_orgs(supabase)),
    )


TABLE_ALIASES = {
    "responses": "assessment.responses",
    "answers": "assessment.responses",
    "assessment.responses": "assessment.responses",
    "assessment.answers": "assessment.responses",
    "attempts": "assessment.attempts",
    "assessment.attempts": "assessment.attempts",
    "questions": "assessment.questions",
    "assessment.questions": "assessment.questions",
    "sections": "assessment.sections",
    "assessment.sections": "assessment.sections",
    "test_assignees": "assessment.test_assignees",
    "assessment.test_assignees": "assessment.test_assignees",
    "tests": "assessment.tests",
    "assessment.tests": "assessment.tests",
    "gen_images": "gen_images",
    "public.gen_images": "gen_images",
    "gen_questions_concepts_maps": "gen_questions_concepts_maps",
    "public.gen_questions_concepts_maps": "gen_questions_concepts_maps",
    "gen_question_versions": "gen_question_versions",
    "public.gen_question_versions": "gen_question_versions",
    "gen_questions": "gen_questions",
    "public.gen_questions": "gen_questions",
    "gen_artifacts": "gen_artifacts",
    "public.gen_artifacts": "gen_artifacts",
    "concepts_activities_maps": "concepts_activities_maps",
    "public.concepts_activities_maps": "concepts_activities_maps",
    "generation_pane_concepts_maps": "generation_pane_concepts_maps",
    "public.generation_pane_concepts_maps": "generation_pane_concepts_maps",
    "qgen_draft_instructions_drafts_maps": "qgen_draft_instructions_drafts_maps",
    "public.qgen_draft_instructions_drafts_maps": "qgen_draft_instructions_drafts_maps",
    "qgen_draft_sections": "qgen_draft_sections",
    "public.qgen_draft_sections": "qgen_draft_sections",
    "qgen_drafts": "qgen_drafts",
    "public.qgen_drafts": "qgen_drafts",
    "qgen_generation_panes": "qgen_generation_panes",
    "public.qgen_generation_panes": "qgen_generation_panes",
    "activities": "activities",
    "public.activities": "activities",
    "users": "users",
    "public.users": "users",
    "orgs": "orgs",
    "public.orgs": "orgs",
}


def resolve_table_name(raw: str, step_names: list[str]) -> str:
    key = raw.strip().lower()
    if key not in TABLE_ALIASES:
        print_error(f"Unknown table {raw!r}")
        print_info("Known tables:")
        for name in step_names:
            print(f"  • {name}")
        sys.exit(2)
    return TABLE_ALIASES[key]


def run_step(name: str, fn) -> None:
    print(f"\n{Colors.BOLD}{Colors.OKBLUE}▶ {name}{Colors.ENDC}")
    try:
        fn()
    except Exception as exc:
        print_warning(f"{name}: {exc}")
        raise


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Wipe python-seed / local-testing tables so `python seed.py` can reload fresh data. "
            "Does not touch auth schema tables or SQL curriculum seeds (boards, bank questions, …)."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  python unseed.py\n"
            "  python unseed.py --all\n"
            "  python unseed.py --table-name users\n"
            "  python unseed.py --table-name assessment.tests\n"
        ),
    )
    parser.add_argument(
        "-a",
        "--all",
        action="store_true",
        help="Wipe every application table listed below (default if no --table-name).",
    )
    parser.add_argument(
        "--table-name",
        metavar="TABLE",
        help="Wipe this table completely (all rows, including local testing edits).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.all and args.table_name:
        print_error("Use either --all or --table-name, not both.")
        sys.exit(2)

    from python_seeds.client import SUPABASE_URL, get_supabase_admin_client

    print_header("Skolist unseed")
    print_info(f"Supabase: {SUPABASE_URL}")
    print_info("Wiping whole application tables. auth.* is not truncated.")

    supabase = get_supabase_admin_client()
    steps = make_steps(supabase)
    by_name = {name: fn for name, fn in steps}
    names = [name for name, _ in steps]

    try:
        if args.table_name:
            key = resolve_table_name(args.table_name, names)
            run_step(key, by_name[key])
        else:
            for name, fn in steps:
                run_step(name, fn)
    except Exception as exc:
        print()
        print_error(str(exc))
        raise

    print_header("Unseed complete")
    print_success("Run python seed.py to reload fresh data")


if __name__ == "__main__":
    main()
