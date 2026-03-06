-- Create RPC function to fetch complete subject tree data (chapters -> topics -> concepts)
-- This replaces multiple client-side queries with a single optimized database call

CREATE OR REPLACE FUNCTION get_subject_tree_data(p_subject_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Build nested JSON structure with chapters, topics, and concepts
  SELECT json_build_object(
    'chapters', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', c.id,
            'name', c.name,
            'description', c.description,
            'subject_id', c.subject_id,
            'position', c.position,
            'created_at', c.created_at,
            'updated_at', c.updated_at
          ) ORDER BY c.position
        )
        FROM chapters c
        WHERE c.subject_id = p_subject_id
      ), '[]'::json
    ),
    'topics', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', t.id,
            'name', t.name,
            'description', t.description,
            'chapter_id', t.chapter_id,
            'position', t.position,
            'created_at', t.created_at,
            'updated_at', t.updated_at
          ) ORDER BY t.position
        )
        FROM topics t
        INNER JOIN chapters c ON t.chapter_id = c.id
        WHERE c.subject_id = p_subject_id
      ), '[]'::json
    ),
    'concepts', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', co.id,
            'name', co.name,
            'description', co.description,
            'topic_id', co.topic_id,
            'page_number', co.page_number,
            'created_at', co.created_at,
            'updated_at', co.updated_at
          ) ORDER BY co.page_number
        )
        FROM concepts co
        INNER JOIN topics t ON co.topic_id = t.id
        INNER JOIN chapters c ON t.chapter_id = c.id
        WHERE c.subject_id = p_subject_id
      ), '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_subject_tree_data(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_subject_tree_data IS 
'Fetches all chapters, topics, and concepts for a given subject in a single call. Returns a JSON object with three arrays: chapters, topics, and concepts.';
