-- RPC function to batch fetch version states for multiple questions
-- Returns canUndo and canRedo for each question in a single query

CREATE OR REPLACE FUNCTION get_version_states_batch(question_ids uuid[])
RETURNS TABLE (
  gen_question_id uuid,
  can_undo boolean,
  can_redo boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH active_versions AS (
    SELECT 
      gqv.gen_question_id,
      gqv.version_index as active_index
    FROM gen_question_versions gqv
    WHERE 
      gqv.gen_question_id = ANY(question_ids)
      AND gqv.is_active = true 
      AND gqv.is_deleted = false
  )
  SELECT 
    av.gen_question_id,
    -- Check if previous version exists (can undo)
    EXISTS (
      SELECT 1 
      FROM gen_question_versions gqv2
      WHERE gqv2.gen_question_id = av.gen_question_id
        AND gqv2.version_index < av.active_index
        AND gqv2.is_deleted = false
    ) as can_undo,
    -- Check if next version exists (can redo)
    EXISTS (
      SELECT 1 
      FROM gen_question_versions gqv3
      WHERE gqv3.gen_question_id = av.gen_question_id
        AND gqv3.version_index > av.active_index
        AND gqv3.is_deleted = false
    ) as can_redo
  FROM active_versions av;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_version_states_batch(uuid[]) TO authenticated;

COMMENT ON FUNCTION get_version_states_batch IS 'Batch fetch version states (canUndo/canRedo) for multiple questions in a single query. Reduces N+1 query problem from 3N queries to 1.';
