import { test, expect } from '@playwright/test';

test.describe('Gestion des produits', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Aller à la page produits
    await page.click('a[href="/products"]');
    await page.waitForURL('/products');
  });

  test('devrait afficher la liste des produits', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Gestion des produits');
  });

  test('devrait créer un nouveau produit', async ({ page }) => {
    await page.click('a:has-text("Nouveau produit")');
    await page.waitForURL('/products/new');
    
    await page.fill('input[name="name"]', 'Produit Test E2E');
    await page.fill('input[name="category"]', 'Informatique');
    await page.fill('textarea[name="description"]', 'Description du produit test');
    await page.fill('input[name="price"]', '10000');
    await page.fill('input[name="taxRate"]', '19.25');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('/products');
    
    await expect(page.locator('table')).toContainText('Produit Test E2E');
  });

  test('devrait modifier un produit', async ({ page }) => {
    await page.locator('a[href*="/products/edit/"]').first().click();
    await page.waitForURL(/\/products\/edit\/\d+/);
    
    await page.fill('input[name="name"]', 'Produit Modifié');
    await page.click('button[type="submit"]');
    await page.waitForURL('/products');
    
    await expect(page.locator('table')).toContainText('Produit Modifié');
  });
});