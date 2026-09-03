import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { STUDENT_1, TEACHER_1 } from "./seed";

test.describe("Assessment auth", () => {
  test("unauthenticated users are redirected to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
  });

  test("teacher is redirected to the teacher test list", async ({ page }) => {
    await loginAs(page, TEACHER_1.email, TEACHER_1.password);
    await expect(page).toHaveURL(/\/teacher\/tests/);
    await expect(page.getByRole("heading", { name: "Tests" })).toBeVisible();
  });

  test("student is redirected to assigned tests", async ({ page }) => {
    await loginAs(page, STUDENT_1.email, STUDENT_1.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();
  });
});
