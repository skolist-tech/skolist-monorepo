import { test, expect } from "@playwright/test";
import { loginAs, logOut } from "../../helpers/auth";
import {
  JOURNEY_MCQS,
  assignStudentByName,
  authorDraftWithMcqs,
  proceedPastInstructionsIfPresent,
  publishDraft,
  openAttemptFromCard,
  testCard,
  uniqueDraftName,
} from "../helpers";
import { workerPair } from "../seed";

test("teacher authors and publishes a paper, then a student sits it and the teacher reviews", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);

  const { teacher, student } = workerPair(testInfo);
  await loginAs(page, teacher.email, teacher.password);
  await expect(page).toHaveURL(/\/teacher\/tests/);

  const name = uniqueDraftName("Sit authored");
  await authorDraftWithMcqs(page, name);
  await assignStudentByName(page, student.name);
  await publishDraft(page);
  const editorUrl = page.url();

  await logOut(page);
  await loginAs(page, student.email, student.password);
  await expect(page).toHaveURL(/\/student\/tests/);
  await expect(
    page.getByRole("heading", { name: "Assigned tests" })
  ).toBeVisible();

  const card = testCard(page, name);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await openAttemptFromCard(page, name);
  await expect(page).toHaveURL(/\/student\/attempts\/.+/);
  await proceedPastInstructionsIfPresent(page);

  for (const question of JOURNEY_MCQS) {
    await expect(page.getByText(question.stem)).toBeVisible({
      timeout: 15_000,
    });
    await page
      .locator('input[type="radio"]')
      .nth(question.correctIndex - 1)
      .check();
    await page.getByRole("button", { name: "Save & Next" }).click();
  }

  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Yes, Submit" }).click();
  await expect(page).toHaveURL(/\/student\/attempts\/.+\/result/, {
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Score 8\s*\/\s*8/)).toBeVisible();
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/student\/tests$/);
  await expect(
    page.getByRole("heading", { name: "Assigned tests" })
  ).toBeVisible();

  await logOut(page);
  await loginAs(page, teacher.email, teacher.password);
  await page.goto(editorUrl);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Attempts" }).click();
  await expect(page.getByText(/graded/i).first()).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("link", { name: "Review" }).click();
  await expect(page).toHaveURL(/\/teacher\/tests\/.+\/attempts\/.+/);
  await expect(page.getByText(/score\s+8\s*\/\s*8/i)).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/teacher\/tests\/[0-9a-f-]{36}$/i);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
});
