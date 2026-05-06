import fs from "node:fs";
import { expect, test } from "@playwright/test";

const users = [
  {
    id: 1,
  },
  {
    id: 2,
  },
  {
    id: 3,
  },
];

test.describe("Auth", () => {
  for (const user of users) {
    test(`User ${user.id} should be able to login`, async ({ page }) => {
      const userData = JSON.parse(fs.readFileSync(`./e2e/user-data-${user.id}.json`, "utf8"));
      await page.goto("/signin");
      await page.getByRole("textbox", { name: "Email*" }).fill(userData.email);
      await page.getByRole("textbox", { name: "Password*" }).fill(userData.password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByText("Your projects")).toBeVisible();
    });
  }
});
