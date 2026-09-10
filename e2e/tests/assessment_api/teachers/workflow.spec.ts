import { test, expect } from "@playwright/test";
import { loginAs } from "../../helpers/auth";
import { createNamedDraft, uniqueDraftName } from "../helpers";
import { TEACHER_2 } from "../seed";

test.describe("Teacher authoring workflows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEACHER_2.email, TEACHER_2.password);
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

    await page.getByRole("button", { name: "Add section" }).click();
    await expect(page.getByRole("heading", { name: /Physics/ })).toBeVisible({
      timeout: 15_000,
    });

    if ((await page.getByText("New question").count()) === 0) {
      await page.getByRole("button", { name: "Add question" }).click();
      await expect(page.getByText("New question")).toBeVisible({
        timeout: 15_000,
      });
    }

    const edited = `Edited question ${Date.now()}`;
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    const questionField = page.getByRole("textbox", { name: /question/i });
    if (await questionField.count()) {
      await questionField.first().fill(edited);
    } else {
      await page.locator("textarea").first().fill(edited);
    }

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(edited)).toBeVisible({ timeout: 15_000 });
  });

  test("publishes a new draft", async ({ page }) => {
    const name = uniqueDraftName();
    await createNamedDraft(page, name);

    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText(/published/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
  });
});
