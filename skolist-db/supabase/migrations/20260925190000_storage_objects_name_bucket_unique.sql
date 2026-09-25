--IDEMPOTENT
-- Storage API 1.69 upserts with ON CONFLICT (name, bucket_id).
-- The shipped indexes are either partial or include version, so that
-- conflict target does not match and seed uploads fail with 42P10.
--
-- postgres does not own storage.objects. Before `supabase migration up`,
-- as supabase_admin:
--   grant supabase_storage_admin to postgres;

SET ROLE supabase_storage_admin;

CREATE UNIQUE INDEX IF NOT EXISTS objects_name_bucket_id_key
    ON storage.objects (name, bucket_id);

RESET ROLE;
