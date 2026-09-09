--IDEMPOTENT
-- NTA CBT support: question images + response visit / mark-for-review flags.

ALTER TABLE assessment.questions
    ADD COLUMN IF NOT EXISTS image_url text,
    ADD COLUMN IF NOT EXISTS option1_image_url text,
    ADD COLUMN IF NOT EXISTS option2_image_url text,
    ADD COLUMN IF NOT EXISTS option3_image_url text,
    ADD COLUMN IF NOT EXISTS option4_image_url text;

COMMENT ON COLUMN assessment.questions.image_url IS 'Optional figure URL shown with the stem (NTA-style diagrams)';
COMMENT ON COLUMN assessment.questions.option1_image_url IS 'Optional image for option 1';
COMMENT ON COLUMN assessment.questions.option2_image_url IS 'Optional image for option 2';
COMMENT ON COLUMN assessment.questions.option3_image_url IS 'Optional image for option 3';
COMMENT ON COLUMN assessment.questions.option4_image_url IS 'Optional image for option 4';

ALTER TABLE assessment.responses
    ADD COLUMN IF NOT EXISTS is_visited boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_marked_for_review boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN assessment.responses.is_visited IS 'True once the candidate has opened the question (NTA palette: not visited vs visited)';
COMMENT ON COLUMN assessment.responses.is_marked_for_review IS 'NTA Mark for Review flag; answered+marked is still evaluated';
