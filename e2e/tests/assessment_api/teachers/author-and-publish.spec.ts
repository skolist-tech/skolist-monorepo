import { test, expect } from "@playwright/test";
import { loginAs } from "../../helpers/auth";
import {
  JOURNEY_MCQS,
  authorDraftWithMcqs,
  openPaperView,
  renderedStem,
  publishDraft,
  uniqueDraftName,
} from "../helpers";
import { workerPair } from "../seed";

test("teacher creates a draft, writes questions, edits them, and publishes", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);

  const { teacher } = workerPair(testInfo);
  await loginAs(page, teacher.email, teacher.password);
  await expect(page).toHaveURL(/\/teacher\/tests/);

  const name = uniqueDraftName("Author publish");
  await authorDraftWithMcqs(page, name);
  await expect(page.getByText(/draft/i).first()).toBeVisible();

  await openPaperView(page);
  for (const [index, question] of JOURNEY_MCQS.entries()) {
    if (index > 0) await page.getByRole("button", { name: "Next" }).click();
    await expect(renderedStem(page, question.stem)).toBeVisible();
    await expect(
      page.getByText(question.options[question.correctIndex - 1], {
        exact: true,
      })
    ).toBeVisible();
    await expect(page.getByText("Correct answer")).toBeVisible();
  }
  await page.getByRole("link", { name: "Back to test" }).click();

  await publishDraft(page);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
});
