import { expect, type Page } from "@playwright/test";

/**
 * Nearest card container for a titled heading.
 * Avoids the outer grid which also matches "has heading + has Open".
 */
export function testCard(page: Page, title: string) {
  return page
    .getByRole("heading", { name: title, exact: true })
    .locator(
      "xpath=ancestor::div[.//a[normalize-space()='Open'] or .//button[normalize-space()='Start' or normalize-space()='Continue']][1]"
    );
}

export function uniqueDraftName(prefix = "E2E draft") {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

/** Create a named draft from the teacher tests list and land on the editor. */
export async function createNamedDraft(page: Page, name: string) {
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/teacher\/tests\/[0-9a-f-]{36}/i, {
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: "Sections" })).toBeVisible();
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

export async function addSection(page: Page, heading = /Physics/) {
  await page.getByRole("button", { name: "Add section" }).click();
  await expect(page.getByRole("heading", { name: heading })).toBeVisible({
    timeout: 15_000,
  });
}

export async function addQuestion(page: Page) {
  const edits = page.getByRole("button", { name: "Edit" });
  const before = await edits.count();
  await page.getByRole("button", { name: "Add question" }).click();
  await expect
    .poll(async () => edits.count(), { timeout: 15_000 })
    .toBeGreaterThan(before);
}

export async function editMcqAt(page: Page, index: number, draft: McqDraft) {
  await page.getByRole("button", { name: "Edit" }).nth(index).click();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  await page.getByLabel("Question").fill(draft.stem);
  for (let i = 0; i < draft.options.length; i += 1) {
    await page.getByLabel(`Option ${i + 1}`).fill(draft.options[i]);
  }
  await page
    .getByRole("radio", { name: "Correct" })
    .nth(draft.correctIndex - 1)
    .check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(draft.stem)).toBeVisible({ timeout: 15_000 });
}

/** From the teacher tests list: named draft, one section, edited MCQs. */
export async function authorDraftWithMcqs(
  page: Page,
  name: string,
  questions: McqDraft[] = JOURNEY_MCQS
) {
  await createNamedDraft(page, name);
  await addSection(page);
  const edits = page.getByRole("button", { name: "Edit" });
  for (let index = 0; index < questions.length; index += 1) {
    if ((await edits.count()) <= index) {
      await addQuestion(page);
    }
    await editMcqAt(page, index, questions[index]);
  }
}

export async function assignStudentByName(page: Page, studentName: string) {
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
  await expect(page.getByText(/published/i).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
}
