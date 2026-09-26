import { expect, type Page } from "@playwright/test";

/**
 * Nearest card container for a titled heading.
 * Avoids the outer grid which also matches "has heading + has Open".
 */
export function testCard(page: Page, title: string) {
  return page
    .getByRole("heading", { name: title, exact: true })
    .locator(
      "xpath=ancestor::div[.//a[normalize-space()='Open'] or .//button[normalize-space()='Start' or normalize-space()='Continue' or normalize-space()='View attempts']][1]"
    );
}

export function uniqueDraftName(prefix = "E2E draft") {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

/** Clone the seeded full-syllabus blueprint and rename it on the paper view. */
export async function createNamedDraft(page: Page, name: string) {
  await page.getByRole("link", { name: "Create test" }).click();
  await page.getByRole("button", { name: "Full Syllabus Test" }).click();
  await page.getByRole("button", { name: "Full Syllabus Sample" }).click();
  await expect(page).toHaveURL(/\/teacher\/tests\/[0-9a-f-]{36}/i, {
    timeout: 15_000,
  });
  await page.getByLabel("Test name").fill(name);
  await page.getByRole("button", { name: "Save paper" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
    timeout: 15_000,
  });
}

export async function proceedPastInstructionsIfPresent(page: Page) {
  const instructions = page.getByRole("heading", {
    name: "General Instructions",
  });
  try {
    await instructions.waitFor({ state: "visible", timeout: 8_000 });
  } catch {
    return;
  }
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Proceed" }).click();
}

export type McqDraft = {
  stem: string;
  options: [string, string, string, string];
  /** 1-based option index that is marked correct. */
  correctIndex: 1 | 2 | 3 | 4;
};

/** Two MCQs with known keys, used by author → attempt journeys. */
export const JOURNEY_MCQS: McqDraft[] = [
  {
    stem: "E2E journey: what is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctIndex: 2,
  },
  {
    stem: "E2E journey: capital of France?",
    options: ["London", "Berlin", "Paris", "Rome"],
    correctIndex: 3,
  },
];

/** Rendered stem text only, not the edit textarea. */
export function renderedStem(page: Page, text: string) {
  return page.locator("span").filter({ hasText: text });
}

/** From the Question paper tab, open the student-style paper view. */
export async function openPaperView(page: Page) {
  await page.getByRole("link", { name: "Open question paper" }).click();
  await expect(page).toHaveURL(/\/teacher\/tests\/[0-9a-f-]{36}\/paper$/i);
  await expect(page.getByRole("button", { name: "Edit question" })).toBeVisible(
    { timeout: 15_000 }
  );
}

export async function editStem(page: Page, stem: string) {
  await page.getByRole("button", { name: "Edit question" }).click();
  await page.getByLabel("question text").fill(stem);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(renderedStem(page, stem)).toBeVisible({ timeout: 15_000 });
}

/** On the paper view: edit the current question's stem, options, and key. */
export async function editMcq(page: Page, draft: McqDraft) {
  await editStem(page, draft.stem);
  for (let i = 0; i < draft.options.length; i += 1) {
    const letter = String.fromCharCode(65 + i);
    await page.getByRole("button", { name: `Edit option ${letter}` }).click();
    await page.getByLabel(`option ${letter} text`).fill(draft.options[i]);
    if (i + 1 === draft.correctIndex) {
      await page.getByLabel("Correct answer").check();
    }
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("button", { name: `Edit option ${letter}` })
    ).toBeVisible({ timeout: 15_000 });
  }
}

/** Clone a blueprint draft, then edit each question in the paper view. */
export async function authorDraftWithMcqs(
  page: Page,
  name: string,
  questions: McqDraft[] = JOURNEY_MCQS
) {
  await createNamedDraft(page, name);
  await openPaperView(page);
  for (let index = 0; index < questions.length; index += 1) {
    if (index > 0) await page.getByRole("button", { name: "Next" }).click();
    await editMcq(page, questions[index]);
  }
  await page.getByRole("link", { name: "Back to test" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
    timeout: 15_000,
  });
}

export async function assignStudentByName(page: Page, studentName: string) {
  await page.getByRole("button", { name: "Students" }).click();
  const search = page.getByRole("textbox", { name: "Search students" });
  await search.fill(studentName);
  const match = page
    .getByRole("listbox", { name: "Search students" })
    .getByRole("button", { name: new RegExp(studentName) });
  await expect(match).toBeVisible({ timeout: 15_000 });
  await match.click();
  await expect(page.getByText(studentName).first()).toBeVisible({
    timeout: 15_000,
  });
}

export async function publishDraft(page: Page) {
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText(/· published ·/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Close paper" })).toBeVisible();
}

export async function closePublishedPaper(page: Page) {
  await page.getByRole("button", { name: "Close paper" }).click();
  await expect(page.getByText(/· closed ·/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Close paper" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
}

export async function openAttemptFromCard(page: Page, title: string) {
  await testCard(page, title).getByRole("button", { name: "View attempts" }).click();
  const start = page.getByRole("button", { name: "Start" });
  const continueLink = page.getByRole("link", { name: "Continue" }).first();
  await expect(start.or(continueLink).first()).toBeVisible({ timeout: 15_000 });
  if (await start.isVisible()) {
    await start.click();
    return;
  }
  await continueLink.click();
}

export async function goBackToTeacherTests(page: Page) {
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/teacher\/tests$/);
  await expect(page.getByRole("heading", { name: "Tests" })).toBeVisible();
}

export async function openDeleteDialog(page: Page, title: string) {
  await testCard(page, title).getByRole("button", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Delete this paper?" })
  ).toBeVisible();
  return dialog;
}
