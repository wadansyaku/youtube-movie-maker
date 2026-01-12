import { test, expect } from '@playwright/test';

test.describe('Production List', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/production');
    });

    test('should display production list header', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('投稿管理');
        await expect(page.getByText('エピソード一覧')).toBeVisible();
    });

    test('should show episodes or empty state', async ({ page }) => {
        const episodeLinks = page.locator('a[href^="/production/episodes/"]');
        const hasEpisodes = await episodeLinks.count();

        if (hasEpisodes > 0) {
            await expect(episodeLinks.first()).toBeVisible();
        } else {
            await expect(page.getByText('まだエピソードがありません')).toBeVisible();
        }
    });
});
