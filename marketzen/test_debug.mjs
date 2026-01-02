import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]: ${msg.text()}`);
  });
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Check for loading spinner
    const loading = await page.$('text=Loading...');
    console.log('Loading state:', loading ? 'Still loading' : 'Not loading');
    
    // Check for error messages
    const errorText = await page.$('text=Unable to fetch');
    console.log('Error state:', errorText ? 'Has errors' : 'No errors');
    
    // Check for chart area
    const chartWrapper = await page.$('.recharts-wrapper');
    console.log('Chart rendered:', chartWrapper ? 'Yes' : 'No');
    
    // Check if EMALegend is in the DOM
    const emaLegendParent = await page.$('.flex.items-center.gap-4');
    if (emaLegendParent) {
      const innerText = await emaLegendParent.innerText();
      console.log('\nEMA Legend inner text:', innerText);
    }
    
    // Check for specific values
    const pageContent = await page.content();
    const hasEma10 = pageContent.includes('EMA 10') || pageContent.includes('10:');
    const hasEma20 = pageContent.includes('EMA 20') || pageContent.includes('20:');
    const hasEma44 = pageContent.includes('EMA 44') || pageContent.includes('44:');
    
    console.log('\n=== EMA Labels Found ===');
    console.log('EMA 10 label:', hasEma10 ? 'Yes' : 'No');
    console.log('EMA 20 label:', hasEma20 ? 'Yes' : 'No');
    console.log('EMA 44 label:', hasEma44 ? 'Yes' : 'No');
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  await browser.close();
})();
