from .uuids_and_meta import (
    BLUEPRINT_FULL_SYLLABUS,
    BLUEPRINT_SECTION_CHEMISTRY,
    BLUEPRINT_SECTION_PHYSICS,
)

BLUEPRINT_SECTIONS = [
    {
        "id": BLUEPRINT_SECTION_PHYSICS,
        "blueprint_id": BLUEPRINT_FULL_SYLLABUS,
        "name": "Physics",
        "position": 1,
        "subject": "other",
    },
    {
        "id": BLUEPRINT_SECTION_CHEMISTRY,
        "blueprint_id": BLUEPRINT_FULL_SYLLABUS,
        "name": "Chemistry",
        "position": 2,
        "subject": "other",
    },
]
