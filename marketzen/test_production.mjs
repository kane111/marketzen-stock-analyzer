import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    console.log('Loading production build...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Check page content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n=== Page Content ===');
    console.log('Has text:', bodyText.length > 0);
    console.log('Text length:', bodyText.length);
    
    // Look for key elements
    const hasMarketZen = bodyText.includes('MarketZen');
    const hasChart = bodyText.includes('CHART');
    const hasEma10 = bodyText.includes('10:') || bodyText.includes('EMA 10');
    const hasEma20 = bodyText.includes('20:') || bodyText.includes('EMA 20');
    const hasEma44 = bodyText.includes('44:') || bodyText.includes('EMA 44');
    
    console.log('\n=== Element Check ===');
    console.log('MarketZen found:', hasMarketZen);
    console.log('CHART found:', hasChart);
    console.log('EMA 10 found:', hasEma10);
    console.log('EMA 20 found:', hasEma20);
    console.log('EMA 44 found:', hasEma44);
    
    // Get EMA values if they exist
    if (hasEma10 || hasEma20 || hasEma44) {
      const lines = bodyText.split('\n').filter(l => l.trim().length > 0);
      console.log('\n=== Sample Lines ===');
      lines.slice(0, 15).forEach((l, i) => {
        if (l.includes('10:') || l.includes('20:') || l.includes('44:') || l.includes('EMA')) {
          console.log(`  Line ${i + 1}: ${l.substring(0, 80)}`);
        }
      });
    }
    
    // Check for chart
    const chartWrapper = await page.$('.recharts-wrapper');
    console.log('\n=== Chart Status ===');
    console.log('Recharts rendered:', chartWrapper ? 'Yes' : 'No');
    
    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(e => console.log('  - ' + e.substring(0, 100)));
    } else {
      console.log('\n✓ No console errors');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  await browser.close();
})();
