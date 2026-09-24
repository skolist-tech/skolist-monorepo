import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { STUDENT_1, TEACHER_1 } from "./seed";

test.describe("Assessment auth", () => {
  test("unauthenticated users are redirected to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Login to your account" })
    ).toBeVisible();
    await expect(page.getByLabel("Org code")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Proceed Securely" })).toBeVisible();
    await expect(page.getByText("Sign Up", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Continue with Google")).toHaveCount(0);
    await expect(page.getByText("Use Phone Number")).toHaveCount(0);
    await expect(page.getByText("INSTANTLY CHOOSE FROM")).toHaveCount(0);
    await expect(page.getByText("New to QGEN?")).toHaveCount(0);
    await expect(page.getByText("Built by founders from")).toHaveCount(0);
  });

  test("teacher is redirected to the teacher test list", async ({ page }) => {
    await loginAs(page, TEACHER_1.email, TEACHER_1.password);
    await expect(page).toHaveURL(/\/teacher\/tests/);
    await expect(page.getByRole("heading", { name: "Tests" })).toBeVisible();
  });

  test("wrong organisation code stays on login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Org code").fill("ZZZZZZ");
    await page.getByLabel("Email").fill(TEACHER_1.email);
    await page.getByPlaceholder("Enter password").fill(TEACHER_1.password);
    await page.getByRole("button", { name: "Proceed Securely" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator(".login-form__error")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("student is redirected to assigned tests", async ({ page }) => {
    await loginAs(page, STUDENT_1.email, STUDENT_1.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();
  });
});
