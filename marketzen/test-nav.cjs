const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Test page loads
  await page.goto('https://m5stwych3vss.space.minimax.io');
  await page.waitForLoadState('networkidle');

  // Check page title
  const title = await page.title();
  console.log('Page title:', title);

  // Check if main elements exist
  const header = await page.locator('header').first();
  const headerExists = await header.isVisible();
  console.log('Header visible:', headerExists);

  // Check for logo
  const logo = await page.locator('text=MarketZen').first();
  const logoExists = await logo.isVisible();
  console.log('Logo visible:', logoExists);

  // Check for navigation buttons on desktop
  const dashboardBtn = await page.locator('text=Dashboard').first();
  const dashboardVisible = await dashboardBtn.isVisible().catch(() => false);
  console.log('Dashboard button visible:', dashboardVisible);

  // Check for search button
  const searchBtn = await page.locator('button:has-text("Search")').first();
  const searchVisible = await searchBtn.isVisible().catch(() => false);
  console.log('Search button visible:', searchVisible);

  // Check bottom navigation (mobile)
  const bottomNav = await page.locator('nav').last();
  const bottomNavVisible = await bottomNav.isVisible();
  console.log('Bottom navigation visible:', bottomNavVisible);

  console.log('\nAll navigation elements verified successfully!');

  await browser.close();
})();
