import { test, expect } from "@playwright/test";
import { loginAs } from "../../helpers/auth";
import {
  createNamedDraft,
  openPaperView,
  renderedStem,
  uniqueDraftName,
} from "../helpers";
import { workerPair } from "../seed";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

test.describe("Teacher question paper view", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const { teacher } = workerPair(testInfo);
    await loginAs(page, teacher.email, teacher.password);
    await createNamedDraft(page, uniqueDraftName("Paper view"));
    await openPaperView(page);
  });

  test("shows the student layout with edit controls", async ({ page }) => {
    await expect(page.getByText("Question Palette")).toBeVisible();
    await expect(page.getByRole("button", { name: "Physics" })).toBeVisible();
    await expect(
      page.getByText("Multiple Choice (Single Correct)")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit option A" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit explanation" })).toBeVisible();
    await expect(page.getByText("Correct answer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save & Next" })).toHaveCount(0);
  });

  test("cancel discards a stem edit", async ({ page }) => {
    await page.getByRole("button", { name: "Edit question" }).click();
    await page.getByLabel("question text").fill("Discarded stem");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(renderedStem(page, "Discarded stem")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Edit question" })).toBeVisible();
  });

  test("uploads a stem image, then removes it with the cross", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Edit question" }).click();
    await page.getByLabel("question image file").setInputFiles({
      name: "figure.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("img", { name: /Figure for question/ })).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    await expect(page.getByRole("img", { name: /Figure for question/ })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Edit question" }).click();
    await page.getByRole("button", { name: "Remove image" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("img", { name: /Figure for question/ })).toHaveCount(0, {
      timeout: 15_000,
    });
  });

  test("changes the correct option", async ({ page }) => {
    const optionC = () =>
      page.getByRole("button", { name: "Edit option C" }).locator("..");
    await page.getByRole("button", { name: "Edit option C" }).click();
    await page.getByLabel("Correct answer").check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(optionC().getByText("Correct answer")).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(optionC().getByText("Correct answer")).toBeVisible({ timeout: 15_000 });
  });

  test("saves an explanation and its figure, then removes the figure", async ({
    page,
  }) => {
    const explanation = "E2E explanation";
    await page.getByRole("button", { name: "Edit explanation" }).click();
    await page.getByLabel("explanation text").fill(explanation);
    await page.getByLabel("explanation image file").setInputFiles({
      name: "explanation.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(explanation)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("img", { name: "Explanation figure" })).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    await expect(page.getByText(explanation)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("img", { name: "Explanation figure" })).toBeVisible();

    await page.getByRole("button", { name: "Edit explanation" }).click();
    await page.getByRole("button", { name: "Remove image" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(explanation)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("img", { name: "Explanation figure" })).toHaveCount(0);
  });
});
