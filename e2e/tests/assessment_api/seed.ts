/**
 * Credentials and test names from skolist-db python assessment seeds.
 * Keep in sync with:
 *   python_seeds/data/_002_data_user.py
 *   python_seeds/data/data_assessment/tests.py
 */

export const SEED_PASSWORD =
  process.env.ASSESSMENT_PASSWORD ?? "password123";

export const TEACHER_1 = {
  email: process.env.ASSESSMENT_TEACHER_EMAIL ?? "teacher1@seed.skolist.com",
  password: SEED_PASSWORD,
  name: "Teacher 1",
};

export const TEACHER_2 = {
  email: process.env.ASSESSMENT_TEACHER_2_EMAIL ?? "teacher2@seed.skolist.com",
  password: SEED_PASSWORD,
  name: "Teacher 2",
};

export const STUDENT_1 = {
  email: process.env.ASSESSMENT_STUDENT_EMAIL ?? "student1@seed.skolist.com",
  password: SEED_PASSWORD,
  name: "Student 1",
};

export const STUDENT_2 = {
  email: process.env.ASSESSMENT_STUDENT_2_EMAIL ?? "student2@seed.skolist.com",
  password: SEED_PASSWORD,
  name: "Student 2",
};

export const STUDENT_3 = {
  email: process.env.ASSESSMENT_STUDENT_3_EMAIL ?? "student3@seed.skolist.com",
  password: SEED_PASSWORD,
  name: "Student 3",
};

/** Stable titles + IDs from data_assessment/tests.py / uuids_and_meta.py */
export const TESTS = {
  jeeMain1: {
    id: "00000000-0000-0000-0000-000000000110",
    name: "JEE Main Mock Test 1",
  },
  jeeMain2: {
    id: "00000000-0000-0000-0000-000000000111",
    name: "JEE Main Mock Test 2",
  },
  neetOpen: {
    id: "00000000-0000-0000-0000-000000000112",
    name: "NEET Mock Test (Open)",
  },
  neetLive: {
    id: "00000000-0000-0000-0000-000000000113",
    name: "NEET Mock Test (In progress)",
  },
  advDraft: {
    id: "00000000-0000-0000-0000-000000000114",
    name: "JEE Advanced Paper (Draft)",
  },
  advClosed: {
    id: "00000000-0000-0000-0000-000000000115",
    name: "JEE Advanced Paper (Closed)",
  },
} as const;

/** Published + assigned to all 3 students (draft is teacher-only). */
export const STUDENT_VISIBLE_PUBLISHED = [
  TESTS.jeeMain1.name,
  TESTS.jeeMain2.name,
  TESTS.neetOpen.name,
  TESTS.neetLive.name,
] as const;

/**
 * Local full-length NTA mocks from python_seeds/data/_local_papers/
 * (gitignored; seeded via _local_seed_full_nta_papers.py).
 */
export const FULL_MOCKS = {
  jeeMain: {
    id: "00000000-0000-0000-0000-000000001000",
    name: "JEE Main Full Mock (Public Archive)",
  },
  neet: {
    id: "00000000-0000-0000-0000-000000002000",
    name: "NEET UG Full Mock (Public Archive)",
  },
  jeeAdvanced: {
    id: "00000000-0000-0000-0000-000000003000",
    name: "JEE Advanced Paper-1 Full Mock (Public Archive)",
  },
} as const;
