-- Add numerical_answer_count and integer_answer_count columns to qgen_generation_panes table

alter table "public"."qgen_generation_panes" 
add column "numerical_answer_count" smallint not null default '0'::smallint,
add column "integer_answer_count" smallint not null default '0'::smallint;

-- Add check constraints to ensure counts are non-negative
alter table "public"."qgen_generation_panes"
add constraint "qgen_generation_panes_numerical_answer_count_check" check (("numerical_answer_count" >= 0)),
add constraint "qgen_generation_panes_integer_answer_count_check" check (("integer_answer_count" >= 0));
