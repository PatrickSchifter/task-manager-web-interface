import fs from "node:fs";
import path from "node:path";
import { test as teardown } from "@playwright/test";

teardown("Teardown", () => {
  const filesToDelete = [
    path.resolve("e2e", "user-1.json"),
    path.resolve("e2e", "user-2.json"),
    path.resolve("e2e", "user-3.json"),
    path.resolve("e2e", "user-data-1.json"),
    path.resolve("e2e", "user-data-2.json"),
    path.resolve("e2e", "user-data-3.json"),
  ];

  for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
});
