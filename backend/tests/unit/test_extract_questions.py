"""Unit tests for extract_questions: image vs PDF uploads."""

from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import UploadFile
from fastapi.testclient import TestClient
from starlette.datastructures import Headers

from api.v1.auth import get_async_supabase_client, require_supabase_user
from api.v1.qgen.extract_questions.service import ExtractionValidationError, process_uploaded_file
from api.v1.qgen.models import ExtractedQuestion, ExtractedQuestionsList
from app import create_app

USER_ID = "test-user"
ACTIVITY_ID = "11111111-1111-4111-8111-111111111111"
DRAFT_ID = "22222222-2222-4222-8222-222222222222"
SECTION_ID = "33333333-3333-4333-8333-333333333333"
QUESTION_ID = "44444444-4444-4444-8444-444444444444"
JOB_ID = "55555555-5555-4555-8555-555555555555"

TINY_PNG = bytes(
    [
        0x89,
        0x50,
        0x4E,
        0x47,
        0x0D,
        0x0A,
        0x1A,
        0x0A,
        0x00,
        0x00,
        0x00,
        0x0D,
        0x49,
        0x48,
        0x44,
        0x52,
        0x00,
        0x00,
        0x00,
        0x01,
        0x00,
        0x00,
        0x00,
        0x01,
        0x08,
        0x02,
        0x00,
        0x00,
        0x00,
        0x90,
        0x77,
        0x53,
        0xDE,
        0x00,
        0x00,
        0x00,
        0x0C,
        0x49,
        0x44,
        0x41,
        0x54,
        0x08,
        0xD7,
        0x63,
        0xF8,
        0xFF,
        0xFF,
        0xFF,
        0x00,
        0x05,
        0xFE,
        0x02,
        0xFE,
        0xDC,
        0xCC,
        0x59,
        0xE7,
        0x00,
        0x00,
        0x00,
        0x00,
        0x49,
        0x45,
        0x4E,
        0x44,
        0xAE,
        0x42,
        0x60,
        0x82,
    ]
)


