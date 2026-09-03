"""Assessment schema rows used by 004_seed_assessment.py.

created_by / student_id / org_id / user_id are filled at seed time from
_001_data_orgs.py and _002_data_user.py. Tests use created_by_key;
attempts and assignees use student_key.

After the enum-to-text correction, section.subject may only be 'other' or NULL.
Section names carry Physics / Chemistry / Maths / Biology.
"""

from .data_assessment.uuids_and_meta import (
    ASSIGNED_TEST_IDS,
    ATTEMPT_ADV_CLOSED_S1,
    ATTEMPT_NEET_LIVE_S1,
    CREATED_AT,
    Q_NEET_LIVE_PHY,
    TEST_ADV_CLOSED,
    TEST_ADV_DRAFT,
    TEST_JEE_MAIN_1,
    TEST_JEE_MAIN_2,
    TEST_NEET_LIVE,
    TEST_NEET_OPEN,
)
from .data_assessment.attempts import ATTEMPTS
from .data_assessment.questions import QUESTIONS
from .data_assessment.responses import RESPONSES
from .data_assessment.sections import SECTIONS
from .data_assessment.test_assignees import TEST_ASSIGNEES
from .data_assessment.tests import TESTS

__all__ = [
    "CREATED_AT",
    "TEST_JEE_MAIN_1",
    "TEST_JEE_MAIN_2",
    "TEST_NEET_OPEN",
    "TEST_NEET_LIVE",
    "TEST_ADV_DRAFT",
    "TEST_ADV_CLOSED",
    "ASSIGNED_TEST_IDS",
    "ATTEMPT_NEET_LIVE_S1",
    "ATTEMPT_ADV_CLOSED_S1",
    "Q_NEET_LIVE_PHY",
    "TESTS",
    "SECTIONS",
    "QUESTIONS",
    "ATTEMPTS",
    "RESPONSES",
    "TEST_ASSIGNEES",
]
