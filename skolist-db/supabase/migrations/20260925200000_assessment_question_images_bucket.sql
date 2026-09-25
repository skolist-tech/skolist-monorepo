--IDEMPOTENT
-- Private bucket for teacher-uploaded question and option images.
-- Only the backend (service role) reads and writes it; clients get
-- short-lived signed URLs from the assessment API.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assessment_question_images',
    'assessment_question_images',
    false,
    2097152,
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false;
