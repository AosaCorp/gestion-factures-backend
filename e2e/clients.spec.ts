import { test, expect } from '@playwright/test';

test.describe('Gestion des clients', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Aller à la page clients
    await page.click('a[href="/clients"]');
    await page.waitForURL('/clients');
  });

  test('devrait afficher la liste des clients', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Clients');
  });

  test('devrait créer un nouveau client', async ({ page }) => {
    await page.click('a:has-text("Nouveau")');
    await page.waitForURL('/clients/new');
    
    await page.fill('input[name="name"]', 'Client Test E2E');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '690000000');
    await page.fill('textarea[name="address"]', 'Yaoundé, Cameroun');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('/clients');
    
    await expect(page.locator('table')).toContainText('Client Test E2E');
  });

  test('devrait modifier un client', async ({ page }) => {
    // Cliquer sur le bouton modifier du premier client
    await page.locator('a[href*="/clients/edit/"]').first().click();
    await page.waitForURL(/\/clients\/edit\/\d+/);
    
    await page.fill('input[name="name"]', 'Client Modifié');
    await page.click('button[type="submit"]');
    await page.waitForURL('/clients');
    
    await expect(page.locator('table')).toContainText('Client Modifié');
  });

  test('devrait supprimer un client', async ({ page }) => {
    // Compter le nombre de clients avant suppression
    const rowsBefore = await page.locator('table tbody tr').count();
    
    // Cliquer sur le bouton supprimer
    await page.locator('button[title="Supprimer"]').first().click();
    
    // Confirmer la suppression
    page.on('dialog', dialog => dialog.accept());
    
    // Attendre que la suppression soit effectuée
    await page.waitForTimeout(1000);
    
    const rowsAfter = await page.locator('table tbody tr').count();
    expect(rowsAfter).toBe(rowsBefore - 1);
  });
});