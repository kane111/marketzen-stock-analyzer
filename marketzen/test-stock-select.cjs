const { chromium } = require('playwright');

(async () => {
  console.log('Starting Stock Selection Diagnostic...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    console.log('1. Page loaded');

    await page.waitForTimeout(2000);

    // Check initial state
    console.log('2. Checking initial Dashboard state...');
    let canvasCount = await page.locator('canvas').count();
    console.log('   Canvas count:', canvasCount);

    // Go to Portfolio
    console.log('3. Going to Portfolio...');
    await page.locator('button:has-text("Portfolio")').first().click();
    await page.waitForTimeout(2000);

    // Go back to Dashboard
    console.log('4. Going back to Dashboard...');
    await page.locator('button:has-text("Portfolio")').first().click();
    await page.waitForTimeout(3000);

    // Check canvas again
    canvasCount = await page.locator('canvas').count();
    console.log('5. Canvas count after navigation:', canvasCount);

    // Try clicking on a stock in the watchlist
    console.log('6. Clicking on RELIANCE in watchlist...');
    await page.locator('text=Reliance Industries').first().click();
    await page.waitForTimeout(3000);

    // Check canvas again
    canvasCount = await page.locator('canvas').count();
    console.log('7. Canvas count after clicking stock:', canvasCount);

    // Check for price
    const priceText = await page.locator('text=/₹[0-9,]+/').first();
    const price = await priceText.textContent();
    console.log('8. Price found:', price);

  } catch (error) {
    console.log('Error:', error.message);
  }

  await browser.close();
  console.log('\n--- Test Complete ---');
})();
