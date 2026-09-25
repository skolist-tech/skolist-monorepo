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
import { TEACHER_2 } from "../seed";

test("teacher creates a draft, writes questions, edits them, and publishes", async ({
  page,
}) => {
  test.setTimeout(90_000);

  await loginAs(page, TEACHER_2.email, TEACHER_2.password);
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
