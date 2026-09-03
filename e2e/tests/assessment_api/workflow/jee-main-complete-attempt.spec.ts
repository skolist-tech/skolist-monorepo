import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "../../helpers/auth";
import { testCard } from "../helpers";
import { STUDENT_1, TESTS } from "../seed";

/** Pause so the headed recording is watchable. */
async function beat(page: Page, ms = 1400) {
  await page.waitForTimeout(ms);
}

async function goToPaletteQuestion(page: Page, n: number) {
  await page.getByRole("button", { name: String(n), exact: true }).click();
}

test.describe("Workflow video: complete JEE attempt", () => {
  test("student sits JEE Main Mock Test 1 end to end", async ({ page }) => {
    test.setTimeout(180_000);

    await loginAs(page, STUDENT_1.email, STUDENT_1.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();
    await beat(page, 1800);

    const card = testCard(page, TESTS.jeeMain1.name);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await beat(page, 1200);

    await card.getByRole("button", { name: /^(Start|Continue)$/ }).click();

    await expect(page).toHaveURL(/\/student\/attempts\/.+/);
    await expect(
      page.getByRole("heading", { name: TESTS.jeeMain1.name })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("in_progress")).toBeVisible();
    await beat(page, 2000);

    // Physics MCQ — F = ma → 5 m/s²
    await expect(
      page.getByText(/A body of mass 2 kg is acted upon by a force of 10 N/)
    ).toBeVisible();
    await beat(page, 1800);
    await page.getByRole("button", { name: "2. 5 m/s²" }).click();
    await beat(page);

    // Physics numerical — g = 9.8
    await goToPaletteQuestion(page, 2);
    await expect(
      page.getByText(/The acceleration due to gravity near the Earth's surface/)
    ).toBeVisible();
    await beat(page, 1800);
    const numeric = page.locator('input[type="number"]');
    await numeric.fill("9.8");
    await numeric.blur();
    await beat(page);

    // Chemistry MCQ — Ca is an alkaline earth metal
    await goToPaletteQuestion(page, 3);
    await expect(
      page.getByText("Which of the following is an alkaline earth metal?")
    ).toBeVisible();
    await beat(page, 1800);
    await page.getByRole("button", { name: "3. Ca" }).click();
    await beat(page);

    // Mathematics integer — (x-2)(x-3) = 0 → 2 real roots
    await goToPaletteQuestion(page, 4);
    await expect(
      page.getByText(/The number of real roots of the equation/)
    ).toBeVisible();
    await beat(page, 1800);
    await numeric.fill("2");
    await numeric.blur();
    await beat(page, 1800);

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(/\/student\/attempts\/.+\/result/, {
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: TESTS.jeeMain1.name })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Score 16\s*\/\s*16/)).toBeVisible();
    await beat(page, 2200);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await beat(page, 2800);
  });
});
