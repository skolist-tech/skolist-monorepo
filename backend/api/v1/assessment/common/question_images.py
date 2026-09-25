"""Private storage for question and option images.

Rows keep a `storage:<bucket>/<path>` reference instead of a public URL.
Payloads leaving the API replace those references with short-lived signed URLs.
"""

from supabase import Client

from config.settings import SUPABASE_PUBLIC_URL, SUPABASE_URL

QUESTION_IMAGES_BUCKET = "assessment_question_images"
STORAGE_PREFIX = f"storage:{QUESTION_IMAGES_BUCKET}/"
SIGNED_URL_SECONDS = 60 * 60

IMAGE_URL_COLUMNS = (
    "image_url",
    "option1_image_url",
    "option2_image_url",
    "option3_image_url",
    "option4_image_url",
)


def storage_ref(object_path: str) -> str:
    return f"{STORAGE_PREFIX}{object_path}"


def object_path(value: str | None) -> str | None:
    if value and value.startswith(STORAGE_PREFIX):
        return value[len(STORAGE_PREFIX) :]
    return None


def public_signed_url(url: str, internal_base: str | None, public_base: str | None) -> str:
    internal = (internal_base or "").rstrip("/")
    public = (public_base or "").rstrip("/")
    if internal and public and internal != public and url.startswith(internal):
        return public + url[len(internal) :]
    return url


def sign_question_images(supabase: Client, questions: list[dict]) -> list[dict]:
    paths = {
        path for question in questions for column in IMAGE_URL_COLUMNS if (path := object_path(question.get(column)))
    }
    if not paths:
        return questions
    signed = supabase.storage.from_(QUESTION_IMAGES_BUCKET).create_signed_urls(list(paths), SIGNED_URL_SECONDS)
    by_path = {
        item["path"]: public_signed_url(item["signedURL"], SUPABASE_URL, SUPABASE_PUBLIC_URL)
        for item in signed
        if not item.get("error")
    }
    for question in questions:
        for column in IMAGE_URL_COLUMNS:
            path = object_path(question.get(column))
            if path:
                question[column] = by_path.get(path)
    return questions


def delete_stored_image(supabase: Client, value: str | None) -> None:
    path = object_path(value)
    if path:
        supabase.storage.from_(QUESTION_IMAGES_BUCKET).remove([path])
