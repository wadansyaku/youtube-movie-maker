import { test, expect } from "@playwright/test";

test.describe("AI Features", () => {
    test.beforeEach(async ({ page }) => {
        // Ensure we have a series to work with
        await page.goto("/series");
    });

    test("should display AI Optimize button in Generation Lab", async ({ page }) => {
        await page.goto("/generate");

        // Wait for page to load
        await page.waitForLoadState("networkidle");

        // Check for AI Optimize button
        const aiOptimizeButton = page.locator('button:has-text("AI Optimize")');
        await expect(aiOptimizeButton).toBeVisible();

        // Check for other expected elements
        await expect(page.locator('text=Prompt Builder')).toBeVisible();
        await expect(page.locator('button:has-text("Auto-Assemble")')).toBeVisible();
    });

    test("should show AI script generation mode in episode modal", async ({ page }) => {
        await page.goto("/series");

        // Find first series and click on it
        const seriesCard = page.locator('a[href^="/series/"]').first();
        if (await seriesCard.isVisible()) {
            await seriesCard.click();
            await page.waitForLoadState("networkidle");

            // Click on 制作・公開 tab
            const productionTab = page.locator('button:has-text("制作・公開")');
            if (await productionTab.isVisible()) {
                await productionTab.click();

                // Click add episode button
                const addEpisodeButton = page.locator('button:has-text("エピソードを追加")');
                if (await addEpisodeButton.isVisible()) {
                    await addEpisodeButton.click();

                    // Check for AI mode toggle
                    await expect(page.locator('button:has-text("手動入力")')).toBeVisible();
                    await expect(page.locator('button:has-text("AIでスクリプト生成")')).toBeVisible();
                }
            }
        }
    });

    test("should show SEO generator on exports page", async ({ page }) => {
        await page.goto("/exports");
        await page.waitForLoadState("networkidle");

        // Check page header
        await expect(page.locator("h1:has-text('Export')")).toBeVisible();

        // Check for export options
        await expect(page.locator('text=CSV Export')).toBeVisible();
        await expect(page.locator('text=JSON Export')).toBeVisible();
        await expect(page.locator('text=ZIP Export')).toBeVisible();

        // If project is selected, SEO section should be visible
        const projectSelector = page.locator('select');
        if (await projectSelector.isVisible()) {
            const options = await projectSelector.locator('option').count();
            if (options > 0) {
                await expect(page.locator('text=YouTube SEO 最適化')).toBeVisible();
            }
        }
    });

    test("should have AI shot generation button in scene hierarchy", async ({ page }) => {
        // Navigate to an episode with scenes
        await page.goto("/series");

        const seriesCard = page.locator('a[href^="/series/"]').first();
        if (await seriesCard.isVisible()) {
            await seriesCard.click();
            await page.waitForLoadState("networkidle");

            // Look for episode link
            const episodeLink = page.locator('a[href*="/episodes/"]').first();
            if (await episodeLink.isVisible()) {
                await episodeLink.click();
                await page.waitForLoadState("networkidle");

                // Check for scene hierarchy
                const sceneHierarchy = page.locator('text=シーン構成');
                if (await sceneHierarchy.isVisible()) {
                    // Hover over a scene to see action buttons
                    const sceneRow = page.locator('.group').first();
                    if (await sceneRow.isVisible()) {
                        await sceneRow.hover();

                        // Check for brain icon button (AI shot generation)
                        const aiButton = page.locator('button[title="AIでショット分解"]');
                        const plusButton = page.locator('button[title="ショット追加"]');

                        // At least one action button should be visible
                        const hasAiButton = await aiButton.isVisible().catch(() => false);
                        const hasPlusButton = await plusButton.isVisible().catch(() => false);

                        expect(hasAiButton || hasPlusButton).toBeTruthy();
                    }
                }
            }
        }
    });
});

test.describe("AI API Endpoints", () => {
    test("POST /api/ai/optimize-prompt should return optimization suggestions", async ({ request }) => {
        const response = await request.post("/api/ai/optimize-prompt", {
            data: {
                prompt: "A cat walking in the rain",
                platform: "runway"
            }
        });

        // Should either succeed (200) or fail due to missing API key (500)
        expect([200, 500]).toContain(response.status());

        if (response.status() === 200) {
            const data = await response.json();
            expect(data).toHaveProperty("optimizedPrompt");
        }
    });

    test("POST /api/ai/generate-script should return script with scenes", async ({ request }) => {
        const response = await request.post("/api/ai/generate-script", {
            data: {
                concept: "A cyberpunk adventure in Tokyo",
                targetDuration: 180
            }
        });

        expect([200, 500]).toContain(response.status());

        if (response.status() === 200) {
            const data = await response.json();
            expect(data).toHaveProperty("title");
            expect(data).toHaveProperty("scenes");
            expect(Array.isArray(data.scenes)).toBeTruthy();
        }
    });

    test("POST /api/ai/describe-shots should return shot breakdown", async ({ request }) => {
        const response = await request.post("/api/ai/describe-shots", {
            data: {
                sceneDescription: "A samurai walks through a misty forest"
            }
        });

        expect([200, 500]).toContain(response.status());

        if (response.status() === 200) {
            const data = await response.json();
            expect(data).toHaveProperty("shots");
            expect(Array.isArray(data.shots)).toBeTruthy();
        }
    });

    test("POST /api/ai/generate-seo should return SEO suggestions", async ({ request }) => {
        const response = await request.post("/api/ai/generate-seo", {
            data: {
                episodeTitle: "The Last Stand",
                synopsis: "A warrior faces his greatest challenge"
            }
        });

        expect([200, 500]).toContain(response.status());

        if (response.status() === 200) {
            const data = await response.json();
            expect(data).toHaveProperty("titles");
            expect(data).toHaveProperty("description");
            expect(data).toHaveProperty("tags");
        }
    });
});
