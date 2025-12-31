const { chromium } = require('playwright');

(async () => {
  console.log('Starting Deep Diagnostic Test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  page.on('console', msg => {
    console.log(`Console [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    console.log('Stack:', error.stack);
  });

  try {
    console.log('\n1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    console.log('2. Page loaded');

    // Wait for initial render
    await page.waitForTimeout(2000);

    // Click Portfolio button
    console.log('3. Clicking Portfolio button...');
    await page.locator('button:has-text("Portfolio")').click();
    await page.waitForTimeout(3000);

    // Check for any visible text
    console.log('4. Checking page content after click...');
    const bodyText = await page.locator('body').textContent();
    console.log('5. Body text preview:', bodyText.substring(0, 500));

    // Check if PortfolioTracker is in the DOM
    const portfolioElements = await page.locator('text=Portfolio Tracker').all();
    console.log('6. Portfolio Tracker elements:', portfolioElements.length);

    // Check for any h2 elements
    const h2Elements = await page.locator('h2').all();
    console.log('7. H2 elements found:', h2Elements.length);
    for (let i = 0; i < h2Elements.length; i++) {
      const text = await h2Elements[i].textContent();
      console.log(`   H2 ${i + 1}:`, text);
    }

    // Check for any error messages
    const errorElements = await page.locator('.text-negative, .text-red-500, .error').all();
    console.log('8. Error elements found:', errorElements.length);

  } catch (error) {
    console.log('\n--- Test Error ---');
    console.log(error.message);
    console.log(error.stack);
  }

  await browser.close();
  console.log('\n--- Test Complete ---');
})();
