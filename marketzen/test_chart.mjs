import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const allLogs = [];
  page.on('console', msg => {
    allLogs.push({ type: msg.type(), text: msg.text() });
  });
  
  page.on('response', response => {
    if (response.url().includes('finance.yahoo')) {
      console.log(`[API Response]: ${response.url()} - Status: ${response.status()}`);
    }
  });
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(6000);
    
    // Check what's in the viewport
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== Page Content ===');
    console.log('Body has text:', bodyText.length > 0);
    
    // Find any visible text
    const lines = bodyText.split('\n').filter(l => l.trim().length > 0).slice(0, 10);
    console.log('\nFirst visible lines:');
    lines.forEach((l, i) => console.log(`  ${i + 1}: ${l.substring(0, 50)}`));
    
    // Look for any visible chart elements
    const hasChart = await page.$('[class*="recharts"]');
    console.log('\nHas Recharts elements:', hasChart ? 'Yes' : 'No');
    
    // Check for specific MarketZen elements
    const hasMarketZen = bodyText.includes('MarketZen');
    console.log('MarketZen text found:', hasMarketZen);
    
    // Check for stock-related elements
    const hasStock = bodyText.includes('RELIANCE') || bodyText.includes('TCS') || bodyText.includes('HDFC');
    console.log('Stock data found:', hasStock);
    
    // Look for CHART label
    const hasChartLabel = bodyText.includes('CHART');
    console.log('Chart label found:', hasChartLabel);
    
    // Check for any visible buttons
    const buttons = await page.$$('button');
    console.log('\nTotal buttons found:', buttons.length);
    
    // Check console for specific errors
    const errors = allLogs.filter(l => l.type === 'error');
    console.log('\nConsole errors:', errors.length);
    errors.forEach(e => console.log(`  - ${e.text.substring(0, 80)}`));
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  await browser.close();
})();
