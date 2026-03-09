-- Make numerical_answer_count and integer_answer_count nullable to match other question type columns
-- This allows subject-specific configurations to properly set default values

-- Drop the NOT NULL constraint and change default to NULL for numerical_answer_count
alter table "public"."qgen_generation_panes" 
alter column "numerical_answer_count" drop not null,
alter column "numerical_answer_count" set default null;

-- Drop the NOT NULL constraint and change default to NULL for integer_answer_count
alter table "public"."qgen_generation_panes" 
alter column "integer_answer_count" drop not null,
alter column "integer_answer_count" set default null;
