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
import { STUDENT_3, TEACHER_2 } from "../seed";

test("past attempts and correct answers stay hidden until the teacher allows them", async ({
  page,
}) => {
  test.setTimeout(120_000);

  await loginAs(page, TEACHER_2.email, TEACHER_2.password);
  const name = uniqueDraftName("Review flags");
  await authorDraftWithMcqs(page, name);
  await assignStudentByName(page, STUDENT_3.name);
  await publishDraft(page);
  const editorUrl = page.url();

  await logOut(page);
  await loginAs(page, STUDENT_3.email, STUDENT_3.password);
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
  await loginAs(page, TEACHER_2.email, TEACHER_2.password);
  await page.goto(editorUrl);
  await page.getByRole("button", { name: "Close paper" }).click();
  await page.getByRole("checkbox", { name: "Students can review past attempts" }).check();
  await page.getByRole("checkbox", { name: "Students can see correct answers" }).check();
  await page.getByRole("button", { name: "Save paper" }).click();

  await logOut(page);
  await loginAs(page, STUDENT_3.email, STUDENT_3.password);
  await expect(page.getByRole("heading", { name: "Past tests" })).toBeVisible({
    timeout: 15_000,
  });
  await testCard(page, name).getByRole("button", { name: "View attempts" }).click();
  await page.getByRole("link", { name: "View result" }).click();
  await expect(page.getByText("Correct").first()).toBeVisible({ timeout: 15_000 });
});
