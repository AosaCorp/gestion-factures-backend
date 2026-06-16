import { test, expect } from '@playwright/test';

test.describe('Gestion des factures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 30000 }
    );
    await page.waitForTimeout(2000);
  });

  test('devrait afficher la liste des factures', async ({ page }) => {
    await page.click('a[href="/invoices"]');
    await page.waitForURL('**/invoices');
    await expect(page.locator('h1')).toContainText('Gestion des factures');
  });

  test('devrait accéder au formulaire de création', async ({ page }) => {
    await page.click('a[href="/invoices"]');
    await page.click('a:has-text("Nouvelle facture")');
    await page.waitForURL('**/invoices/new');
    await expect(page.locator('h1')).toContainText('Nouvelle facture');
  });
});