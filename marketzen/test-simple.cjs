const { chromium } = require('playwright');

(async () => {
  console.log('Starting Simple Portfolio Test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  try {
    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    console.log('2. Page loaded');

    // Wait for the page to stabilize
    await page.waitForTimeout(2000);

    console.log('3. Looking for Portfolio button...');
    const portfolioButton = page.locator('button:has-text("Portfolio")');
    const count = await portfolioButton.count();
    console.log(`4. Found ${count} Portfolio buttons`);

    if (count > 0) {
      console.log('5. Clicking Portfolio button...');
      await portfolioButton.click();
      
      // Wait for the view to change
      await page.waitForTimeout(2000);
      console.log('6. Clicked Portfolio button');

      console.log('7. Looking for My Portfolio header...');
      const header = page.locator('h2:has-text("My Portfolio")');
      const headerCount = await header.count();
      console.log(`8. Found ${headerCount} My Portfolio headers`);

      if (headerCount > 0) {
        console.log('✓ Portfolio navigation test PASSED');
        passed++;
      } else {
        console.log('✗ Portfolio navigation test FAILED - header not found');
        failed++;
        
        // Debug: show what's on the page
        const bodyText = await page.locator('body').textContent();
        console.log('Body text preview:', bodyText.substring(0, 300));
      }
    } else {
      console.log('✗ Portfolio button not found');
      failed++;
    }

  } catch (error) {
    console.log('✗ Test failed with error:', error.message);
    failed++;
  }

  await browser.close();

  console.log('\n--- Test Summary ---');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
  console.log('\n✓ Test passed!');
})();
