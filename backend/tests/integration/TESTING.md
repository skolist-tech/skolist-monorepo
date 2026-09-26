# Integration tests

Supabase plus the backend Python code. The API launches Chromium; these tests do not open a frontend. Install the browser for the Playwright version pinned in `backend/pyproject.toml` (same release as `e2e/package.json`). Parent: [../../TESTING.md](../../TESTING.md). How to run: [../README.md](../README.md).

Needs a local Supabase stack and the Python seeds. See [../README.md](../README.md).

| File | What it covers |
| --- | --- |
| `test_assessment_auth_api.py` | Assessment auth, and that student payloads do not leak answer keys. |
| `test_assessment_login_api.py` | Email, password, and organisation-code sign-in against seeded users. |
| `test_assessment_student_api.py` | Assigned tests, saving a response, submit, grading, and lock after submit. |
| `test_assessment_teacher_api.py` | Teacher list/read, question CRUD, assign, publish, and delete. |
| `test_auto_correct_question_api.py` | Auto-correct HTTP API: auth, validation, and a successful correction. |
| `test_bank_api.py` | Question-bank list, preview, and update (seeded `bank-admin@seed.skolist.com`) |
| `test_download_api.py` | PDF and DOCX download endpoints. |
| `test_edit_svg_api.py` | Edit-SVG endpoint: auth, validation, and a successful edit. |
| `test_extract_questions_api.py` | Extract-questions endpoint: auth, validation, and a successful extract. |
| `test_generate_questions_api.py` | Generate-questions endpoint: auth, validation, batches, and instructions. |
| `test_get_feedback_api.py` | Feedback endpoint: auth, validation, and a successful call. |
| `test_regenerate_question_api.py` | Regenerate-question endpoint: auth, validation, and a successful regenerate. |
| `test_regenerate_question_with_prompt_api.py` | Regenerate-with-prompt endpoint, including file uploads. |
| `test_supabase_auth_hello.py` | Authenticated hello against a seeded Supabase user. |
| [rpc/TESTING.md](./rpc/TESTING.md) | Postgres RPCs called from Python. |
