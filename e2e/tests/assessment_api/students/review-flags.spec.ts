import { test, expect } from "@playwright/test";
import { loginAs, logOut } from "../../helpers/auth";
import {
  JOURNEY_MCQS,
  assignStudentByName,
  authorDraftWithMcqs,
  openAttemptFromCard,
  proceedPastInstructionsIfPresent,
  testCard,
  publishDraft,
  uniqueDraftName,
} from "../helpers";
import { workerPair } from "../seed";

test("past attempts and correct answers stay hidden until the teacher allows them", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);

  const { teacher, student } = workerPair(testInfo);
  await loginAs(page, teacher.email, teacher.password);
  const name = uniqueDraftName("Review flags");
  await authorDraftWithMcqs(page, name);
  await assignStudentByName(page, student.name);
  await publishDraft(page);
  const editorUrl = page.url();

  await logOut(page);
  await loginAs(page, student.email, student.password);
  await openAttemptFromCard(page, name);
  await proceedPastInstructionsIfPresent(page);
  for (const question of JOURNEY_MCQS) {
    await page
      .locator('input[type="radio"]')
      .nth(question.correctIndex - 1)
      .check();
    await page.getByRole("button", { name: "Save & Next" }).click();
  }
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Yes, Submit" }).click();
  await expect(page.getByText("Correct answers are hidden").first()).toBeVisible({
    timeout: 15_000,
  });

  await logOut(page);
  await loginAs(page, teacher.email, teacher.password);
  await page.goto(editorUrl);
  await page.getByRole("button", { name: "Close paper" }).click();
  await page.getByRole("checkbox", { name: "Students can review past attempts" }).check();
  await page.getByRole("checkbox", { name: "Students can see correct answers" }).check();
  await page.getByRole("button", { name: "Save paper" }).click();

  await logOut(page);
  await loginAs(page, student.email, student.password);
  await expect(page.getByRole("heading", { name: "Past tests" })).toBeVisible({
    timeout: 15_000,
  });
  await testCard(page, name).getByRole("button", { name: "View attempts" }).click();
  await page.getByRole("link", { name: "View result" }).click();
  await expect(page.getByText("Correct").first()).toBeVisible({ timeout: 15_000 });
});
