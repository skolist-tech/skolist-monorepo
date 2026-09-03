"""Organisations created by 001_seed_orgs.py.

The Seed Organisation id must match public.handle_auth_user_created(),
which assigns this org_id to every new auth user.
"""

# Keep in sync with public.handle_auth_user_created() in
# supabase/migrations/20260202210931_remote_schema.sql
SEED_ORG_ID = "751434e6-0e95-4e09-8b78-1f8b1e05a94c"
CBSE_BOARD_ID = "51b7d3cb-b469-4c4e-8c42-70d3c2388fb5"

SEED_ORG = {
    "id": SEED_ORG_ID,
    "email": "seed.org@skolist.com",
    "logo_url": None,
    "org_type": "school",
    "phone_num": "0000000001",
    "address": None,
    "header_line": "Seed Organisation",
    "board_id": CBSE_BOARD_ID,
}

ORGS = [SEED_ORG]
