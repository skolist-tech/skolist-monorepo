-- Add numerical_answer and integer_answer to question_type_enum
-- Using ALTER TYPE to add new values to existing enum

ALTER TYPE "public"."question_type_enum" ADD VALUE IF NOT EXISTS 'numerical_answer';
ALTER TYPE "public"."question_type_enum" ADD VALUE IF NOT EXISTS 'integer_answer';

-- Optional: Add check constraints to validate answer_text for these question types
-- Note: Primary validation happens in Pydantic models, but we add database-level checks as a safety net

-- For numerical_answer: answer_text should be a valid number (float)
-- For integer_answer: answer_text should be a valid integer
-- These constraints check that answer_text can be cast to the appropriate type when the question type is set

-- Note: We're adding a constraint that only validates when question_type is numerical_answer or integer_answer
-- and answer_text is not null

ALTER TABLE "public"."gen_questions" ADD CONSTRAINT "check_numerical_answer_is_numeric"
  CHECK (
    question_type != 'numerical_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$'
  );

ALTER TABLE "public"."gen_questions" ADD CONSTRAINT "check_integer_answer_is_integer"
  CHECK (
    question_type != 'integer_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]+$'
  );

ALTER TABLE "public"."gen_questions_versions" ADD CONSTRAINT "check_numerical_answer_is_numeric_versions"
  CHECK (
    question_type != 'numerical_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$'
  );

ALTER TABLE "public"."gen_questions_versions" ADD CONSTRAINT "check_integer_answer_is_integer_versions"
  CHECK (
    question_type != 'integer_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]+$'
  );
