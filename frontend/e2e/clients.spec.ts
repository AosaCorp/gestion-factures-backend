import { test, expect } from '@playwright/test';

test.describe('Gestion des clients', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 30000 }
    );
    await page.waitForTimeout(2000);
  });

  test('devrait afficher la liste des clients', async ({ page }) => {
    await page.click('a[href="/clients"]');
    await page.waitForURL('**/clients');
    await expect(page.locator('h1')).toContainText('Clients');
  });

  test('devrait créer un nouveau client', async ({ page }) => {
    await page.click('a[href="/clients"]');
    await page.click('a:has-text("Nouveau")');
    await page.waitForURL('**/clients/new');
    
    await page.fill('input[name="name"]', 'Client Test E2E');
    await page.fill('input[name="email"]', 'test-e2e@example.com');
    await page.fill('input[name="phone"]', '690000000');
    await page.fill('textarea[name="address"]', 'Yaoundé, Cameroun');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/clients', { timeout: 15000 });
    
    await page.waitForSelector('table', { timeout: 10000 });
    await expect(page.locator('table')).toContainText('Client Test E2E');
  });
});