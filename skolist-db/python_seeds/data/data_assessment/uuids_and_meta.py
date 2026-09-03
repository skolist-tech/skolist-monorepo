"""Stable assessment seed IDs. All UUIDs are minted here via seed_uuid()."""


def seed_uuid(n: int) -> str:
    if not 0 <= n <= 999_999_999_999:
        raise ValueError(f"seed_uuid out of range: {n}")
    return f"00000000-0000-0000-0000-{n:012d}"


CREATED_AT = "2026-08-18T00:00:00+00:00"

# Tests (110-115)
TEST_JEE_MAIN_1 = seed_uuid(110)  # teacher1, published, nobody started
TEST_JEE_MAIN_2 = seed_uuid(111)  # teacher2, published, mixed start (s1 done, s2 in progress, s3 not started)
TEST_NEET_OPEN = seed_uuid(112)  # teacher2, published, nobody started
TEST_NEET_LIVE = seed_uuid(113)  # teacher1, published, all started; s2 has a retake
TEST_ADV_DRAFT = seed_uuid(114)  # teacher1, draft / in making
TEST_ADV_CLOSED = seed_uuid(115)  # teacher2, closed, attempted by all 3

ASSIGNED_TEST_IDS = (
    TEST_JEE_MAIN_1,
    TEST_JEE_MAIN_2,
    TEST_NEET_OPEN,
    TEST_NEET_LIVE,
    TEST_ADV_CLOSED,
)

# Sections (120-133)
SECTION_MAIN_1_PHY = seed_uuid(120)
SECTION_MAIN_1_CHEM = seed_uuid(121)
SECTION_MAIN_1_MATH = seed_uuid(122)
SECTION_MAIN_2_PHY = seed_uuid(123)
SECTION_MAIN_2_CHEM = seed_uuid(124)
SECTION_MAIN_2_MATH = seed_uuid(125)
SECTION_NEET_OPEN_PHY = seed_uuid(126)
SECTION_NEET_OPEN_CHEM = seed_uuid(127)
SECTION_NEET_OPEN_BIO = seed_uuid(128)
SECTION_NEET_LIVE_PHY = seed_uuid(129)
SECTION_NEET_LIVE_CHEM = seed_uuid(130)
SECTION_NEET_LIVE_BIO = seed_uuid(131)
SECTION_ADV_DRAFT_PHY = seed_uuid(132)
SECTION_ADV_CLOSED_PHY = seed_uuid(133)

# Questions (140-159)
Q_MAIN_1_PHY_MCQ = seed_uuid(140)
Q_MAIN_1_PHY_NUM = seed_uuid(141)
Q_MAIN_1_CHEM_MCQ = seed_uuid(142)
Q_MAIN_1_MATH_INT = seed_uuid(143)
Q_MAIN_2_PHY_MCQ = seed_uuid(144)
Q_MAIN_2_PHY_NUM = seed_uuid(145)
Q_MAIN_2_CHEM_MCQ = seed_uuid(146)
Q_MAIN_2_MATH_INT = seed_uuid(147)
Q_NEET_OPEN_PHY = seed_uuid(148)
Q_NEET_OPEN_CHEM = seed_uuid(149)
Q_NEET_OPEN_BIO = seed_uuid(150)
Q_NEET_LIVE_PHY = seed_uuid(151)
Q_NEET_LIVE_CHEM = seed_uuid(152)
Q_NEET_LIVE_BIO = seed_uuid(153)
Q_ADV_DRAFT_PASSAGE = seed_uuid(154)
Q_ADV_DRAFT_MSQ = seed_uuid(155)
Q_ADV_DRAFT_INT = seed_uuid(156)
Q_ADV_CLOSED_PASSAGE = seed_uuid(157)
Q_ADV_CLOSED_MSQ = seed_uuid(158)
Q_ADV_CLOSED_INT = seed_uuid(159)

# Attempts (200-208)
ATTEMPT_NEET_LIVE_S1 = seed_uuid(200)  # student1, attempt 1, in_progress
ATTEMPT_NEET_LIVE_S2 = seed_uuid(201)  # student2, attempt 1, graded (weaker)
ATTEMPT_NEET_LIVE_S3 = seed_uuid(202)  # student3, attempt 1, graded
ATTEMPT_ADV_CLOSED_S1 = seed_uuid(203)  # graded
ATTEMPT_ADV_CLOSED_S2 = seed_uuid(204)  # graded
ATTEMPT_ADV_CLOSED_S3 = seed_uuid(205)  # graded
ATTEMPT_MAIN_2_S1 = seed_uuid(206)  # student1, graded complete
ATTEMPT_MAIN_2_S2 = seed_uuid(207)  # student2, in_progress; student3 has none
ATTEMPT_NEET_LIVE_S2_RETAKE = seed_uuid(208)  # student2, attempt 2, graded complete

STUDENT_KEYS = ("student1", "student2", "student3")
ASSIGNEE_ID_START = 400
RESPONSE_ID_START = 250
