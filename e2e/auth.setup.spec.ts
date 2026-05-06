import fs from "node:fs";
import { faker } from "@faker-js/faker";
import test, { expect } from "@playwright/test";

const users = [
  {
    id: 1,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: "password",
  },
  {
    id: 2,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: "password",
  },

  {
    id: 3,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: "password",
  },
];

test.describe("Auth", () => {
  for (const user of users) {
    test(`User ${user.id} should be able to create an account`, async ({ page }) => {
      await page.goto("/signup");
      await page.getByRole("textbox", { name: "Name*" }).fill(user.name);
      await page.getByRole("textbox", { name: "Email*" }).fill(user.email);
      await page.getByRole("textbox", { name: "Password*" }).fill(user.password);
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(page.getByText("Your projects")).toBeVisible();

      fs.writeFileSync(`./e2e/user-data-${user.id}.json`, JSON.stringify(user, null, 2));
      await page.context().storageState({ path: `./e2e/user-${user.id}.json` });
    });
  }
});
