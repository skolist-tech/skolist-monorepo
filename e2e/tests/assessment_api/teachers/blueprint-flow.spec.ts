import { test, expect } from "../shared-seed";
import { loginAs, logOut } from "../../helpers/auth";
import { blueprintCard } from "../helpers";
import { TEACHER_1, TEACHER_2, TESTS } from "../seed";

test.describe.configure({ mode: "serial" });

test.describe("Blueprint create and explicit access", () => {
  test("header, disabled chapter-wise, and another teacher's paper stays hidden", async ({
    page,
  }) => {
    await loginAs(page, TEACHER_1.email, TEACHER_1.password);
    await expect(page.getByText(TEACHER_1.name)).toBeVisible();
    await expect(page.getByText("Seed Organisation")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await expect(page.getByRole("heading", { name: TESTS.jeeMain2.name })).toHaveCount(0);

    await page.getByRole("link", { name: "Create test" }).click();
    await expect(page.getByRole("button", { name: "Chapter Wise Test" })).toBeDisabled();
    await page.getByRole("button", { name: "Full Syllabus Test" }).click();
    const catalog = blueprintCard(page, "Full Syllabus Sample");
    await expect(catalog.getByRole("link", { name: "View Test" })).toBeVisible();
    await expect(catalog.getByRole("button", { name: "Use Test" })).toBeVisible();

    await logOut(page);
    await expect(page).toHaveURL(/\/login/);
  });

  test("view test opens a read-only paper", async ({ page }) => {
    await loginAs(page, TEACHER_1.email, TEACHER_1.password);
    await page.getByRole("link", { name: "Create test" }).click();
    await page.getByRole("button", { name: "Full Syllabus Test" }).click();
    await blueprintCard(page, "Full Syllabus Sample")
      .getByRole("link", { name: "View Test" })
      .click();
    await expect(page).toHaveURL(/\/teacher\/blueprints\/[0-9a-f-]{36}\/paper$/i);
    await expect(page.getByText("Question Palette")).toBeVisible();
    await expect(page.getByText("Preview · view only")).toBeVisible();
    await expect(
      page.getByText("Blueprint physics: what is 2 + 2?")
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Edit question" })).toHaveCount(
      0
    );
    await expect(page.getByText("Correct answer").first()).toBeVisible();
    await page.getByRole("link", { name: "Back to create test" }).click();
    await expect(page).toHaveURL(/\/teacher\/tests\/new/);
    await expect(
      blueprintCard(page, "Full Syllabus Sample").getByRole("button", {
        name: "Use Test",
      })
    ).toBeVisible();
  });

  test("use test shows a creating overlay while the paper is copied", async ({
    page,
  }) => {
    await loginAs(page, TEACHER_1.email, TEACHER_1.password);
    await page.route("**/api/v1/assessment/blueprints/*/clone", async (route) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1_500);
      });
      await route.continue();
    });
    await page.getByRole("link", { name: "Create test" }).click();
    await page.getByRole("button", { name: "Full Syllabus Test" }).click();
    await blueprintCard(page, "Full Syllabus Sample")
      .getByRole("button", { name: "Use Test" })
      .click();
    await expect(page.getByRole("status")).toContainText("Creating Test");
    await expect(page).toHaveURL(/\/teacher\/tests\/[0-9a-f-]{36}/i, {
      timeout: 20_000,
    });
  });

  test("teacher 2 can assign and deassign the seed group", async ({ page }) => {
    await loginAs(page, TEACHER_2.email, TEACHER_2.password);
    await page.goto(`/teacher/tests/${TESTS.neetOpen.id}`);
    await page.getByRole("button", { name: "Students" }).click();
    await page.getByRole("button", { name: "Assign Seed Group" }).click();
    await expect(page.getByRole("button", { name: "Deassign group" })).toBeVisible();
    await page.getByRole("button", { name: "Deassign group" }).click();
    await expect(page.getByRole("button", { name: "Assign Seed Group" })).toBeVisible();
  });
});
