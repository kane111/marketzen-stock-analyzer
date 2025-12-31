const { chromium } = require('playwright');

(async () => {
  console.log('Debugging Configure Button...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('1. Going to Technical Analysis...');
    const analyzeBtn = page.locator('button:has-text("Technical Analysis")').first();
    await analyzeBtn.click();
    await page.waitForTimeout(3000);

    console.log('2. Checking for Configure elements...');
    const configureBtn = page.locator('button:has-text("Configure")');
    const configureCount = await configureBtn.count();
    console.log('   Configure button count:', configureCount);

    if (configureCount > 0) {
      console.log('3. Configure button found, clicking...');
      await configureBtn.click();
      await page.waitForTimeout(1000);

      console.log('4. Checking for Indicator Parameters panel...');
      const configPanel = page.locator('h2:has-text("Indicator Parameters")');
      const panelCount = await configPanel.count();
      console.log('   Config panel count:', panelCount);

      if (panelCount > 0) {
        console.log('5. Config panel found, clicking Apply Changes...');
        const applyBtn = page.locator('button:has-text("Apply Changes")');
        const applyCount = await applyBtn.count();
        console.log('   Apply button count:', applyCount);

        if (applyCount > 0) {
          await applyBtn.click();
          await page.waitForTimeout(1000);
          console.log('6. Applied changes successfully');
        }
      }
    } else {
      console.log('3. Configure button NOT found, checking all buttons...');
      const allBtns = await page.locator('button').all();
      console.log('   Total buttons:', allBtns.length);

      for (let i = 0; i < Math.min(20, allBtns.length); i++) {
        const text = await allBtns[i].textContent();
        console.log(`   Button ${i + 1}: "${text?.substring(0, 30)}"`);
      }

      console.log('\n4. Checking for Sliders icon...');
      const slidersIcon = await page.locator('svg').all();
      console.log('   Total SVGs:', slidersIcon.length);

      // Check if we're actually in Technical Analysis view
      const taHeader = await page.locator('text=Technical Analysis').count();
      console.log('   Technical Analysis text count:', taHeader);
    }

  } catch (error) {
    console.log('Error:', error.message);
  }

  await browser.close();
  console.log('\n--- Test Complete ---');
})();
