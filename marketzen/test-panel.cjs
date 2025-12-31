const { chromium } = require('playwright');

(async () => {
  console.log('Debugging Indicator Config Panel...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('Page Error:', error.message);
  });

  try {
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('1. Going to Technical Analysis...');
    await page.locator('button:has-text("Technical Analysis")').first().click();
    await page.waitForTimeout(3000);

    console.log('2. Clicking Configure button...');
    await page.locator('button:has-text("Configure")').first().click();
    await page.waitForTimeout(2000);

    console.log('3. Checking page content...');
    const bodyText = await page.locator('body').textContent();
    console.log('   Body text contains "Indicator Parameters":', bodyText.includes('Indicator Parameters'));
    console.log('   Body text contains "Apply Changes":', bodyText.includes('Apply Changes'));
    console.log('   Body text contains "RSI":', bodyText.includes('RSI'));
    console.log('   Body text contains "MACD":', bodyText.includes('MACD'));

    console.log('\n4. Looking for all h2 elements...');
    const h2Elements = await page.locator('h2').all();
    for (let i = 0; i < h2Elements.length; i++) {
      const text = await h2Elements[i].textContent();
      console.log(`   H2 ${i + 1}: ${text}`);
    }

    console.log('\n5. Looking for all h3 elements...');
    const h3Elements = await page.locator('h3').all();
    for (let i = 0; i < h3Elements.length; i++) {
      const text = await h3Elements[i].textContent();
      console.log(`   H3 ${i + 1}: ${text}`);
    }

    console.log('\n6. Checking for modals/overlays...');
    const fixedElements = await page.locator('.fixed, [class*="fixed"]').count();
    console.log('   Fixed position elements:', fixedElements);

    const z50Elements = await page.locator('[class*="z-50"], [class*="z50"]').count();
    console.log('   High z-index elements:', z50Elements);

  } catch (error) {
    console.log('Error:', error.message);
  }

  await browser.close();
  console.log('\n--- Test Complete ---');
})();
