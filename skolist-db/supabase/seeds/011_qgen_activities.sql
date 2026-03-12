-- Seed file for dummy qgen activity with questions, draft, and sections
-- This creates a complete test activity that will be patched with a real auth user via seed_activities.py

-- 1. Insert dummy user into public.users (FK disabled in seed mode)
INSERT INTO "public"."users" (
    "id",
    "email",
    "user_type",
    "name",
    "org_id",
    "is_test_user",
    "credits",
    "account_status",
    "created_at",
    "updated_at"
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'dummy_seed@skolist.com',
    'private_user',
    'Dummy Seed User',
    '751434e6-0e95-4e09-8b78-1f8b1e05a94c', -- Public Org from 007_orgs.sql
    true,
    1000,
    'active',
    '2026-03-12 00:00:00+00',
    '2026-03-12 00:00:00+00'
)
ON CONFLICT ("id") DO NOTHING;

-- 2. Insert activity
INSERT INTO "public"."activities" (
    "id",
    "user_id",
    "name",
    "product_type",
    "created_at",
    "updated_at"
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001', -- Dummy user (will be patched)
    'Seed Test Paper - Class 10 Math',
    'qgen',
    '2026-03-12 00:00:00+00',
    '2026-03-12 00:00:00+00'
)
ON CONFLICT ("id") DO NOTHING;

