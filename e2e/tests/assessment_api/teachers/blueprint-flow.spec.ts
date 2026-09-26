import { test, expect } from "../shared-seed";
import { loginAs, logOut } from "../../helpers/auth";
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
    await expect(page.getByRole("button", { name: "Full Syllabus Sample" })).toBeVisible();

    await logOut(page);
    await expect(page).toHaveURL(/\/login/);
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
