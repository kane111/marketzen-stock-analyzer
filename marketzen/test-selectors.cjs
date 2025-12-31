const { chromium } = require('playwright');

(async () => {
  console.log('Finding Icon Selectors...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('1. Looking for all SVG elements...');
    const allSvgs = await page.locator('svg').all();
    console.log(`   Found ${allSvgs.length} SVG elements`);

    console.log('\n2. Checking SVG attributes...');
    for (let i = 0; i < Math.min(10, allSvgs.length); i++) {
      const svg = allSvgs[i];
      const outerHTML = await svg.evaluate(el => el.outerHTML);
      console.log(`   SVG ${i + 1}:`, outerHTML.substring(0, 100));
    }

    console.log('\n3. Looking for Activity icon...');
    // Try different selectors
    const activityByTitle = await page.locator('[title="Technical Analysis"]').all();
    console.log('   Elements with title="Technical Analysis":', activityByTitle.length);

    const activityByPath = await page.locator('svg path[d*="activity"], svg path[d*="Activity"]').all();
    console.log('   Elements with activity path:', activityByPath.length);

    const activityByClass = await page.locator('.text-primary svg').all();
    console.log('   Primary colored SVGs:', activityByClass.length);

    console.log('\n4. Looking for Sliders icon (in Technical Analysis view)...');
    // First navigate to Technical Analysis
    const analyzeBtn = page.locator('aside').locator('button').nth(1); // Second button in sidebar
    const btnCount = await analyzeBtn.count();
    console.log('   Sidebar buttons found:', btnCount);

    if (btnCount > 0) {
      await analyzeBtn.click();
      await page.waitForTimeout(2000);

      console.log('   After clicking analyze, looking for Sliders...');
      const slidersByTitle = await page.locator('[title*="Configure"], [title*="config"]').all();
      console.log('   Configure buttons:', slidersByTitle.length);

      const configureText = await page.locator('button:has-text("Configure")').all();
      console.log('   Buttons with Configure text:', configureText.length);
    }

    console.log('\n5. Looking for all buttons with icons...');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(15, buttons.length); i++) {
      const btn = buttons[i];
      const text = await btn.textContent();
      const html = await btn.innerHTML();
      console.log(`   Button ${i + 1}: text="${text?.substring(0, 30)}", html contains svg:`, html.includes('<svg'));
    }

  } catch (error) {
    console.log('Error:', error.message);
  }

  await browser.close();
  console.log('\n--- Test Complete ---');
})();
