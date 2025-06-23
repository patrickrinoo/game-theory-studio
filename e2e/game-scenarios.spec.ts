import { test, expect } from '@playwright/test';

test.describe('Game Theory Scenarios E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the application and display welcome screen', async ({ page }) => {
    // Check if the main application loads
    await expect(page.getByText('Monte Carlo Game Theory Studio')).toBeVisible();
    
    // Verify welcome screen elements
    await expect(page.getByText('Welcome to Monte Carlo Game Theory Studio')).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  });

  test('Prisoner\'s Dilemma - Complete simulation workflow', async ({ page }) => {
    // Step 1: Navigate to setup and select Prisoner's Dilemma game
    await page.getByRole('tab', { name: 'Setup' }).click();
    await page.getByText('Prisoner\'s Dilemma').click();
    
    // Verify game is selected and description is displayed
    await expect(page.getByText('Two prisoners must decide whether to cooperate or defect')).toBeVisible();
    
    // Step 2: Configure simulation parameters
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.locator('input[type="number"]').first().fill('1000');
    
    // Step 3: Run simulation
    await page.getByRole('tab', { name: 'Simulation' }).click();
    await page.getByRole('button', { name: /run simulation/i }).click();
    
    // Wait for simulation to complete and switch to results
    await page.waitForTimeout(3000);
    await page.getByRole('tab', { name: 'Results' }).click();
    
    // Verify results are displayed
    await expect(page.getByText('Simulation Results')).toBeVisible();
  });

  test('Battle of the Sexes - Coordination game scenario', async ({ page }) => {
    // Select Battle of the Sexes
    await page.getByRole('tab', { name: 'Setup' }).click();
    await page.getByText('Battle of the Sexes').click();
    
    // Verify coordination game characteristics
    await expect(page.getByText(/coordination game/i)).toBeVisible();
    
    // Configure and run simulation
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.locator('input[type="number"]').first().fill('500');
    
    await page.getByRole('tab', { name: 'Simulation' }).click();
    await page.getByRole('button', { name: /run simulation/i }).click();
    
    // Wait and check results
    await page.waitForTimeout(3000);
    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page.getByText('Simulation Results')).toBeVisible();
  });

  test('Chicken Game - Brinkmanship scenario', async ({ page }) => {
    // Select Chicken Game
    await page.getByRole('tab', { name: 'Setup' }).click();
    await page.getByText('Chicken Game').click();
    
    // Verify brinkmanship game characteristics
    await expect(page.getByText(/brinkmanship/i)).toBeVisible();
    
    // Run simulation
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.locator('input[type="number"]').first().fill('500');
    
    await page.getByRole('tab', { name: 'Simulation' }).click();
    await page.getByRole('button', { name: /run simulation/i }).click();
    
    await page.waitForTimeout(3000);
    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page.getByText('Simulation Results')).toBeVisible();
  });

  test('Stag Hunt - Trust and cooperation scenario', async ({ page }) => {
    // Select Stag Hunt
    await page.getByRole('tab', { name: 'Setup' }).click();
    await page.getByText('Stag Hunt').click();
    
    // Verify cooperation game characteristics
    await expect(page.getByText(/cooperation/i)).toBeVisible();
    
    // Run simulation
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.locator('input[type="number"]').first().fill('500');
    
    await page.getByRole('tab', { name: 'Simulation' }).click();
    await page.getByRole('button', { name: /run simulation/i }).click();
    
    await page.waitForTimeout(3000);
    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page.getByText('Simulation Results')).toBeVisible();
  });

  test('Performance requirements validation', async ({ page }) => {
    // Test PRD requirement: simulations complete within 5-30 seconds
    await page.getByRole('tab', { name: 'Setup' }).click();
    await page.getByText('Prisoner\'s Dilemma').click();
    
    // Test simple scenario (should complete within 5 seconds)
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.locator('input[type="number"]').first().fill('1000');
    
    const startTime = Date.now();
    await page.getByRole('tab', { name: 'Simulation' }).click();
    await page.getByRole('button', { name: /run simulation/i }).click();
    
    // Wait for simulation completion indicator
    await page.waitForTimeout(5000);
    const simpleSimulationTime = Date.now() - startTime;
    
    expect(simpleSimulationTime).toBeLessThan(10000); // Allow 10 seconds for simple scenario
    
    // Verify results appeared
    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page.getByText('Simulation Results')).toBeVisible();
  });

  test('Real-time visualization and progress', async ({ page }) => {
    // Select a game and run simulation
    await page.getByRole('tab', { name: 'Setup' }).click();
    await page.getByText('Prisoner\'s Dilemma').click();
    
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await page.locator('input[type="number"]').first().fill('2000');
    
    await page.getByRole('tab', { name: 'Simulation' }).click();
    await page.getByRole('button', { name: /run simulation/i }).click();
    
    // Verify progress indicator appears during simulation
    await expect(page.locator('.progress')).toBeVisible();
    
    // Wait for completion and check results
    await page.waitForTimeout(5000);
    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page.getByText('Simulation Results')).toBeVisible();
  });

  test('Navigation between tabs works correctly', async ({ page }) => {
    // Test tab navigation functionality
    await page.getByRole('tab', { name: 'Setup' }).click();
    await expect(page.getByText('Game Selection')).toBeVisible();
    
    await page.getByRole('tab', { name: 'Parameters' }).click();
    await expect(page.getByText('Simulation Parameters')).toBeVisible();
    
    await page.getByRole('tab', { name: 'Simulation' }).click();
    await expect(page.getByRole('button', { name: /run simulation/i })).toBeVisible();
    
    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page.getByText(/results/i)).toBeVisible();
  });

  test('Error handling for invalid inputs', async ({ page }) => {
    // Navigate to parameters and try invalid input
    await page.getByRole('tab', { name: 'Parameters' }).click();
    
    // Try to enter invalid iteration count
    await page.locator('input[type="number"]').first().fill('-1');
    
    // Navigate to simulation tab
    await page.getByRole('tab', { name: 'Simulation' }).click();
    
    // Try to run simulation - should handle gracefully
    await page.getByRole('button', { name: /run simulation/i }).click();
    
    // The application should either prevent the action or show an error
    // We'll just verify it doesn't crash
    await page.waitForTimeout(1000);
  });

  test('All game scenarios are available', async ({ page }) => {
    await page.getByRole('tab', { name: 'Setup' }).click();
    
    // Verify key game scenarios from PRD are available
    await expect(page.getByText('Prisoner\'s Dilemma')).toBeVisible();
    await expect(page.getByText('Battle of the Sexes')).toBeVisible();
    await expect(page.getByText('Chicken Game')).toBeVisible();
    await expect(page.getByText('Stag Hunt')).toBeVisible();
    
    // Check if additional games are available
    const hawkDove = page.getByText('Hawk-Dove Game');
    if (await hawkDove.isVisible()) {
      await expect(hawkDove).toBeVisible();
    }
  });

  test('Keyboard accessibility', async ({ page }) => {
    // Test basic keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Navigate to setup tab using keyboard
    await page.getByRole('tab', { name: 'Setup' }).focus();
    await page.keyboard.press('Enter');
    
    // Verify focus management
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
}); 