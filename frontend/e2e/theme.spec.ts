import { test, expect } from '@playwright/test';

test.describe('Thème', () => {
  test('devrait changer de thème après connexion', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 30000 }
    );
    
    await page.waitForTimeout(2000);
    
    const themeButton = page.locator('button[aria-label="Changer de thème"]');
    await expect(themeButton).toBeVisible({ timeout: 10000 });
    
    await themeButton.click();
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    
    await themeButton.click();
    await expect(html).not.toHaveClass(/dark/);
  });
});