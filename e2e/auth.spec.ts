import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('devrait afficher la page de connexion', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('devrait se connecter avec les identifiants valides', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/');
    await expect(page.locator('h1')).toContainText('Bonjour');
  });

  test('devrait échouer avec des identifiants invalides', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.bg-red-100')).toBeVisible();
  });

  test('devrait se déconnecter', async ({ page }) => {
    // Se connecter d'abord
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Se déconnecter
    await page.click('button[title="Déconnexion"]');
    await page.waitForURL('/login');
    await expect(page.locator('h2')).toContainText('Connexion');
  });
});