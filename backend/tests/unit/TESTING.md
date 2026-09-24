# Unit tests

Python-only. No database and no frontend. Parent: [../../TESTING.md](../../TESTING.md). How to run: [../README.md](../README.md).

| File | What it covers |
| --- | --- |
| `test_assessment_assignees.py` | Assignee profile enrichment and student search matching. |
| `test_assessment_grading.py` | MCQ, MSQ, numerical, and integer scoring, including unanswered and passage stems. |
| `test_assessment_login.py` | Organisation-code normalisation, and password sign-in on a throwaway Supabase client (settings and client are stubbed). |
| `test_assessment_nta.py` | Question image URLs and SVG markup on the student payload, visit / mark-for-review flags, and that review does not change grading. |
| `test_assessment_serializers.py` | Answer keys and explanations are stripped from in-progress student payloads. |
| `test_auto_correct_question.py` | Auto-correct service flow with a mocked model. |
| `test_credits.py` | Credit checks and deduction, including the zero floor. |
| `test_download_docx.py` | DOCX download assembly, page breaks, and rollback when math rendering fails. |
| `test_download_pdf.py` | PDF download with a mocked browser, including a missing browser service. |
| `test_extract_questions.py` | Extract-questions uploads: images become image blocks; PDFs are not sent as images. |
| `test_llm.py` | LLM media blocks stay `image_url` for images. |
| `test_question_generator.py` | Batch building, prompts, and validated generation with a mocked model. |
| `test_regenerate_question.py` | Regenerate prompt, processing, and validation. |
| `test_regenerate_question_with_prompt.py` | Regenerate-with-prompt prompt text and service flow. |
