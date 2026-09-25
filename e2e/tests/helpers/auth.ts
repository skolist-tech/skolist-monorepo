import { expect, type Page } from "@playwright/test";

export function testUserCredentials() {
  const email = process.env.TEST_USER_EMAIL ?? "test@example.com";
  const password = process.env.TEST_USER_PASSWORD ?? "password123";
  return { email, password };
}

export const SEED_ORG_CODE = process.env.ASSESSMENT_ORG_CODE ?? "SEEDOR";

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

/** Full email sign-in and wait until /login is left. */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  const orgCode = page.getByLabel("Org code");
  const assessmentsLogin = await orgCode
    .waitFor({ state: "visible", timeout: 8_000 })
    .then(() => true)
    .catch(() => false);
  if (assessmentsLogin) {
    await orgCode.fill(SEED_ORG_CODE);
    await page.getByLabel("Email").fill(email);
    await page.getByPlaceholder("Enter password").fill(password);
    await page.getByRole("button", { name: "Proceed Securely" }).click();
  } else {
    await openEmailSignIn(page);
    await fillEmailSignIn(page, email, password);
  }
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });
}

/** Sign out from the Assessments header menu and land on /login. */
export async function logOut(page: Page) {
  await page.getByRole("banner").getByRole("button").last().click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  try {
    await page.waitForURL(/\/login/, { timeout: 15_000 });
  } catch {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  }
}
