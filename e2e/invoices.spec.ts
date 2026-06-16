import { test, expect } from '@playwright/test';

test.describe('Gestion des factures', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Aller à la page factures
    await page.click('a[href="/invoices"]');
    await page.waitForURL('/invoices');
  });

  test('devrait afficher la liste des factures', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Gestion des factures');
  });

  test('devrait créer une nouvelle facture', async ({ page }) => {
    await page.click('a:has-text("Nouvelle facture")');
    await page.waitForURL('/invoices/new');
    
    // Sélectionner un client
    await page.selectOption('select', { index: 1 });
    
    // Ajouter un article
    await page.click('button:has-text("Ajouter un article")');
    await page.selectOption('select[aria-label="Produit"]', { index: 1 });
    await page.fill('input[type="number"]', '2');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('/invoices');
    
    await expect(page.locator('table')).toBeVisible();
  });

  test('devrait télécharger le PDF d\'une facture', async ({ page }) => {
    await page.locator('button[title="PDF"]').first().click();
    
    // Vérifier que le téléchargement a commencé
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('facture');
  });
});