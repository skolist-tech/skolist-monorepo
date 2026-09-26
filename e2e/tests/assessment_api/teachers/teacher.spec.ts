import { test, expect } from "../shared-seed";
import { loginAs, logOut } from "../../helpers/auth";
import { testCard } from "../helpers";
import { TEACHER_1, TEACHER_2, TESTS } from "../seed";

test.describe.configure({ mode: "serial" });

test.describe("Teacher assessment flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEACHER_1.email, TEACHER_1.password);
    await expect(page).toHaveURL(/\/teacher\/tests/);
  });

  test("lists seed papers for the org including draft and closed", async ({
    page,
  }) => {
    const visible = [TESTS.jeeMain1, TESTS.neetLive, TESTS.advDraft];
    for (const testMeta of visible) {
      await expect(
        page.getByRole("heading", { name: testMeta.name })
      ).toBeVisible({
        timeout: 15_000,
      });
    }

    await expect(page.getByText("jee_advanced · draft")).toBeVisible();
    await expect(page.getByRole("heading", { name: TESTS.advClosed.name })).toHaveCount(0);
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
    await expect(page.getByRole("button", { name: "Question paper" })).toBeVisible();
  });

  test("opens a live NEET paper and shows attempts", async ({ page }) => {
    await page.goto(`/teacher/tests/${TESTS.neetLive.id}`);
    await expect(
      page.getByRole("heading", { name: TESTS.neetLive.name })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/neet · published/)).toBeVisible();
    await page.getByRole("button", { name: "Attempts" }).click();
    await expect(page.getByRole("heading", { name: "Attempts" })).toBeVisible();
    // Seed: all 3 students started; student2 also has a graded retake.
    await expect(page.getByText(/in_progress|graded/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close paper" })).toBeVisible();
  });

  test("closed paper shows Back and no Close paper action", async ({
    page,
  }) => {
    await logOut(page);
    await loginAs(page, TEACHER_2.email, TEACHER_2.password);
    await page.goto(`/teacher/tests/${TESTS.advClosed.id}`);
    await expect(
      page.getByRole("heading", { name: TESTS.advClosed.name })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/jee_advanced · closed/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close paper" })).toHaveCount(
      0
    );
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
  });

  test("Open link on draft card navigates to the editor", async ({ page }) => {
    await testCard(page, TESTS.advDraft.name)
      .getByRole("link", { name: "Open" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/teacher/tests/${TESTS.advDraft.id}`));
  });

  test("Back from the editor returns to the tests list", async ({ page }) => {
    await testCard(page, TESTS.advDraft.name)
      .getByRole("link", { name: "Open" })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/teacher/tests/${TESTS.advDraft.id}`)
    );
    await expect(
      page.getByRole("heading", { name: TESTS.advDraft.name })
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/teacher\/tests$/);
    await expect(page.getByRole("heading", { name: "Tests" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: TESTS.advDraft.name })
    ).toBeVisible();
  });
});
