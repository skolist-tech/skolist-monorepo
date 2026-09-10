import { test, expect } from "@playwright/test";
import { loginAs, logOut } from "../../helpers/auth";
import {
  assignStudentByName,
  createNamedDraft,
  publishDraft,
  uniqueDraftName,
} from "../helpers";
import { STUDENT_3, TEACHER_2 } from "../seed";

test.describe.configure({ mode: "serial" });

test.describe("Student cannot sit a paper that is not released to them", () => {
  test("does not see a draft even when assigned", async ({ page }) => {
    test.setTimeout(60_000);

    await loginAs(page, TEACHER_2.email, TEACHER_2.password);
    const name = uniqueDraftName("Unpublished assigned");
    await createNamedDraft(page, name);
    await assignStudentByName(page, STUDENT_3.name);

    await logOut(page);
    await loginAs(page, STUDENT_3.email, STUDENT_3.password);
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
  }) => {
    test.setTimeout(60_000);

    await loginAs(page, TEACHER_2.email, TEACHER_2.password);
    const name = uniqueDraftName("Published unassigned");
    await createNamedDraft(page, name);
    await publishDraft(page);

    await logOut(page);
    await loginAs(page, STUDENT_3.email, STUDENT_3.password);
    await expect(page).toHaveURL(/\/student\/tests/);
    await expect(
      page.getByRole("heading", { name: "Assigned tests" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0
    );
  });
});
