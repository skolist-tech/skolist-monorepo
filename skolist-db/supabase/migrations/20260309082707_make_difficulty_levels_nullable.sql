-- Make difficulty level columns use NULL defaults instead of hard-coded values
-- This allows subject-specific configurations to properly set default difficulty distributions

-- Change defaults from fixed values to NULL
alter table "public"."qgen_generation_panes" 
alter column "difficulty_level_easy_count" set default null,
alter column "difficulty_level_medium_count" set default null,
alter column "difficulty_level_hard_count" set default null;
