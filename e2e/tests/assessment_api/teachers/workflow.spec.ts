import { test, expect } from "@playwright/test";
import { loginAs } from "../../helpers/auth";
import {
  closePublishedPaper,
  createNamedDraft,
  editStem,
  openPaperView,
  renderedStem,
  goBackToTeacherTests,
  openDeleteDialog,
  publishDraft,
  testCard,
  uniqueDraftName,
} from "../helpers";
import { workerPair } from "../seed";

test.describe("Teacher authoring workflows", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const { teacher } = workerPair(testInfo);
    await loginAs(page, teacher.email, teacher.password);
    await expect(page).toHaveURL(/\/teacher\/tests/);
  });

  test("creates a named draft from the tests page and opens the editor", async ({
    page,
  }) => {
    const name = uniqueDraftName();
    await createNamedDraft(page, name);
    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });

  test("adds a question on a new draft, edits the stem, and saves", async ({
    page,
  }) => {
    const name = uniqueDraftName();
    await createNamedDraft(page, name);

    await openPaperView(page);
    const edited = `Edited question ${Date.now()}`;
    await editStem(page, edited);
    await page.reload();
    await expect(renderedStem(page, edited)).toBeVisible({ timeout: 15_000 });
  });

  test("assigns a seed student to a new draft", async ({ page }, testInfo) => {
    const { student } = workerPair(testInfo);
    const name = uniqueDraftName();
    await createNamedDraft(page, name);

    await page.getByRole("button", { name: "Students" }).click();
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();

    const search = page.getByRole("textbox", { name: "Search students" });
    await search.fill(student.name);
    await page
      .getByRole("listbox", { name: "Search students" })
      .getByRole("button", { name: new RegExp(student.name) })
      .click();

    await expect(page.getByText(student.name).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("publishes a new draft", async ({ page }) => {
    const name = uniqueDraftName();
    await createNamedDraft(page, name);
    await publishDraft(page);
  });

  test("closes a published paper and returns to the list", async ({ page }) => {
    const name = uniqueDraftName("Close paper");
    await createNamedDraft(page, name);
    await publishDraft(page);
    await closePublishedPaper(page);

    await goBackToTeacherTests(page);
    await expect(testCard(page, name).getByText(/· closed$/)).toBeVisible();
  });

  test("cancelling delete keeps the paper on the list", async ({ page }) => {
    const name = uniqueDraftName("Keep draft");
    await createNamedDraft(page, name);
    await goBackToTeacherTests(page);

    const dialog = await openDeleteDialog(page, name);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  });

  test("confirms delete and removes the paper from the list", async ({
    page,
  }) => {
    const name = uniqueDraftName("Delete draft");
    await createNamedDraft(page, name);
    await goBackToTeacherTests(page);

    const dialog = await openDeleteDialog(page, name);
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog).toHaveCount(0, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name, exact: true })
    ).toHaveCount(0);
  });
});
