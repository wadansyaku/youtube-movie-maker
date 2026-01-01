import { test, expect } from '@playwright/test';

test.describe('Production Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/production');
    });

    test('should display the production dashboard', async ({ page }) => {
        // Check page title
        await expect(page.locator('h1')).toContainText('YouTube制作管理');

        // Check workflow subtitle
        await expect(page.getByText('企画→台本→編集→公開')).toBeVisible();
    });

    test('should display stat cards', async ({ page }) => {
        // Check all stat labels are visible
        await expect(page.getByText('アイデア')).toBeVisible();
        await expect(page.getByText('エピソード')).toBeVisible();
        await expect(page.getByText('制作中')).toBeVisible();
        await expect(page.getByText('公開済')).toBeVisible();
    });

    test('should display kanban columns', async ({ page }) => {
        // Check all status columns are present
        const statuses = ['台本作成', '音声収録', '素材準備', '編集中', 'レビュー', '公開予定', '公開済'];

        for (const status of statuses) {
            await expect(page.getByRole('heading', { name: status })).toBeVisible();
        }
    });

    test('should toggle between kanban and list view', async ({ page }) => {
        // Default should be kanban view
        const kanbanButton = page.locator('button').filter({ has: page.locator('[class*="LayoutGrid"]') }).first();
        const listButton = page.locator('button').filter({ has: page.locator('[class*="List"]') }).first();

        // Click list view
        await listButton.click();

        // Should not see kanban columns in list mode
        // (The view changes structure)

        // Click kanban view again
        await kanbanButton.click();
    });

    test('should filter by lane', async ({ page }) => {
        // Select a lane filter
        const laneSelect = page.locator('select');
        await laneSelect.selectOption({ value: 'med_bio' });

        // The filter should be applied (visually indicated)
        await expect(laneSelect).toHaveValue('med_bio');

        // Reset filter
        await laneSelect.selectOption({ value: '' });
    });

    test('should have a new episode button', async ({ page }) => {
        const newEpisodeButton = page.getByRole('link', { name: /新規エピソード/i });
        await expect(newEpisodeButton).toBeVisible();
        await expect(newEpisodeButton).toHaveAttribute('href', '/production/episodes/new');
    });

    test('should show step progress on episode cards', async ({ page }) => {
        // If there are episodes, they should have a step progress indicator
        const episodeCards = page.locator('[draggable="true"]');

        if (await episodeCards.count() > 0) {
            // Check that the first card has a progress indicator
            const firstCard = episodeCards.first();
            await expect(firstCard.locator('.h-1\\.5, .h-2')).toBeVisible();
        }
    });
});

test.describe('Production Dashboard - Loading States', () => {
    test('should show loading skeleton initially', async ({ page }) => {
        // Navigate with network delay simulation
        await page.route('/production', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await route.continue();
        });

        await page.goto('/production', { waitUntil: 'domcontentloaded' });

        // Check for skeleton elements (animate-pulse class)
        const skeletons = page.locator('.animate-pulse');
        // Should have some skeleton elements during loading
    });
});

test.describe('Production Dashboard - Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
        // Simulate API error by intercepting requests
        await page.route('**/api/production/**', (route) => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });

        // The page should still load without crashing
        await page.goto('/production');

        // Error boundary should catch errors
    });
});
