from .uuids_and_meta import (
    CREATED_AT,
    SECTION_ADV_CLOSED_PHY,
    SECTION_ADV_DRAFT_PHY,
    SECTION_MAIN_1_CHEM,
    SECTION_MAIN_1_MATH,
    SECTION_MAIN_1_PHY,
    SECTION_MAIN_2_CHEM,
    SECTION_MAIN_2_MATH,
    SECTION_MAIN_2_PHY,
    SECTION_NEET_LIVE_BIO,
    SECTION_NEET_LIVE_CHEM,
    SECTION_NEET_LIVE_PHY,
    SECTION_NEET_OPEN_BIO,
    SECTION_NEET_OPEN_CHEM,
    SECTION_NEET_OPEN_PHY,
    TEST_ADV_CLOSED,
    TEST_ADV_DRAFT,
    TEST_JEE_MAIN_1,
    TEST_JEE_MAIN_2,
    TEST_NEET_LIVE,
    TEST_NEET_OPEN,
)


def _section(
    *,
    id: str,
    test_id: str,
    name: str,
    position: int,
    correct_marks: int = 4,
    negative_marks: int = 1,
) -> dict:
    return {
        "id": id,
        "test_id": test_id,
        "name": name,
        "position": position,
        "correct_marks": correct_marks,
        "negative_marks": negative_marks,
        "created_at": CREATED_AT,
        "updated_at": CREATED_AT,
        "subject": "other",
    }


def _pcm(test_id: str, phy: str, chem: str, math: str) -> list[dict]:
    return [
        _section(id=phy, test_id=test_id, name="Physics", position=1),
        _section(id=chem, test_id=test_id, name="Chemistry", position=2),
        _section(id=math, test_id=test_id, name="Mathematics", position=3, negative_marks=0),
    ]


def _pcb(test_id: str, phy: str, chem: str, bio: str) -> list[dict]:
    return [
        _section(id=phy, test_id=test_id, name="Physics", position=1),
        _section(id=chem, test_id=test_id, name="Chemistry", position=2),
        _section(id=bio, test_id=test_id, name="Biology", position=3),
    ]


SECTIONS = [
    *_pcm(TEST_JEE_MAIN_1, SECTION_MAIN_1_PHY, SECTION_MAIN_1_CHEM, SECTION_MAIN_1_MATH),
    *_pcm(TEST_JEE_MAIN_2, SECTION_MAIN_2_PHY, SECTION_MAIN_2_CHEM, SECTION_MAIN_2_MATH),
    *_pcb(TEST_NEET_OPEN, SECTION_NEET_OPEN_PHY, SECTION_NEET_OPEN_CHEM, SECTION_NEET_OPEN_BIO),
    *_pcb(TEST_NEET_LIVE, SECTION_NEET_LIVE_PHY, SECTION_NEET_LIVE_CHEM, SECTION_NEET_LIVE_BIO),
    _section(
        id=SECTION_ADV_DRAFT_PHY,
        test_id=TEST_ADV_DRAFT,
        name="Physics Paragraph",
        position=1,
        negative_marks=2,
    ),
    _section(
        id=SECTION_ADV_CLOSED_PHY,
        test_id=TEST_ADV_CLOSED,
        name="Physics Paragraph",
        position=1,
        negative_marks=2,
    ),
]
