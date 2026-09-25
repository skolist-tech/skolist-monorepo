import pytest
from fastapi import HTTPException

from api.v1.assessment.common.question_images import (
    object_path,
    public_signed_url,
    sign_question_images,
    storage_ref,
)
from api.v1.assessment.teacher.question_images import _slot_columns


class _FakeBucket:
    def __init__(self):
        self.signed_paths: list[str] = []

    def create_signed_urls(self, paths, expires_in):
        self.signed_paths = sorted(paths)
        return [{"path": path, "signedURL": f"https://signed/{path}?token=t", "error": None} for path in paths]


class _FakeStorage:
    def __init__(self, bucket):
        self.bucket = bucket

    def from_(self, _bucket_id):
        return self.bucket


class _FakeClient:
    def __init__(self):
        self.bucket = _FakeBucket()
        self.storage = _FakeStorage(self.bucket)


def test_slot_columns_map_stem_and_options():
    assert _slot_columns("stem") == ("image_url", "svg_image_code")
    assert _slot_columns("option3") == ("option3_image_url", "option3_svg_image_code")


def test_unknown_slot_is_rejected():
    with pytest.raises(HTTPException) as exc:
        _slot_columns("option5")
    assert exc.value.status_code == 400


def test_storage_ref_round_trip():
    ref = storage_ref("t1/q1/stem-a.png")
    assert object_path(ref) == "t1/q1/stem-a.png"
    assert object_path("https://example.com/public.png") is None


def test_sign_replaces_only_private_refs():
    client = _FakeClient()
    questions = [
        {"image_url": storage_ref("t1/q1/stem.png"), "option2_image_url": "https://public/seed.png"},
        {"option1_image_url": storage_ref("t1/q2/option1.png")},
    ]
    sign_question_images(client, questions)
    assert questions[0]["image_url"] == "https://signed/t1/q1/stem.png?token=t"
    assert questions[0]["option2_image_url"] == "https://public/seed.png"
    assert questions[1]["option1_image_url"] == "https://signed/t1/q2/option1.png?token=t"
    assert client.bucket.signed_paths == ["t1/q1/stem.png", "t1/q2/option1.png"]


def test_public_signed_url_swaps_docker_origin_for_browser_origin():
    url = "http://host.docker.internal:54321/storage/v1/object/sign/b/p.png?token=t"
    assert (
        public_signed_url(url, "http://host.docker.internal:54321", "http://127.0.0.1:54321/")
        == "http://127.0.0.1:54321/storage/v1/object/sign/b/p.png?token=t"
    )
    assert public_signed_url(url, "http://host.docker.internal:54321", None) == url


def test_sign_skips_storage_when_no_private_refs():
    client = _FakeClient()
    questions = [{"image_url": "https://public/seed.png"}]
    assert sign_question_images(client, questions) == questions
    assert client.bucket.signed_paths == []
