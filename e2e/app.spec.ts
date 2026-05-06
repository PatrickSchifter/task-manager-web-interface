import fs from "node:fs";
import path from "node:path";
import { faker } from "@faker-js/faker";
import test, { expect, type Page } from "@playwright/test";

// Test helpers
function getTestUser(id: number) {
  const userData = JSON.parse(fs.readFileSync(path.join(`./e2e/user-data-${id}.json`), "utf-8"));
  return userData;
}
async function createProject(page: Page, name: string, description: string) {
  await page.getByRole("button", { name: "Add project" }).click();
  await page.getByRole("textbox", { name: "Name*" }).fill(name);
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Project created successfully")).toBeVisible();
}

async function createTask(page: Page, title: string, description: string) {
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByRole("textbox", { name: "Title*" }).fill(title);
  await page.getByRole("textbox", { name: "Description" }).fill(description);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Task created successfully")).toBeVisible();
}

// Test data factory
function generateProjectData() {
  return {
    name: faker.lorem.word(),
    description: faker.lorem.sentence(10),
  };
}

function generateTaskData() {
  return {
    title: faker.lorem.word(),
    description: faker.lorem.sentence(10),
  };
}

function generateCommentData() {
  return {
    content: faker.lorem.sentence(20),
  };
}

async function addComment(page: Page, content: string) {
  await page.getByRole("textbox", { name: "Add a comment" }).fill(content);
  await page.getByRole("button", { name: "Comment" }).click();
  await expect(page.getByText("Comment added successfully")).toBeVisible();
}

