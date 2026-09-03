import { expect, type Page } from "@playwright/test";

export function testUserCredentials() {
  const email = process.env.TEST_USER_EMAIL ?? "test@example.com";
  const password = process.env.TEST_USER_PASSWORD ?? "password123";
  return { email, password };
}

/** Switch the login page to the email Sign In form. */
export async function openEmailSignIn(page: Page) {
  await page.goto("/login");

  const useEmail = page.getByRole("button", { name: "Use Email Address" });
  if (await useEmail.isVisible()) {
    await useEmail.click();
  }

  const signUpHeading = page.getByRole("heading", { name: "Sign Up Now" });
  if (await signUpHeading.isVisible()) {
    await page.locator(".login-right-panel__toggle-link").click();
  }

  await expect(
    page.getByRole("heading", { name: "Welcome Back" })
  ).toBeVisible();
}

export async function fillEmailSignIn(
  page: Page,
  email: string,
  password: string
) {
  await page.getByPlaceholder("name@example.com").fill(email);
  await page.getByPlaceholder("Enter password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}
