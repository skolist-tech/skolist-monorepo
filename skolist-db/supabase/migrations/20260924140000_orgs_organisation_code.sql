--IDEMPOTENT
-- 6-letter organisation codes for assessment email sign-in.

ALTER TABLE "public"."orgs"
    ADD COLUMN IF NOT EXISTS "organisation_code" text;

COMMENT ON COLUMN "public"."orgs"."organisation_code" IS
    'Unique 6-letter code used to identify the organisation at assessment sign-in';

ALTER TABLE "public"."orgs"
    DROP CONSTRAINT IF EXISTS "orgs_organisation_code_format";

ALTER TABLE "public"."orgs"
    ADD CONSTRAINT "orgs_organisation_code_format"
    CHECK (
        "organisation_code" IS NULL
        OR "organisation_code" ~ '^[A-Z]{6}$'
    );

CREATE UNIQUE INDEX IF NOT EXISTS "orgs_organisation_code_key"
    ON "public"."orgs" ("organisation_code");
