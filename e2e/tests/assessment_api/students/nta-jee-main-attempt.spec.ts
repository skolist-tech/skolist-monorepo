/**
 * Temporary workflow recording for NTA CBT attempt UI (JEE Main full mock).
 * Delete this file if it should not stay in the permanent e2e suite.
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "../../helpers/auth";
import { testCard } from "../helpers";
import { FULL_MOCKS, STUDENT_1 } from "../seed";

test.describe("NTA CBT workflow (JEE Main full mock)", () => {
  test("instructions → palette → answer → save & next → mark for review", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await loginAs(page, STUDENT_1.email, STUDENT_1.password);
    await expect(page).toHaveURL(/\/student\/tests/);

    const card = testCard(page, FULL_MOCKS.jeeMain.name);
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.getByRole("button", { name: /Start|Continue/ }).click();

    await expect(page).toHaveURL(/\/student\/attempts\/.+/);
    await expect(
      page.getByRole("heading", { name: "General Instructions" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(FULL_MOCKS.jeeMain.name)).toBeVisible();

    // Cannot proceed without agreeing
    await expect(page.getByRole("button", { name: "Proceed" })).toBeDisabled();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Proceed" }).click();

    // NTA chrome
    await expect(page.getByText("Question Palette")).toBeVisible();
    await expect(page.getByText("Time Left")).toBeVisible();
    await expect(page.getByRole("img", { name: "PHOTO" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Physics" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Chemistry" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mathematics" })
    ).toBeVisible();
    await expect(page.getByText("Not Visited", { exact: true })).toBeVisible();
    await expect(page.getByText("Answered", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Marked for Review", { exact: true })
    ).toBeVisible();

    // Question stem renders (KaTeX may or may not appear on Q1)
    await expect(page.getByText(/^Question\s+1$/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save & Next" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Clear Response" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mark for Review & Next" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save & Mark for Review" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

    // Answer first MCQ via radio and Save & Next
    const firstOption = page.locator('input[type="radio"]').first();
    if (await firstOption.count()) {
      await firstOption.check();
      await page.getByRole("button", { name: "Save & Next" }).click();
      await expect(page.getByText(/^Question\s+2$/)).toBeVisible({
        timeout: 10_000,
      });
    }

    // Mark for review on current question
    await page.getByRole("button", { name: "Mark for Review & Next" }).click();

    // Jump via palette to question 1 (answered = green path)
    await page
      .locator("aside")
      .getByRole("button", { name: "1", exact: true })
      .click();
    await expect(page.getByText(/^Question\s+1$/)).toBeVisible();

    // Section switch
    await page.getByRole("button", { name: "Chemistry" }).click();
    await expect(page.getByText(/^Question\s+1$/)).toBeVisible();

    // Language toggle present
    await page.locator("select").selectOption("hi");
    await expect(page.getByText("प्रश्न पैलेट")).toBeVisible();

    // Brief pause so video captures the Hindi palette state
    await page.waitForTimeout(1500);
  });
});
