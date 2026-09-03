import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { testCard } from "./helpers";
import { STUDENT_1, STUDENT_VISIBLE_PUBLISHED, TESTS } from "./seed";

test.describe("Student assessment flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, STUDENT_1.email, STUDENT_1.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();
  });

  test("shows published assigned seed tests, not the draft", async ({
    page,
  }) => {
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
    const card = testCard(page, TESTS.jeeMain1.name);

    await expect(card.getByText("No attempt yet")).toBeVisible({
      timeout: 15_000,
    });
    await expect(card.getByRole("button", { name: "Start" })).toBeVisible();
  });

  test("continues in-progress NEET attempt into the paper UI", async ({
    page,
  }) => {
    const card = testCard(page, TESTS.neetLive.name);

    await expect(card.getByText("Latest attempt: in_progress")).toBeVisible({
      timeout: 15_000,
    });
    await card.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/student\/attempts\/.+/);
    await expect(
      page.getByRole("heading", { name: TESTS.neetLive.name })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("in_progress")).toBeVisible();
    // Seed NEET live paper has Physics/Chemistry/Biology questions.
    await expect(page.getByText(/mcq|numerical|integer/).first()).toBeVisible();
  });
});
