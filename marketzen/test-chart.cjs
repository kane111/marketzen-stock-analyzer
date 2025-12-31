const { chromium } = require('playwright');

(async () => {
  console.log('Checking Chart Rendering...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173', { timeout: 30000, waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for chart container
    console.log('1. Checking for chart elements...');
    const chartDivs = await page.locator('.recharts-wrapper, .recharts-surface').count();
    console.log('   Recharts elements:', chartDivs);

    // Check for any SVG elements
    const svgElements = await page.locator('svg').count();
    console.log('   SVG elements:', svgElements);

    // Check for the Price Chart header
    const priceChartHeader = await page.locator('text=Price Chart').count();
    console.log('   Price Chart header:', priceChartHeader);

    // Check for timeframe selectors
    const timeframeButtons = await page.locator('button:has-text("1D"), button:has-text("1W"), button:has-text("1M")').count();
    console.log('   Timeframe buttons:', timeframeButtons);

    // Check for stock name in header
    const stockHeader = await page.locator('h2:has-text("Reliance Industries")').count();
    console.log('   Stock header:', stockHeader);

    // Get the HTML of the main content area
    const mainContent = await page.locator('main').innerHTML();
    console.log('2. Main content HTML length:', mainContent.length);

    // Check if there's a loading state
    const loadingText = await page.locator('text=Loading').count();
    console.log('   Loading text:', loadingText);

    // Check for error messages
    const errorText = await page.locator('text=Error').count();
    console.log('   Error text:', errorText);

  } catch (error) {
    console.log('Error:', error.message);
  }

  await browser.close();
  console.log('\n--- Test Complete ---');
})();
