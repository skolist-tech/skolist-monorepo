import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { testCard } from "./helpers";
import { STUDENT_1, STUDENT_3, STUDENT_VISIBLE_PUBLISHED, TESTS } from "./seed";

async function openAssignedTests(page: import("@playwright/test").Page, email: string, password: string) {
  await loginAs(page, email, password);
  await expect(page).toHaveURL(/\/student\/tests/);
  await expect(
    page.getByRole("heading", { name: "Assigned tests" })
  ).toBeVisible();
}

test.describe("Student assessment flows", () => {
  test("shows published assigned seed tests, not the draft", async ({
    page,
  }) => {
    await openAssignedTests(page, STUDENT_1.email, STUDENT_1.password);

    for (const name of STUDENT_VISIBLE_PUBLISHED) {
      await expect(page.getByRole("heading", { name })).toBeVisible({
        timeout: 15_000,
      });
    }

    // Draft is never assigned; closed papers are filtered out of assigned-tests API.
    await expect(
      page.getByRole("heading", { name: TESTS.advDraft.name })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: TESTS.advClosed.name })
    ).toHaveCount(0);
  });

  test("shows No attempt yet on JEE Main Mock Test 1", async ({ page }) => {
    await openAssignedTests(page, STUDENT_3.email, STUDENT_3.password);

    const card = testCard(page, TESTS.jeeMain1.name);

    await expect(card.getByText("No attempt yet")).toBeVisible({
      timeout: 15_000,
    });
    await expect(card.getByRole("button", { name: "Start" })).toBeVisible();
  });

  test("opens NEET paper into the NTA paper UI", async ({
    page,
  }) => {
    await openAssignedTests(page, STUDENT_1.email, STUDENT_1.password);

    const card = testCard(page, TESTS.neetLive.name);

    await expect(
      card.getByText(/Latest attempt: (in_progress|graded)/)
    ).toBeVisible({
      timeout: 15_000,
    });
    await card.getByRole("button", { name: /^(Start|Continue)$/ }).click();

    await expect(page).toHaveURL(/\/student\/attempts\/.+/);
    await expect(
      page.getByRole("heading", { name: "General Instructions" })
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Proceed" }).click();

    await expect(page.getByText("Question Palette")).toBeVisible();
    await expect(page.getByRole("button", { name: "Physics" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save & Next" })
    ).toBeVisible();
    await expect(page.getByText(/Multiple Choice|Numerical|Integer/)).toBeVisible();
  });
});
