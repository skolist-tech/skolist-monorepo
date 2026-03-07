-- Add check constraints to validate answer_text for numerical_answer and integer_answer question types
-- Note: Primary validation happens in Pydantic models, but we add database-level checks as a safety net
-- This is in a separate migration because PostgreSQL requires enum values to be committed before use

-- For numerical_answer: answer_text should be a valid number (float/decimal)
-- Regex pattern matches: optional minus, digits, optional decimal point with digits, optional scientific notation
ALTER TABLE "public"."gen_questions" ADD CONSTRAINT "check_numerical_answer_is_numeric"
  CHECK (
    question_type != 'numerical_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$'
  );

-- For integer_answer: answer_text should be a valid integer (whole number)
-- Regex pattern matches: optional minus followed by digits only
ALTER TABLE "public"."gen_questions" ADD CONSTRAINT "check_integer_answer_is_integer"
  CHECK (
    question_type != 'integer_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]+$'
  );

-- Add same constraints to gen_question_versions table
ALTER TABLE "public"."gen_question_versions" ADD CONSTRAINT "check_numerical_answer_is_numeric_versions"
  CHECK (
    question_type != 'numerical_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$'
  );

ALTER TABLE "public"."gen_question_versions" ADD CONSTRAINT "check_integer_answer_is_integer_versions"
  CHECK (
    question_type != 'integer_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]+$'
  );

-- Add same constraints to bank_questions table
ALTER TABLE "public"."bank_questions" ADD CONSTRAINT "check_numerical_answer_is_numeric_bank"
  CHECK (
    question_type != 'numerical_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$'
  );

ALTER TABLE "public"."bank_questions" ADD CONSTRAINT "check_integer_answer_is_integer_bank"
  CHECK (
    question_type != 'integer_answer'::question_type_enum 
    OR answer_text IS NULL 
    OR answer_text ~ '^-?[0-9]+$'
  );
