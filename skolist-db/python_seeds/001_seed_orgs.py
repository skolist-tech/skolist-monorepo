"""
Seed organisations from python_seeds/data/_001_data_orgs.py.

Must run before 002_seed_users.py so auth users can FK to Seed Organisation.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python_seeds.client import SUPABASE_URL, get_supabase_admin_client
from python_seeds.data import orgs as org_data


def seed_orgs():
    supabase = get_supabase_admin_client()
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    print(f"Seeding {len(org_data.ORGS)} organisation(s)...\n")

    response = (
        supabase.table("orgs")
        .upsert(org_data.ORGS, on_conflict="id")
        .execute()
    )
    for org in response.data or org_data.ORGS:
        print(f"✓ Upserted org {org['id']}  {org.get('header_line')}")

    print("\nSeeding complete!")


if __name__ == "__main__":
    seed_orgs()
