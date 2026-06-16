import { test, expect } from '@playwright/test';

test.describe('Gestion des produits', () => {
  test.beforeEach(async ({ page }) => {
    // Connexion
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

  test('devrait afficher la liste des produits', async ({ page }) => {
    await page.click('a[href="/products"]');
    await page.waitForURL('**/products');
    await expect(page.locator('h1')).toContainText('Gestion des produits');
  });

  test('devrait créer un nouveau produit', async ({ page }) => {
    // Aller à la page des produits
    await page.click('a[href="/products"]');
    await page.waitForURL('**/products');
    
    // Cliquer sur Nouveau produit
    await page.click('a:has-text("Nouveau produit")');
    await page.waitForURL('**/products/new');
    
    // Remplir le formulaire
    await page.fill('input[name="name"]', 'Produit Test E2E');
    await page.fill('input[name="category"]', 'Informatique');
    await page.fill('textarea[name="description"]', 'Description du produit test');
    await page.fill('input[name="price"]', '10000');
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Attendre la redirection
    await page.waitForURL('**/products', { timeout: 15000 });
    
    // Attendre que le tableau se charge
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Vérifier que le produit apparaît dans la liste
    await expect(page.locator('table')).toContainText('Produit Test E2E');
  });
});