test.describe("E2E Tests", () => {
  test.use({ storageState: path.join("./e2e/user-1.json") });

  test.describe("Projects", () => {
    test("Should be able to create a project", async ({ page }) => {
      const projectData = generateProjectData();

      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);

      await expect(page.getByText(projectData.name).first()).toBeVisible();
      await expect(page.getByText(projectData.description)).toBeVisible();
    });

    test("Should be able to edit a project", async ({ page }) => {
      const projectData = generateProjectData();
      const editedProjectData = generateProjectData();

      // Create a new project first
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);

      // Edit the project
      await page.getByText(projectData.name, { exact: true }).click();
      await page.getByRole("button", { name: "Edit project" }).click();
      await page.getByRole("textbox", { name: "Name*" }).fill(editedProjectData.name);
      await page.getByRole("textbox", { name: "Description" }).fill(editedProjectData.description);
      await page.getByRole("button", { name: "Update Project" }).click();

      await expect(page.getByText("Edit Project")).not.toBeVisible();
      await expect(page.getByText("Project edited successfully")).toBeVisible();
      await expect(page.getByText(editedProjectData.name)).toBeVisible();
      await expect(page.getByText(editedProjectData.description)).toBeVisible();
    });

    test("Should be able to delete a project", async ({ page }) => {
      const projectData = generateProjectData();

      // Create a new project first
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);

      // Delete the project
      await page.getByText(projectData.name, { exact: true }).click();
      await page.getByRole("button", { name: "Delete project" }).click();
      await page.getByRole("button", { name: "Delete project" }).last().click();

      await expect(page.getByText("Project deleted successfully")).toBeVisible();
      await expect(page.getByText("Your Projects")).toBeVisible();
      await expect(page.getByText(projectData.name)).not.toBeVisible();
    });
  });

  test.describe("Tasks", () => {
    test("Should be able to create a task", async ({ page }) => {
      const projectData = generateProjectData();
      const taskData = generateTaskData();

      // Create a project first
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);
      await page.getByText(projectData.name, { exact: true }).click();

      // Create a task
      await createTask(page, taskData.title, taskData.description);

      expect(await page.getByTestId("column-TODO").getByText(taskData.title).count()).toBe(1);
    });

    test("Should be able to edit a task", async ({ page }) => {
      const projectData = generateProjectData();
      const taskData = generateTaskData();
      const editedTaskData = generateTaskData();

      // Create a project and task first
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);
      await page.getByText(projectData.name, { exact: true }).click();
      await createTask(page, taskData.title, taskData.description);

      // Edit the task
      await page.getByText(taskData.title).last().click();
      await page.getByRole("button", { name: "Edit" }).click();
      await page.getByRole("textbox", { name: "Task title Title" }).fill(editedTaskData.title);
      await page.getByRole("textbox", { name: "Description" }).fill(editedTaskData.description);

      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.getByText("Task updated successfully")).toBeVisible();
    });

    test("Should be able to delete a task", async ({ page }) => {
      const projectData = generateProjectData();
      const taskData = generateTaskData();

      // Create a project and a task
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);
      await page.getByText(projectData.name, { exact: true }).click();
      await createTask(page, taskData.title, taskData.description);

      // Open the task details and delete it
      await page.getByText(taskData.title).last().click();
      await page.getByRole("button", { name: "Delete" }).click();
      // Confirm deletion if there's a confirmation button
      await page.getByRole("button", { name: "Delete" }).last().click();

      // Assert deletion success and that task is no longer visible
      await expect(page.getByText("Task deleted successfully")).toBeVisible();
      expect(await page.getByTestId("column-TODO").getByText(taskData.title).count()).toBe(0);
    });
  });

  test.describe("Comments", () => {
    test("Should be able to add a comment to a task", async ({ page }) => {
      const projectData = generateProjectData();
      const taskData = generateTaskData();
      const commentData = generateCommentData();

      // Create project and task
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);
      await page.getByText(projectData.name, { exact: true }).click();
      await createTask(page, taskData.title, taskData.description);

      // Add comment
      await page.getByText(taskData.title).click();
      await addComment(page, commentData.content);

      await expect(page.getByText(commentData.content)).toBeVisible();
    });

    test("Should be able to edit a comment", async ({ page }) => {
      const projectData = generateProjectData();
      const taskData = generateTaskData();
      const commentData = generateCommentData();
      const editedCommentData = generateCommentData();

      // Create project, task and comment
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);
      await page.getByText(projectData.name, { exact: true }).click();
      await createTask(page, taskData.title, taskData.description);
      await page.getByText(taskData.title).click();
      await addComment(page, commentData.content);

      // Edit comment
      await page.getByTestId("btn-edit-comment").click();
      await page
        .getByRole("textbox", { name: "Edit your comment..." })
        .fill(editedCommentData.content);
      await page.getByRole("button", { name: "Save" }).click();

      await expect(page.getByText(editedCommentData.content)).toBeVisible();
      await expect(page.getByText(commentData.content)).not.toBeVisible();
    });

    test("Should be able to delete a comment", async ({ page }) => {
      const projectData = generateProjectData();
      const taskData = generateTaskData();
      const commentData = generateCommentData();

      // Create project, task and comment
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);
      await page.getByText(projectData.name, { exact: true }).click();
      await createTask(page, taskData.title, taskData.description);
      await page.getByText(taskData.title).click();
      await addComment(page, commentData.content);

      // Delete comment
      await page.getByTestId("btn-delete-comment").click();
      await page.getByRole("button", { name: "Delete" }).click();

      await expect(page.getByText("Comment deleted successfully")).toBeVisible();
      await expect(page.getByText(commentData.content)).not.toBeVisible();
    });
  });

  test.describe("Collaborators", () => {
    test("Should be able to add collaborators to a project", async ({ page }) => {
      const projectData = generateProjectData();
      const collaborator = getTestUser(2); // Get user 2's data

      // Create project
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);
      await page.getByText(projectData.name, { exact: true }).click();

      // Add collaborator (use explicit search to add a known test user)
      await page.getByRole("button", { name: "Collaborators" }).click();
      await page.getByRole("button", { name: "Add Collaborator" }).click();
      await page.getByTestId("choose-user-select").click();
      await page.getByTestId(`user-${collaborator.email}`).click();
      await page.getByRole("button", { name: "Add collaborator" }).click();

      await expect(page.getByText("Collaborator added successfully")).toBeVisible();

      // Verify that the added collaborator can see the project in their projects view
      const browser = page.context().browser?.();
      if (browser) {
        const collaboratorState = path.join("./e2e/user-2.json");
        const collaboratorContext = await browser.newContext({ storageState: collaboratorState });
        const collaboratorPage = await collaboratorContext.newPage();
        await collaboratorPage.goto("/");
        await expect(collaboratorPage.getByText(projectData.name)).toBeVisible();
        await collaboratorContext.close();
      }

      // Verify that other users hasn't access
      const browser2 = page.context().browser?.();
      if (browser2) {
        const collaboratorState = path.join("./e2e/user-3.json");
        const collaboratorContext = await browser2.newContext({ storageState: collaboratorState });
        const collaboratorPage = await collaboratorContext.newPage();
        await collaboratorPage.goto("/");
        await expect(collaboratorPage.getByText(projectData.name)).not.toBeVisible();
        await collaboratorContext.close();
      }
    });

    test("Should be able to remove collaborators from a project", async ({ page }) => {
      const projectData = generateProjectData();
      const collaborator = getTestUser(2); // Get user 2's data

      // Create project and add collaborator
      await page.goto("/");
      await createProject(page, projectData.name, projectData.description);
      await page.getByText(projectData.name, { exact: true }).first().click();

      await page.getByRole("button", { name: "Collaborators" }).click();
      await page.getByRole("button", { name: "Add Collaborator" }).click();
      await page.getByTestId("choose-user-select").click();
      await page.getByTestId(`user-${collaborator.email}`).click();
      await page.getByRole("button", { name: "Add collaborator" }).click();

      // Remove collaborator
      await page.getByLabel("Remove collaborator").click();
      await page.getByRole("button", { name: "Remove collaborator" }).click();

      await expect(page.getByText("Collaborator removed successfully")).toBeVisible();
      await expect(page.getByText(collaborator.email)).not.toBeVisible();
    });
  });

  test.describe("User Profile", () => {
    test("Should be able to upload and update avatar", async ({ page }) => {
      // Go to profile settings
      await page.goto("/");
      await page.getByRole("button", { name: "User" }).click();
      await page.getByRole("menuitem", { name: "My settings" }).click();

      // Upload new avatar
      const avatarInput = page.getByTestId("avatar-input");
      await avatarInput.setInputFiles("./e2e/test-data/avatar.png");

      await expect(page.getByText("Avatar updated successfully")).toBeVisible();
    });

    test("Should be able to change password", async ({ page }) => {
      // Go to profile settings
      await page.goto("/");
      await page.getByRole("button", { name: "User" }).click();
      await page.getByRole("menuitem", { name: "My settings" }).click();

      // Fill password fields
      await page.getByTestId("current-password-input").fill("password");
      await page.getByTestId("new-password-input").fill("newpassword123");
      await page.getByTestId("confirm-password-input").fill("newpassword123");

      // Submit password change
      await page.getByRole("button", { name: "Save password" }).click();

      await expect(page.getByText("Password updated successfully")).toBeVisible();

      // Verify fields are cleared after successful update
      await expect(page.getByTestId("current-password-input")).toBeEmpty();
      await expect(page.getByTestId("new-password-input")).toBeEmpty();
      await expect(page.getByTestId("confirm-password-input")).toBeEmpty();
    });
  });
});