-- 3. Insert qgen_generation_panes (manual - trigger won't fire in seed mode)
INSERT INTO "public"."qgen_generation_panes" (
    "id",
    "activity_id",
    "school_class_id",
    "subject_id",
    "total_marks_count",
    "total_time_count",
    "created_at",
    "updated_at"
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002', -- Activity
    'e763c901-a3b9-4472-9016-cebfa7a39902', -- Class 10 from 002_school_classes.sql
    'f4ef2dbd-8278-4827-9c5b-7954c50a65ac', -- Mathematics from 003_subjects.sql
    30,
    60,
    '2026-03-12 00:00:00+00',
    '2026-03-12 00:00:00+00'
)
ON CONFLICT ("activity_id") DO NOTHING;

-- 4. Insert qgen_drafts (manual - trigger won't fire in seed mode)
INSERT INTO "public"."qgen_drafts" (
    "id",
    "activity_id",
    "paper_title",
    "paper_subtitle",
    "institute_name",
    "logo_url",
    "subject_name",
    "school_class_name",
    "maximum_marks",
    "max_position",
    "is_show_instruction",
    "is_show_explanation_answer_key",
    "created_at",
    "updated_at"
) VALUES (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002', -- Activity
    'Seed Test Paper - Class 10 Math',
    'Mid-Term Examination',
    'Public Org',
    null,
    'Mathematics',
    'Class 10',
    30,
    3, -- max_position = 3 (we'll have 3 questions)
    true,
    true,
    '2026-03-12 00:00:00+00',
    '2026-03-12 00:00:00+00'
)
ON CONFLICT ("activity_id") DO NOTHING;

-- 5. Insert default instructions (manual - trigger on draft insert won't fire)
INSERT INTO "public"."qgen_draft_instructions_drafts_maps" (
    "id",
    "qgen_draft_id",
    "instruction_text",
    "created_at",
    "updated_at"
) VALUES
    (
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000004', -- Draft
        'All questions are compulsory.',
        '2026-03-12 00:00:00+00',
        '2026-03-12 00:00:00+00'
    ),
    (
        '00000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000004', -- Draft
        'Read the questions carefully before answering.',
        '2026-03-12 00:00:00+00',
        '2026-03-12 00:00:00+00'
    )
ON CONFLICT ("id") DO NOTHING;

-- 6. Insert draft section
INSERT INTO "public"."qgen_draft_sections" (
    "id",
    "qgen_draft_id",
    "section_name",
    "position_in_draft",
    "created_at",
    "updated_at"
) VALUES (
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000004', -- Draft
    'Section A',
    1,
    '2026-03-12 00:00:00+00',
    '2026-03-12 00:00:00+00'
)
ON CONFLICT ("id") DO NOTHING;

-- 7. Insert gen_questions
INSERT INTO "public"."gen_questions" (
    "id",
    "activity_id",
    "is_in_draft",
    "marks",
    "question_text",
    "answer_text",
    "explanation",
    "question_type",
    "hardness_level",
    "qgen_draft_section_id",
    "position_in_draft",
    "is_page_break_below",
    "is_exercise_question",
    "is_solved_example",
    "is_new",
    "created_at",
    "updated_at",
    "option1",
    "option2",
    "option3",
    "option4",
    "correct_mcq_option"
) VALUES
    -- Question 1: MCQ
    (
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000002', -- Activity
        true,
        4,
        'What is the standard form of a quadratic equation?',
        'The standard form of a quadratic equation is ax² + bx + c = 0, where a, b, c are real numbers and a ≠ 0.',
        'A quadratic equation is a polynomial equation of degree 2. The standard form requires the coefficient of x² (which is a) to be non-zero, otherwise it would not be quadratic.',
        'mcq4',
        'easy',
        '00000000-0000-0000-0000-000000000007', -- Section A
        1,
        false,
        false,
        false,
        true,
        '2026-03-12 00:00:00+00',
        '2026-03-12 00:00:00+00',
        'ax² + bx + c = 0 (a ≠ 0)',
        'x² + bx + c = 0',
        'ax + b = 0',
        'ax³ + bx² + cx + d = 0',
        1
    ),
    -- Question 2: Short Answer
    (
        '00000000-0000-0000-0000-000000000011',
        '00000000-0000-0000-0000-000000000002', -- Activity
        true,
        6,
        'Find the roots of the quadratic equation x² - 5x + 6 = 0 using the quadratic formula.',
        'Using the quadratic formula x = (-b ± √(b² - 4ac)) / (2a), where a = 1, b = -5, c = 6:\nx = (5 ± √(25 - 24)) / 2\nx = (5 ± 1) / 2\nTherefore, x = 3 or x = 2',
        'The quadratic formula x = (-b ± √(b² - 4ac)) / (2a) gives the roots of any quadratic equation ax² + bx + c = 0, provided the discriminant (b² - 4ac) is non-negative.',
        'short_answer',
        'medium',
        '00000000-0000-0000-0000-000000000007', -- Section A
        2,
        false,
        false,
        false,
        true,
        '2026-03-12 00:00:00+00',
        '2026-03-12 00:00:00+00',
        null,
        null,
        null,
        null,
        null
    ),
    -- Question 3: True or False
    (
        '00000000-0000-0000-0000-000000000012',
        '00000000-0000-0000-0000-000000000002', -- Activity
        true,
        2,
        'A pair of linear equations that has at least one solution is called a consistent pair of linear equations.',
        'True',
        'By definition, a consistent system of linear equations is one that has at least one solution. If it has no solution, it is called an inconsistent system.',
        'true_or_false',
        'easy',
        '00000000-0000-0000-0000-000000000007', -- Section A
        3,
        false,
        false,
        false,
        true,
        '2026-03-12 00:00:00+00',
        '2026-03-12 00:00:00+00',
        null,
        null,
        null,
        null,
        null
    )
ON CONFLICT ("id") DO NOTHING;

-- 8. Insert gen_question_versions (v0 - initial version for each question)
INSERT INTO "public"."gen_question_versions" (
    "id",
    "gen_question_id",
    "version_index",
    "is_active",
    "is_deleted",
    "marks",
    "question_text",
    "answer_text",
    "explanation",
    "question_type",
    "hardness_level",
    "option1",
    "option2",
    "option3",
    "option4",
    "correct_mcq_option",
    "created_at"
) VALUES
    -- Version for Question 1 (MCQ)
    (
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000010', -- Question 1
        0,
        true,
        false,
        4,
        'What is the standard form of a quadratic equation?',
        'The standard form of a quadratic equation is ax² + bx + c = 0, where a, b, c are real numbers and a ≠ 0.',
        'A quadratic equation is a polynomial equation of degree 2. The standard form requires the coefficient of x² (which is a) to be non-zero, otherwise it would not be quadratic.',
        'mcq4',
        'easy',
        'ax² + bx + c = 0 (a ≠ 0)',
        'x² + bx + c = 0',
        'ax + b = 0',
        'ax³ + bx² + cx + d = 0',
        1, -- Option 1 is correct
        '2026-03-12 00:00:00+00'
    ),
    -- Version for Question 2 (Short Answer)
    (
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000011', -- Question 2
        0,
        true,
        false,
        6,
        'Find the roots of the quadratic equation x² - 5x + 6 = 0 using the quadratic formula.',
        'Using the quadratic formula x = (-b ± √(b² - 4ac)) / (2a), where a = 1, b = -5, c = 6:\nx = (5 ± √(25 - 24)) / 2\nx = (5 ± 1) / 2\nTherefore, x = 3 or x = 2',
        'The quadratic formula x = (-b ± √(b² - 4ac)) / (2a) gives the roots of any quadratic equation ax² + bx + c = 0, provided the discriminant (b² - 4ac) is non-negative.',
        'short_answer',
        'medium',
        null,
        null,
        null,
        null,
        null,
        '2026-03-12 00:00:00+00'
    ),
    -- Version for Question 3 (True or False)
    (
        '00000000-0000-0000-0000-000000000022',
        '00000000-0000-0000-0000-000000000012', -- Question 3
        0,
        true,
        false,
        2,
        'A pair of linear equations that has at least one solution is called a consistent pair of linear equations.',
        'True',
        'By definition, a consistent system of linear equations is one that has at least one solution. If it has no solution, it is called an inconsistent system.',
        'true_or_false',
        'easy',
        null,
        null,
        null,
        null,
        null,
        '2026-03-12 00:00:00+00'
    )
ON CONFLICT ("id") DO NOTHING;

-- 9. Insert gen_questions_concepts_maps (link questions to concepts)
INSERT INTO "public"."gen_questions_concepts_maps" (
    "id",
    "gen_question_id",
    "concept_id",
    "created_at"
) VALUES
    -- Question 1 -> Quadratic Equation concept
    (
        '00000000-0000-0000-0000-000000000030',
        '00000000-0000-0000-0000-000000000010', -- Question 1
        '88fd0488-f076-47f0-9aef-0c43830e8b5a', -- Quadratic Equation concept from 006_concepts.sql
        '2026-03-12 00:00:00+00'
    ),
    -- Question 2 -> Quadratic Formula concept
    (
        '00000000-0000-0000-0000-000000000031',
        '00000000-0000-0000-0000-000000000011', -- Question 2
        'faf493af-48f5-4ba1-a0a6-bea8520fc234', -- Quadratic Formula concept from 006_concepts.sql
        '2026-03-12 00:00:00+00'
    ),
    -- Question 3 -> Consistent Pair of Linear Equations concept
    (
        '00000000-0000-0000-0000-000000000032',
        '00000000-0000-0000-0000-000000000012', -- Question 3
        '7afba2fe-aa0e-4dc9-ac57-1ce3d75f1517', -- Consistent Pair of Linear Equations concept from 006_concepts.sql
        '2026-03-12 00:00:00+00'
    )
ON CONFLICT ("id") DO NOTHING;
