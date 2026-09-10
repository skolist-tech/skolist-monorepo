import { expect, type Page } from "@playwright/test";

/**
 * Nearest card container for a titled heading.
 * Avoids the outer grid which also matches "has heading + has Open".
 */
export function testCard(page: Page, title: string) {
  return page
    .getByRole("heading", { name: title, exact: true })
    .locator(
      "xpath=ancestor::div[.//a[normalize-space()='Open'] or .//button[normalize-space()='Start' or normalize-space()='Continue']][1]"
    );
}

export function uniqueDraftName(prefix = "E2E draft") {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

/** Create a named draft from the teacher tests list and land on the editor. */
export async function createNamedDraft(page: Page, name: string) {
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/teacher\/tests\/[0-9a-f-]{36}/i, {
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: "Sections" })).toBeVisible();
}

export async function proceedPastInstructionsIfPresent(page: Page) {
  const instructions = page.getByRole("heading", {
    name: "General Instructions",
  });
  try {
    await instructions.waitFor({ state: "visible", timeout: 8_000 });
  } catch {
    return;
  }
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Proceed" }).click();
}
