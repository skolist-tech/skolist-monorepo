import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { testCard } from "./helpers";
import { TEACHER_1, TESTS } from "./seed";

test.describe("Teacher assessment flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEACHER_1.email, TEACHER_1.password);
    await expect(page).toHaveURL(/\/teacher\/tests/);
  });

  test("lists seed papers for the org including draft and closed", async ({
    page,
  }) => {
    // Teacher list merges created_by + org tests, so teacher1 sees all seed papers.
    for (const testMeta of Object.values(TESTS)) {
      await expect(
        page.getByRole("heading", { name: testMeta.name })
      ).toBeVisible({
        timeout: 15_000,
      });
    }

    await expect(page.getByText("jee_advanced · draft")).toBeVisible();
    await expect(page.getByText("jee_advanced · closed")).toBeVisible();
    await expect(page.getByText("jee_main · published").first()).toBeVisible();
  });

  test("opens the draft JEE Advanced paper and shows Publish", async ({
    page,
  }) => {
    await page.goto(`/teacher/tests/${TESTS.advDraft.id}`);
    await expect(
      page.getByRole("heading", { name: TESTS.advDraft.name })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/jee_advanced · draft/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sections" })).toBeVisible();
  });

  test("opens a live NEET paper and shows attempts", async ({ page }) => {
    await page.goto(`/teacher/tests/${TESTS.neetLive.id}`);
    await expect(
      page.getByRole("heading", { name: TESTS.neetLive.name })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/neet · published/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Attempts" })).toBeVisible();
    // Seed: all 3 students started; student2 also has a graded retake.
    await expect(page.getByText(/in_progress|graded/).first()).toBeVisible();
  });

  test("Open link on draft card navigates to the editor", async ({ page }) => {
    await testCard(page, TESTS.advDraft.name)
      .getByRole("link", { name: "Open" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/teacher/tests/${TESTS.advDraft.id}`));
  });
});
