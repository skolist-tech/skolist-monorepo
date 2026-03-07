-- Add numerical_answer and integer_answer to question_type_enum
-- Using ALTER TYPE to add new values to existing enum
-- Note: PostgreSQL requires enum additions to be in a separate transaction from their usage
-- Constraints will be added in a follow-up migration

ALTER TYPE "public"."question_type_enum" ADD VALUE IF NOT EXISTS 'numerical_answer';
ALTER TYPE "public"."question_type_enum" ADD VALUE IF NOT EXISTS 'integer_answer';
