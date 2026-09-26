import { test, expect } from "@playwright/test";
import { loginAs, logOut } from "../../helpers/auth";
import {
  JOURNEY_MCQS,
  assignStudentByName,
  authorDraftWithMcqs,
  openAttemptFromCard,
  openPaperView,
  proceedPastInstructionsIfPresent,
  publishDraft,
  testCard,
  uniqueDraftName,
} from "../helpers";
import { workerPair } from "../seed";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const EXPLANATION = "E2E revealed explanation";

test("explanation figure stays hidden until the teacher reveals answers", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);

  const { teacher, student } = workerPair(testInfo);
  await loginAs(page, teacher.email, teacher.password);
  const name = uniqueDraftName("Explanation figure");
  await authorDraftWithMcqs(page, name);
  await openPaperView(page);
  await page.getByRole("button", { name: "Edit explanation" }).click();
  await page.getByLabel("explanation text").fill(EXPLANATION);
  await page.getByLabel("explanation image file").setInputFiles({
    name: "explanation.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("img", { name: "Explanation figure" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("link", { name: "Back to test" }).click();
  await assignStudentByName(page, student.name);
  await publishDraft(page);
  const editorUrl = page.url();

  await logOut(page);
  await loginAs(page, student.email, student.password);
  await openAttemptFromCard(page, name);
  await proceedPastInstructionsIfPresent(page);
  await expect(page.getByText(EXPLANATION)).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Explanation figure" })).toHaveCount(0);
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
  await expect(page.getByText(EXPLANATION)).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Explanation figure" })).toHaveCount(0);

  await logOut(page);
  await loginAs(page, teacher.email, teacher.password);
  await page.goto(editorUrl);
  await page.getByRole("button", { name: "Close paper" }).click();
  await page.getByRole("checkbox", { name: "Students can review past attempts" }).check();
  await page.getByRole("checkbox", { name: "Students can see correct answers" }).check();
  await page.getByRole("button", { name: "Save paper" }).click();

  await logOut(page);
  await loginAs(page, student.email, student.password);
  await testCard(page, name).getByRole("button", { name: "View attempts" }).click();
  await page.getByRole("link", { name: "View result" }).click();
  await expect(page.getByText(EXPLANATION)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("img", { name: "Explanation figure" })).toBeVisible();
});
