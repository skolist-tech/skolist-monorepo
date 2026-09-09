# Assessment Database

## Introduction

The Assessment database is a standalone database for the Assessment API. It is independent of the qgen database and is used to store the assessment data.

## Schema

The Assessment database schema is as follows:

## Tables

- assessment.tests
    - This table stores the details of the tests (metadata and configuration).
    - There will be sepearate table for questions, which will be linked to the test using the test_id.
    - A test refers to an organisation from the public.orgs table using org_id.
    - A test is created by a user from the public.users table using created_by.
    - A test must have it's exam type : like "jee_main", "jee_advanced", "neet".

- assessment.sections
    - This table stores the details of the sections of a test.
    - A section is a part of a test that contains questions of a specific subject generally.
    - A section is linked to a test using the test_id.

- assessment.questions
    - Optional NTA-style figures live on `image_url` and `optionN_image_url`.
    - Python seeds upload a few SVG figures to the public `seed_assets` storage bucket and set those URLs.

Candidate photos are **not** on the assessment schema. They are `public.users.avatar_url`. `_002_seed_users.py` uploads portrait SVGs (person + camera badge, not name initials) to `seed_assets/avatars/` and writes the public URL onto each seeded user. 

