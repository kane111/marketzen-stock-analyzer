const { chromium } = require('playwright');

(async () => {
  console.log('Starting Dashboard Diagnostic Test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    console.log('1. Page loaded');

    await page.waitForTimeout(2000);

    // Go to Portfolio
    console.log('2. Clicking Portfolio button...');
    await page.locator('button:has-text("Portfolio")').first().click();
    await page.waitForTimeout(2000);
    console.log('3. In Portfolio view');

    // Check Portfolio content
    const portfolioContent = await page.locator('body').textContent();
    console.log('4. Portfolio content preview:', portfolioContent.substring(0, 200));

    // Go back to Dashboard
    console.log('5. Clicking Portfolio button to go back to Dashboard...');
    await page.locator('button:has-text("Portfolio")').first().click();
    await page.waitForTimeout(3000);
    console.log('6. Back in Dashboard');

    // Check Dashboard content
    const dashboardContent = await page.locator('body').textContent();
    console.log('7. Dashboard content preview:', dashboardContent.substring(0, 200));

    // Check for chart canvas
    const canvasCount = await page.locator('canvas').count();
    console.log('8. Canvas elements found:', canvasCount);

    // Check for stock name
    const stockName = await page.locator('text=Reliance Industries').count();
    console.log('9. Reliance Industries text found:', stockName);

    // Check for MarketZen header
    const header = await page.locator('text=MarketZen').count();
    console.log('10. MarketZen header found:', header);

  } catch (error) {
    console.log('Error:', error.message);
  }

  await browser.close();
  console.log('\n--- Test Complete ---');
})();
