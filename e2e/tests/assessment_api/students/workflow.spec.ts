import { test, expect } from "@playwright/test";
import { loginAs } from "../../helpers/auth";
import {
  proceedPastInstructionsIfPresent,
  testCard,
} from "../helpers";
import { STUDENT_3, TESTS } from "../seed";

/**
 * STUDENT_3 + NEET Open: seed says nobody has started this paper.
 * Avoids STUDENT_2 (jee-main-complete-attempt) and STUDENT_1 (nta full mock).
 */
test.describe("Student attempt workflows", () => {
  test("starts an assigned published paper, answers, and uses the palette", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await loginAs(page, STUDENT_3.email, STUDENT_3.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();

    const card = testCard(page, TESTS.neetOpen.name);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole("button", { name: /^(Start|Continue)$/ }).click();

    await expect(page).toHaveURL(/\/student\/attempts\/.+/);
    await proceedPastInstructionsIfPresent(page);

    await expect(page.getByText("Question Palette")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("button", { name: "Save & Next" })
    ).toBeVisible();

    const firstOption = page.locator('input[type="radio"]').first();
    if (await firstOption.count()) {
      await firstOption.check();
    } else {
      const numeric = page.locator('input[type="number"]').first();
      if (await numeric.count()) {
        await numeric.fill("1");
      }
    }
    await page.getByRole("button", { name: "Save & Next" }).click();

    await page
      .locator("aside")
      .getByRole("button", { name: "1", exact: true })
      .click();
    await expect(page.getByText(/^Question\s+1$/)).toBeVisible();
  });
});
