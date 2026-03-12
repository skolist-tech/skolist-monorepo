-- Allow teachers/admin/principals to read user profiles in their own org.
-- Required for test dashboard joins that show student names.

CREATE OR REPLACE FUNCTION "public"."can_read_user_in_same_org"(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users me
    WHERE me.id = auth.uid()
      AND me.user_type IN ('teacher', 'admin', 'principal')
      AND me.org_id IS NOT NULL
      AND me.org_id = target_org_id
  );
$$;

REVOKE ALL ON FUNCTION "public"."can_read_user_in_same_org"(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."can_read_user_in_same_org"(uuid) TO authenticated;

DROP POLICY IF EXISTS "teachers_read_org_users" ON "public"."users";

CREATE POLICY "teachers_read_org_users"
  ON "public"."users"
  FOR SELECT
  TO authenticated
  USING ("public"."can_read_user_in_same_org"(org_id));
