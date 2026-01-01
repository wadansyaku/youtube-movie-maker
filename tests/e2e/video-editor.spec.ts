import { test, expect } from '@playwright/test';

test.describe('Video Editor', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/video-editor');
    });

    test('should display the video editor page', async ({ page }) => {
        // Check page title
        await expect(page.locator('h1')).toContainText('動画エディタ');

        // Check subtitle
        await expect(page.getByText('AI文字起こし＆テキストベース編集')).toBeVisible();
    });

    test('should show API status indicator', async ({ page }) => {
        // Should show either API Online or API Offline
        const statusIndicator = page.locator('text=/API (Online|Offline)/');
        await expect(statusIndicator).toBeVisible();
    });

    test('should display mode tabs', async ({ page }) => {
        // Check for mode selection buttons
        await expect(page.getByRole('button', { name: /動画編集モード/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /テキストから生成/i })).toBeVisible();
    });

    test('should switch between edit and generate modes', async ({ page }) => {
        // Click on generate mode
        await page.getByRole('button', { name: /テキストから生成/i }).click();

        // Should see script input textarea
        await expect(page.locator('textarea[placeholder*="台本"]')).toBeVisible();

        // Click back to edit mode
        await page.getByRole('button', { name: /動画編集モード/i }).click();

        // Should see upload zone
        await expect(page.getByText('クリックして動画をアップロード')).toBeVisible();
    });

    test('should show upload zone in edit mode', async ({ page }) => {
        // Make sure we're in edit mode
        await page.getByRole('button', { name: /動画編集モード/i }).click();

        // Check upload zone
        await expect(page.getByText('クリックして動画をアップロード')).toBeVisible();
        await expect(page.getByText('MP4, MOV, AVI, MKV に対応')).toBeVisible();
    });

    test('should toggle dynamic slides checkbox', async ({ page }) => {
        const checkbox = page.locator('input[type="checkbox"]').filter({ has: page.locator('+ text=Dynamic Slides') });

        // Get initial state
        const initialState = await checkbox.isChecked();

        // Toggle
        await checkbox.click();

        // Check state changed
        const newState = await checkbox.isChecked();
        expect(newState).not.toBe(initialState);
    });

    test('should show script editor in generate mode', async ({ page }) => {
        // Switch to generate mode
        await page.getByRole('button', { name: /テキストから生成/i }).click();

        // Check for script editor elements
        await expect(page.getByText('台本入力')).toBeVisible();
        await expect(page.locator('textarea')).toBeVisible();

        // Check for action buttons
        await expect(page.getByRole('button', { name: /AIで改善/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /動画を生成/i })).toBeVisible();
    });

    test('should have language selector in generate mode', async ({ page }) => {
        // Switch to generate mode
        await page.getByRole('button', { name: /テキストから生成/i }).click();

        // Check for language selector
        const languageSelect = page.locator('select').filter({ has: page.locator('option[value="ja"]') });
        await expect(languageSelect).toBeVisible();

        // Should have Japanese and English options
        await expect(languageSelect.locator('option[value="ja"]')).toBeVisible();
        await expect(languageSelect.locator('option[value="en"]')).toBeVisible();
    });

    test('should disable generate button when script is empty', async ({ page }) => {
        // Switch to generate mode
        await page.getByRole('button', { name: /テキストから生成/i }).click();

        // Generate button should be disabled
        const generateButton = page.getByRole('button', { name: /動画を生成/i });
        await expect(generateButton).toBeDisabled();
    });

    test('should enable generate button when script has content', async ({ page }) => {
        // Switch to generate mode
        await page.getByRole('button', { name: /テキストから生成/i }).click();

        // Enter some script content
        await page.locator('textarea').fill('テスト台本の内容です');

        // Generate button should be enabled
        const generateButton = page.getByRole('button', { name: /動画を生成/i });
        await expect(generateButton).toBeEnabled();
    });
});

test.describe('Video Editor - Keyboard Shortcuts', () => {
    test('should support Ctrl+Z for undo', async ({ page }) => {
        await page.goto('/video-editor');

        // This is a basic test - in a real scenario with segments loaded,
        // pressing Ctrl+Z should trigger undo
        await page.keyboard.press('Control+z');

        // No error should occur
    });

    test('should support Ctrl+S for save modal', async ({ page }) => {
        await page.goto('/video-editor');

        // Ctrl+S should not cause navigation (prevented)
        await page.keyboard.press('Control+s');

        // Page should still be video editor
        await expect(page.locator('h1')).toContainText('動画エディタ');
    });
});

test.describe('Video Editor - API Offline State', () => {
    test('should show API offline warning when API is not running', async ({ page }) => {
        // Block API health endpoint
        await page.route('**/health', (route) => {
            route.abort();
        });

        await page.goto('/video-editor');

        // Should show offline status
        await expect(page.getByText('API Offline')).toBeVisible();

        // Should show warning message
        await expect(page.getByText('APIサーバーが起動していません')).toBeVisible();

        // Should show the command to start API
        await expect(page.getByText('npm run dev:api')).toBeVisible();
    });
});
