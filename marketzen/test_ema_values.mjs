import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    
    // Check for EMA values
    const emaValues = await page.$$('.font-mono.text-terminal-text');
    console.log('\n=== EMA Value Check ===');
    if (emaValues.length > 0) {
      for (let i = 0; i < Math.min(5, emaValues.length); i++) {
        const text = await emaValues[i].textContent();
        console.log(`Value ${i + 1}: ${text}`);
      }
    }
    
    // Check specifically for EMA legend section
    const emaLegend = await page.$('text=/10:|20:|44:/');
    if (emaLegend) {
      console.log('\n✓ EMA legend section found');
    }
    
    // Get all text content to find EMA values
    const allText = await page.evaluate(() => document.body.innerText);
    const emaMatches = allText.match(/10:[\s\S]*?44:[\s\S]*/g);
    if (emaMatches && emaMatches.length > 0) {
      console.log('\n✓ EMA values found in page');
      console.log('Sample:', emaMatches[0].substring(0, 100));
    } else {
      console.log('\n✗ EMA values not found in page text');
    }
    
    // Log any console errors related to EMA calculation
    const emaErrors = consoleLogs.filter(log => 
      log.text.includes('EMA') || 
      log.text.includes('enrich') ||
      log.text.includes('calculate')
    );
    if (emaErrors.length > 0) {
      console.log('\nEMA-related console messages:');
      emaErrors.forEach(e => console.log(`  [${e.type}]: ${e.text.substring(0, 80)}`));
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  await browser.close();
})();