def tiny_pdf() -> bytes:
    stream = b"BT /F1 12 Tf 72 720 Td (Q1. What is 2 plus 2?) Tj ET\n"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d >>\nstream\n%b\nendstream" % (len(stream), stream),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    parts = [b"%PDF-1.4\n"]
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(sum(len(p) for p in parts))
        parts.append(f"{i} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref_pos = sum(len(p) for p in parts)
    xref = [b"xref\n0 6\n0000000000 65535 f \n"]
    for off in offsets[1:]:
        xref.append(f"{off:010d} 00000 n \n".encode())
    trailer = (
        b"".join(xref)
        + b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n"
        + str(xref_pos).encode()
        + b"\n%%EOF\n"
    )
    return b"".join(parts) + trailer


def _upload_file(filename: str, content: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
        size=len(content),
    )


def _extracted_questions() -> ExtractedQuestionsList:
    return ExtractedQuestionsList(
        questions=[
            ExtractedQuestion(
                question_type="mcq4",
                question_text="What is kinetic energy?",
                option1="KE = mv²",
                option2="KE = ½mv²",
                option3="KE = mgh",
                option4="KE = Fd",
                correct_mcq_option=2,
                answer_text="KE = ½mv²",
            )
        ]
    )


class RecordingInstructorClient:
    def __init__(self):
        self.messages = None
        self.chat = MagicMock()
        self.chat.completions.create = self._create

    async def _create(self, model, messages, response_model, **kwargs):
        self.messages = messages
        return _extracted_questions()


class MockAsyncSupabaseClient:
    def __init__(self):
        self.jobs: dict[str, dict] = {}

    def table(self, name):
        return _MockQuery(name, self)


class _MockQuery:
    def __init__(self, table_name: str, client: MockAsyncSupabaseClient):
        self.table_name = table_name
        self.client = client
        self._op = "select"
        self._eq: dict = {}
        self._data = None

    def select(self, *args, **kwargs):
        self._op = "select"
        return self

    def eq(self, column, value, **kwargs):
        self._eq[column] = value
        return self

    def order(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def single(self):
        return self

    def insert(self, data):
        self._op = "insert"
        self._data = data
        return self

    def update(self, data):
        self._op = "update"
        self._data = data
        return self

    async def execute(self):
        result = MagicMock()
        if self.table_name == "activities" and self._op == "select":
            result.data = [{"id": ACTIVITY_ID, "user_id": USER_ID}]
        elif self.table_name == "qgen_drafts":
            result.data = [{"id": DRAFT_ID}]
        elif self.table_name == "qgen_draft_sections":
            result.data = [{"id": SECTION_ID, "position_in_draft": 0}] if self._op == "insert" else []
        elif self.table_name == "request_statuses":
            if self._op == "insert":
                job_id = self._data.get("job_id") or JOB_ID
                row = {**self._data, "job_id": job_id}
                self.client.jobs[job_id] = row
                result.data = [row]
            elif self._op == "update":
                job_id = self._eq.get("job_id")
                if job_id and job_id in self.client.jobs:
                    self.client.jobs[job_id].update(self._data)
                    result.data = [self.client.jobs[job_id]]
                else:
                    result.data = []
            else:
                job_id = self._eq.get("job_id")
                result.data = [self.client.jobs[job_id]] if job_id in self.client.jobs else []
        elif self.table_name == "gen_questions" and self._op == "insert":
            result.data = [{"id": QUESTION_ID}]
        else:
            result.data = []
        return result


@pytest.fixture
def recording_llm():
    client = RecordingInstructorClient()
    with patch("api.v1.qgen.extract_questions.service.get_async_client", return_value=client):
        yield client


@pytest.fixture
def extract_client(recording_llm):
    with patch("services.browser_service.async_playwright") as mock_ap_service:
        mock_p_instance = AsyncMock()
        mock_ap_service.return_value.start = AsyncMock(return_value=mock_p_instance)
        mock_browser = AsyncMock()
        mock_p_instance.chromium.launch = AsyncMock(return_value=mock_browser)
        mock_context = AsyncMock()
        mock_page = AsyncMock()
        mock_browser.new_context.return_value = mock_context
        mock_context.new_page.return_value = mock_page

        app = create_app()
        mock_db = MockAsyncSupabaseClient()
        with TestClient(app) as client:
            app.dependency_overrides[require_supabase_user] = lambda: MagicMock(id=USER_ID)

            async def get_mock_async_client():
                return mock_db

            app.dependency_overrides[get_async_supabase_client] = get_mock_async_client
            with (
                patch("api.v1.qgen.extract_questions.routes.check_user_has_credits", AsyncMock(return_value=True)),
                patch("api.v1.qgen.extract_questions.routes.deduct_user_credits", AsyncMock()),
            ):
                yield client, recording_llm


def _first_content_block(recording_llm) -> dict:
    assert recording_llm.messages is not None
    content = recording_llm.messages[0]["content"]
    assert isinstance(content, list)
    return content[0]


class TestProcessUploadedFile:
    @pytest.mark.asyncio
    async def test_image_becomes_image_url_block(self):
        upload = _upload_file("questions.png", TINY_PNG, "image/png")
        block = await process_uploaded_file(upload)

        assert block["type"] == "image_url"
        assert block["image_url"]["url"].startswith("data:image/png;base64,")

    @pytest.mark.asyncio
    async def test_pdf_becomes_file_block(self):
        pdf = tiny_pdf()
        upload = _upload_file("questions.pdf", pdf, "application/pdf")
        block = await process_uploaded_file(upload)

        assert block["type"] == "file"
        assert block["file"]["filename"] == "questions.pdf"
        assert block["file"]["file_data"].startswith("data:application/pdf;base64,")

    @pytest.mark.asyncio
    async def test_rejects_unsupported_type(self):
        upload = _upload_file(
            "notes.docx",
            b"not-a-pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        with pytest.raises(ExtractionValidationError, match="Unsupported file type"):
            await process_uploaded_file(upload)


class TestExtractQuestionsApi:
    def test_extracts_questions_from_image(self, extract_client):
        client, recording_llm = extract_client

        response = client.post(
            "/api/v1/qgen/extract_questions",
            data={
                "activity_id": ACTIVITY_ID,
                "qgen_draft_id": DRAFT_ID,
                "section_name": "From image",
            },
            files={"file": ("questions.png", BytesIO(TINY_PNG), "image/png")},
        )

        assert response.status_code == 202
        body = response.json()
        assert body["status"] == "processing"
        assert body["section_id"] == SECTION_ID
        assert body["job_id"] == JOB_ID

        status_response = client.get(f"/api/v1/qgen/extract_questions/status/{JOB_ID}")
        assert status_response.status_code == 200
        status_body = status_response.json()
        assert status_body["status"] == "success"
        assert status_body["questions_extracted"] == 1
        assert status_body["section_id"] == SECTION_ID

        media = _first_content_block(recording_llm)
        assert media["type"] == "image_url"
        assert media["image_url"]["url"].startswith("data:image/png;base64,")

    def test_extracts_questions_from_pdf(self, extract_client):
        client, recording_llm = extract_client
        pdf = tiny_pdf()

        response = client.post(
            "/api/v1/qgen/extract_questions",
            data={
                "activity_id": ACTIVITY_ID,
                "qgen_draft_id": DRAFT_ID,
                "section_name": "From pdf",
            },
            files={"file": ("questions.pdf", BytesIO(pdf), "application/pdf")},
        )

        assert response.status_code == 202
        body = response.json()
        assert body["status"] == "processing"
        assert body["section_id"] == SECTION_ID
        assert body["job_id"] == JOB_ID

        status_response = client.get(f"/api/v1/qgen/extract_questions/status/{JOB_ID}")
        assert status_response.status_code == 200
        assert status_response.json()["status"] == "success"

        media = _first_content_block(recording_llm)
        assert media["type"] == "file"
        assert media["file"]["filename"] == "questions.pdf"
        assert media["file"]["file_data"].startswith("data:application/pdf;base64,")
        assert "image_url" not in media
