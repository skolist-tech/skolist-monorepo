--IDEMPOTENT
-- Inline SVG markup for NTA figures, alongside the existing image URL columns.

ALTER TABLE assessment.questions
    ADD COLUMN IF NOT EXISTS svg_image_code text,
    ADD COLUMN IF NOT EXISTS option1_svg_image_code text,
    ADD COLUMN IF NOT EXISTS option2_svg_image_code text,
    ADD COLUMN IF NOT EXISTS option3_svg_image_code text,
    ADD COLUMN IF NOT EXISTS option4_svg_image_code text;

COMMENT ON COLUMN assessment.questions.svg_image_code IS 'Optional inline SVG shown with the stem; preferred over image_url when both are set';
COMMENT ON COLUMN assessment.questions.option1_svg_image_code IS 'Optional inline SVG for option 1';
COMMENT ON COLUMN assessment.questions.option2_svg_image_code IS 'Optional inline SVG for option 2';
COMMENT ON COLUMN assessment.questions.option3_svg_image_code IS 'Optional inline SVG for option 3';
COMMENT ON COLUMN assessment.questions.option4_svg_image_code IS 'Optional inline SVG for option 4';
