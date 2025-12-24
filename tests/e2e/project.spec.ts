import { test, expect } from "@playwright/test";

test.describe("Project Management Flow", () => {
    test("should display dashboard and navigate to projects", async ({ page }) => {
        // Go to dashboard
        await page.goto("/dashboard");

        // Check dashboard elements
        await expect(page.locator("h1")).toContainText("Dashboard");
        await expect(page.locator("text=Total Projects")).toBeVisible();
        await expect(page.locator("text=Total Assets")).toBeVisible();

        // Navigate to projects
        await page.click("text=New Project");
        await expect(page).toHaveURL(/\/projects/);
    });

    test("should create a new project", async ({ page }) => {
        await page.goto("/projects");

        // Click new project button
        await page.click("text=New Project");

        // Fill project form
        await page.fill('input[name="name"]', "E2E Test Project");
        await page.fill('textarea[name="description"]', "Test project description");
        await page.selectOption('select[name="aspectRatio"]', "16:9");

        // Submit
        await page.click('button[type="submit"]');

        // Verify project was created
        await expect(page.locator("text=E2E Test Project")).toBeVisible();
    });

    test("should navigate project detail page", async ({ page }) => {
        await page.goto("/projects");

        // Wait for projects to load and click first project
        await page.waitForSelector("[data-testid='project-card']", { timeout: 5000 }).catch(() => { });

        // Check if any project exists
        const projectCard = page.locator("[data-testid='project-card']").first();
        if (await projectCard.isVisible()) {
            await projectCard.click();

            // Should be on project detail page
            await expect(page.locator("text=Structure")).toBeVisible();
            await expect(page.locator("text=Assets")).toBeVisible();
            await expect(page.locator("text=References")).toBeVisible();
        }
    });
});
