import { test, expect } from "@playwright/test";
import { loginAs, logOut } from "../../helpers/auth";
import {
  assignStudentByName,
  closePublishedPaper,
  createNamedDraft,
  publishDraft,
  uniqueDraftName,
} from "../helpers";
import { workerPair } from "../seed";

test.describe("Student cannot sit a paper that is not released to them", () => {
  test("does not see a draft even when assigned", async ({ page }, testInfo) => {
    test.setTimeout(60_000);

    const { teacher, student } = workerPair(testInfo);
    await loginAs(page, teacher.email, teacher.password);
    const name = uniqueDraftName("Unpublished assigned");
    await createNamedDraft(page, name);
    await assignStudentByName(page, student.name);

    await logOut(page);
    await loginAs(page, student.email, student.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0
    );
  });

  test("does not see a published paper that was never assigned", async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);

    const { teacher, student } = workerPair(testInfo);
    await loginAs(page, teacher.email, teacher.password);
    const name = uniqueDraftName("Published unassigned");
    await createNamedDraft(page, name);
    await publishDraft(page);

    await logOut(page);
    await loginAs(page, student.email, student.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0
    );
  });

  test("does not see a paper after the teacher closes it", async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);

    const { teacher, student } = workerPair(testInfo);
    await loginAs(page, teacher.email, teacher.password);
    const name = uniqueDraftName("Closed assigned");
    await createNamedDraft(page, name);
    await assignStudentByName(page, student.name);
    await publishDraft(page);
    await closePublishedPaper(page);

    await logOut(page);
    await loginAs(page, student.email, student.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0
    );
  });
});
