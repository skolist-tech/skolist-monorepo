--IDEMPOTENT
-- Optional figure for a question explanation. Same private bucket as stem
-- and option images. SVG is preferred over the image when both are set.

ALTER TABLE assessment.questions
    ADD COLUMN IF NOT EXISTS explanation_image_url text,
    ADD COLUMN IF NOT EXISTS explanation_svg_image_code text;

COMMENT ON COLUMN assessment.questions.explanation_image_url IS 'Optional figure for the explanation. storage:assessment_question_images/... until the API signs it. Hidden from students until explanation text is revealed.';
COMMENT ON COLUMN assessment.questions.explanation_svg_image_code IS 'Optional inline SVG for the explanation. Preferred over explanation_image_url when both are set.';

ALTER TABLE assessment.blueprint_questions
    ADD COLUMN IF NOT EXISTS explanation_image_url text,
    ADD COLUMN IF NOT EXISTS explanation_svg_image_code text;

COMMENT ON COLUMN assessment.blueprint_questions.explanation_image_url IS 'Optional figure for the explanation. storage:assessment_question_images/... until the API signs it.';
COMMENT ON COLUMN assessment.blueprint_questions.explanation_svg_image_code IS 'Optional inline SVG for the explanation. Preferred over explanation_image_url when both are set.';
