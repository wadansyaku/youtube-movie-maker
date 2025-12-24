import { test, expect } from "@playwright/test";

test.describe("Export Flow", () => {
    test("should display runs page with cost tracking", async ({ page }) => {
        await page.goto("/runs");

        // Check runs page elements
        await expect(page.locator("h1")).toContainText("Generation Runs");
        await expect(page.locator("text=Total Runs")).toBeVisible();
        await expect(page.locator("text=Total Credits")).toBeVisible();
        await expect(page.locator("text=Total Cost")).toBeVisible();
    });

    test("should open new run form", async ({ page }) => {
        await page.goto("/runs");

        // Click new run button
        await page.click("text=New Run");

        // Form should be visible
        await expect(page.locator("text=Register New Run")).toBeVisible();
        await expect(page.locator("text=Asset ID")).toBeVisible();
        await expect(page.locator("text=Platform")).toBeVisible();
        await expect(page.locator("text=Prompt")).toBeVisible();
    });

    test("should display prompts library", async ({ page }) => {
        await page.goto("/prompts");

        // Check prompts page elements
        await expect(page.locator("h1")).toContainText("Prompt Library");
        await expect(page.locator("text=New Prompt")).toBeVisible();
    });

    test("should create new prompt", async ({ page }) => {
        await page.goto("/prompts");

        // Click new prompt button
        await page.click("text=New Prompt");

        // Form should be visible
        await expect(page.locator("text=Create New Prompt")).toBeVisible();

        // Fill form
        await page.fill('input[placeholder="Prompt name"]', "Test Prompt");
        await page.fill(
            'textarea[placeholder*="Write your prompt"]',
            "A cinematic shot of {subject} in {location}"
        );

        // Check variables are detected
        await expect(page.locator("text={subject}")).toBeVisible();
        await expect(page.locator("text={location}")).toBeVisible();
    });
});
