const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Test page loads
  await page.goto('https://j7l0vfx53pym.space.minimax.io');
  await page.waitForLoadState('networkidle');

  console.log('Testing CSS layout fixes...\n');

  // Check page title
  const title = await page.title();
  console.log('Page title:', title);

  // Check for NaN values in the page
  const pageContent = await page.content();
  const hasNaN = pageContent.includes('NaN');
  console.log('Has NaN values:', hasNaN ? 'YES (issue)' : 'No (good)');

  // Check sidebar fills space
  const sidebar = await page.locator('aside').first();
  const sidebarVisible = await sidebar.isVisible();
  console.log('Sidebar visible:', sidebarVisible);

  // Check chart container
  const chartContainer = await page.locator('.glass.rounded-2xl').first();
  const chartVisible = await chartContainer.isVisible();
  console.log('Chart container visible:', chartVisible);

  // Check stats grid
  const statsGrid = await page.locator('.grid.grid-cols-2').first();
  const statsVisible = await statsGrid.isVisible();
  console.log('Stats grid visible:', statsVisible);

  // Check for proper spacing - look at main content area
  const mainContent = await page.locator('main').first();
  const mainContentHeight = await mainContent.evaluate(el => el.getBoundingClientRect().height);
  console.log('Main content height:', Math.round(mainContentHeight), 'px');

  console.log('\nLayout verification complete!');

  await browser.close();
})();
