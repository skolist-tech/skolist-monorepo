import { type Page } from "@playwright/test";

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
