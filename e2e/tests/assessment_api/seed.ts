/**
 * Credentials and test names from skolist-db python assessment seeds.
 * Keep in sync with:
 *   python_seeds/data/_002_data_user.py
 *   python_seeds/data/data_assessment/tests.py
 */

export const SEED_PASSWORD =
  process.env.ASSESSMENT_PASSWORD ?? "password123";

export const SEED_ORG_CODE = process.env.ASSESSMENT_ORG_CODE ?? "SEEDOR";

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

/** One teacher + student pair per Playwright worker. Same count as python seeds. */
export const E2E_WORKER_COUNT = 8;

export type SeedUser = {
  email: string;
  password: string;
  name: string;
};

export const E2E_WORKER_PAIRS: { teacher: SeedUser; student: SeedUser }[] =
  Array.from({ length: E2E_WORKER_COUNT }, (_, index) => {
    const n = index + 1;
    return {
      teacher: {
        email: `e2e-teacher-${n}@seed.skolist.com`,
        password: SEED_PASSWORD,
        name: `E2E Teacher ${n}`,
      },
      student: {
        email: `e2e-student-${n}@seed.skolist.com`,
        password: SEED_PASSWORD,
        name: `E2E Student ${n}`,
      },
    };
  });

/** Teacher and student owned by this Playwright worker (0–7). */
export function workerPair(testInfo: { parallelIndex: number }) {
  const pair = E2E_WORKER_PAIRS[testInfo.parallelIndex];
  if (!pair) {
    throw new Error(
      `No seed pair for worker parallelIndex ${testInfo.parallelIndex}. Keep --workers <= ${E2E_WORKER_COUNT} and re-seed _002_data_user.py.`
    );
  }
  return pair;
}

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
