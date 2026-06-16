import { test, expect } from '@playwright/test';

test.describe('Thème', () => {
  test('devrait changer de thème après connexion', async ({ page }) => {
    // 1. Aller à la page de login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 2. Attendre que les champs soient visibles
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    // 3. Se connecter
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // 4. Cliquer sur le bouton de connexion
    await page.click('button[type="submit"]');
    
    // 5. Attendre la redirection (fonctionne sur tous les navigateurs)
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 30000 }
    );
    
    // 6. Attendre que le DOM se stabilise
    await page.waitForTimeout(2000);
    
    // 7. Vérifier que le bouton de thème existe
    const themeButton = page.locator('button[aria-label="Changer de thème"]');
    await expect(themeButton).toBeVisible({ timeout: 10000 });
    
    // 8. Changer de thème
    await themeButton.click();
    
    // 9. Vérifier que la classe dark est ajoutée
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    
    // 10. Revenir au thème clair
    await themeButton.click();
    await expect(html).not.toHaveClass(/dark/);
  });
});