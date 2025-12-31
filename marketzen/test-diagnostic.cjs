const { chromium } = require('playwright');

(async () => {
  console.log('Starting Diagnostic Test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  page.on('console', msg => {
    console.log(`Console [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log('Page Error:', error.message);
  });

  try {
    // Navigate to the application
    console.log('\n1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'domcontentloaded' });
    console.log('2. Page DOM loaded');

    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    console.log('3. Waited for React to render');

    // Get the page content
    const content = await page.content();
    console.log('4. Page content length:', content.length);

    // Check if Portfolio button exists
    const portfolioButton = await page.locator('button:has-text("Portfolio")');
    const count = await portfolioButton.count();
    console.log('5. Portfolio button count:', count);

    if (count > 0) {
      console.log('6. Portfolio button found, clicking...');
      await portfolioButton.click();
      await page.waitForTimeout(1000);
      console.log('7. Clicked Portfolio button');
      
      // Check if Portfolio Tracker header is visible
      const portfolioHeader = await page.locator('h2:has-text("Portfolio Tracker")');
      const headerCount = await portfolioHeader.count();
      console.log('8. Portfolio Tracker header count:', headerCount);
    } else {
      console.log('6. Portfolio button NOT found');
      // Try to find any button with Wallet icon
      const walletButtons = await page.locator('button').all();
      console.log('7. Total buttons found:', walletButtons.length);
      
      // Print first few buttons
      for (let i = 0; i < Math.min(5, walletButtons.length); i++) {
        const text = await walletButtons[i].textContent();
        console.log(`   Button ${i + 1}:`, text?.substring(0, 50));
      }
    }

  } catch (error) {
    console.log('\n--- Test Error ---');
    console.log(error.message);
  }

  await browser.close();
  console.log('\n--- Test Complete ---');
})();
