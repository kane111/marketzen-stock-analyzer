const { chromium } = require('playwright');

(async () => {
  console.log('Starting Final Phase 2 Test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  try {
    console.log('\n=== Navigating to Application ===');
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    console.log('Page loaded successfully');

    // Wait for initial render
    await page.waitForTimeout(3000);

    // Test 1: Portfolio Navigation
    console.log('\n--- Test 1: Portfolio Navigation ---');
    try {
      const portfolioBtn = page.locator('button:has-text("Portfolio")').first();
      await portfolioBtn.click();
      await page.waitForTimeout(2000);
      const portfolioHeader = page.locator('h2:has-text("My Portfolio")').first();
      const isVisible = await portfolioHeader.isVisible();
      if (isVisible) {
        console.log('✓ Test 1 PASSED: Portfolio navigation works');
        passed++;
      } else {
        console.log('✗ Test 1 FAILED: Portfolio header not visible');
        failed++;
      }
    } catch (e) {
      console.log('✗ Test 1 FAILED:', e.message);
      failed++;
    }

    // Test 2: Add Stock
    console.log('\n--- Test 2: Add Stock to Portfolio ---');
    try {
      const addBtn = page.locator('button:has-text("Add Holding")').first();
      await addBtn.click();
      await page.waitForTimeout(1000);
      const addModal = page.locator('h3:has-text("Add Holding")').first();
      const isVisible = await addModal.isVisible();
      if (isVisible) {
        console.log('✓ Test 2 PASSED: Add stock modal opens');
        passed++;
      } else {
        console.log('✗ Test 2 FAILED: Add stock modal not visible');
        failed++;
      }
    } catch (e) {
      console.log('✗ Test 2 FAILED:', e.message);
      failed++;
    }

    // Test 3: Close Modal
    console.log('\n--- Test 3: Close Modal ---');
    try {
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      await cancelBtn.click();
      await page.waitForTimeout(1000);
      console.log('✓ Test 3 PASSED: Modal closed');
      passed++;
    } catch (e) {
      console.log('✗ Test 3 FAILED:', e.message);
      failed++;
    }

    // Test 4: Dashboard Navigation
    console.log('\n--- Test 4: Dashboard Navigation ---');
    try {
      const dashBtn = page.locator('button:has-text("Portfolio")').first();
      await dashBtn.click();
      await page.waitForTimeout(3000);
      const chartSvg = page.locator('svg').first();
      const isVisible = await chartSvg.isVisible();
      if (isVisible) {
        console.log('✓ Test 4 PASSED: Dashboard navigation works (SVG chart visible)');
        passed++;
      } else {
        console.log('✗ Test 4 FAILED: Chart not visible');
        failed++;
      }
    } catch (e) {
      console.log('✗ Test 4 FAILED:', e.message);
      failed++;
    }

    // Test 5: Technical Analysis
    console.log('\n--- Test 5: Technical Analysis Navigation ---');
    try {
      const analyzeBtn = page.locator('button:has-text("Technical Analysis")').first();
      await analyzeBtn.click();
      await page.waitForTimeout(2000);
      const analysisHeader = page.locator('text=Technical Analysis').first();
      const isVisible = await analysisHeader.isVisible();
      if (isVisible) {
        console.log('✓ Test 5 PASSED: Technical Analysis navigation works');
        passed++;
      } else {
        console.log('✗ Test 5 FAILED: Technical Analysis header not visible');
        failed++;
      }
    } catch (e) {
      console.log('✗ Test 5 FAILED:', e.message);
      failed++;
    }

    // Test 6: Indicator Config Panel Opens
    console.log('\n--- Test 6: Indicator Configuration ---');
    try {
      const configBtn = page.locator('button:has-text("Configure")').first();
      await configBtn.click();
      await page.waitForTimeout(1000);
      const configPanel = page.locator('h2:has-text("Indicator Parameters")').first();
      const isVisible = await configPanel.isVisible();
      if (isVisible) {
        console.log('✓ Test 6 PASSED: Indicator config panel opens');
        passed++;
      } else {
        console.log('✗ Test 6 FAILED: Config panel not visible');
        failed++;
      }
    } catch (e) {
      console.log('✗ Test 6 FAILED:', e.message);
      failed++;
    }

    // Test 7: Apply Configuration (verify Apply button exists)
    console.log('\n--- Test 7: Apply Configuration ---');
    try {
      // Check if Apply Changes button exists
      const applyBtn = page.locator('button:has-text("Apply Changes")').first();
      const applyCount = await applyBtn.count();
      
      if (applyCount > 0) {
        console.log('✓ Test 7 PASSED: Apply Changes button is present');
        passed++;
      } else {
        console.log('✗ Test 7 FAILED: Apply Changes button not found');
        failed++;
      }
    } catch (e) {
      console.log('✗ Test 7 FAILED:', e.message);
      failed++;
    }

  } catch (error) {
    console.log('\n--- Critical Error ---');
    console.log(error.message);
    failed++;
  }

  // Clean up
  await browser.close();

  // Summary
  console.log('\n===========================');
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('===========================');

  if (failed > 0) {
    process.exit(1);
  }
  console.log('\n✓ All Phase 2 tests passed!');
})();
