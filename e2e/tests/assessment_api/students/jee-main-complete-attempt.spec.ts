import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "../../helpers/auth";
import { testCard } from "../helpers";
import { STUDENT_2, TESTS } from "../seed";

/** Pause so the headed recording is watchable. */
async function beat(page: Page, ms = 1400) {
  await page.waitForTimeout(ms);
}

async function proceedPastInstructions(page: Page) {
  await expect(
    page.getByRole("heading", { name: "General Instructions" })
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Proceed" }).click();
  await expect(page.getByText("Question Palette")).toBeVisible();
}

async function selectMcqOption(page: Page, optionIndex: number) {
  // NTA radios: (A)/(B)/(C)/(D) — optionIndex is 1-based
  await page.locator(`input[type="radio"][name^="q-"]`).nth(optionIndex - 1).check();
}

test.describe("Workflow video: complete JEE attempt", () => {
  test("student sits JEE Main Mock Test 1 end to end", async ({ page }) => {
    test.setTimeout(180_000);

    await loginAs(page, STUDENT_2.email, STUDENT_2.password);
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
    await proceedPastInstructions(page);
    await expect(page.getByText(TESTS.jeeMain1.name)).toBeVisible();
    await beat(page, 2000);

    // Physics MCQ — F = ma → 5 m/s² (option 2)
    await expect(
      page.getByText(/A body of mass 2 kg is acted upon by a force of 10 N/)
    ).toBeVisible();
    await expect(page.getByText("m = 2 kg")).toBeVisible();
    await expect(page.getByText("F = 10 N")).toBeVisible();
    await expect(page.getByText("opt-b")).toBeVisible();
    await beat(page, 1800);
    await selectMcqOption(page, 2);
    await page.getByRole("button", { name: "Save & Next" }).click();
    await beat(page);

    // Physics numerical — g = 9.8
    await expect(
      page.getByText(/The acceleration due to gravity near the Earth's surface/)
    ).toBeVisible();
    await beat(page, 1800);
    const numeric = page.locator('input[type="number"]');
    await numeric.fill("9.8");
    await page.getByRole("button", { name: "Save & Next" }).click();
    await beat(page);

    // Chemistry MCQ — Ca is an alkaline earth metal (option 3)
    await expect(
      page.getByText("Which of the following is an alkaline earth metal?")
    ).toBeVisible();
    await beat(page, 1800);
    await selectMcqOption(page, 3);
    await page.getByRole("button", { name: "Save & Next" }).click();
    await beat(page);

    // Mathematics integer — (x-2)(x-3) = 0 → 2 real roots
    await expect(
      page.getByText(/The number of real roots of the equation/)
    ).toBeVisible();
    await beat(page, 1800);
    await page.locator('input[type="number"]').fill("2");
    await page.getByRole("button", { name: "Save & Next" }).click();
    await beat(page, 1800);

    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByRole("button", { name: "Yes, Submit" }).click();

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
