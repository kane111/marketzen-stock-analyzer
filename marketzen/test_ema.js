import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const logs = [];

  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    console.log('Navigating to http://localhost:5194...');
    await page.goto('http://localhost:5194', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for chart to load
    await page.waitForTimeout(15000);

    // Check for EMA legend elements
    const emaLegend = await page.$('.flex.items-center.gap-4');
    if (emaLegend) {
      console.log('EMA Legend found!');
      const legendText = await emaLegend.textContent();
      console.log('EMA Legend content:', legendText);
      
      // Check if EMA values are present (10:, 20:, 44:)
      if (legendText.includes('10:') && legendText.includes('20:') && legendText.includes('44:')) {
        console.log('✓ EMA values are present in the legend!');
      } else {
        console.log('✗ EMA values are missing from the legend');
      }
      
      // Check for PERFECT STACK badge
      if (legendText.includes('PERFECT STACK')) {
        console.log('✓ Perfect Stack signal is displayed!');
      } else {
        console.log('ℹ No Perfect Stack signal in current data');
      }
    } else {
      console.log('EMA Legend not found');
    }

    // Check for chart container
    const chartContainer = await page.$('.recharts-wrapper');
    if (chartContainer) {
      console.log('✓ Chart container is rendering');
    } else {
      console.log('✗ Chart container not found');
    }

    // Check for loading spinner
    const loadingSpinner = await page.$('.animate-spin');
    if (loadingSpinner) {
      console.log('⚠ Loading spinner still visible - chart may still be loading');
    } else {
      console.log('✓ Loading complete');
    }

    // Check for error message
    const errorMessage = await page.$('.text-red-500');
    if (errorMessage) {
      const errorText = await errorMessage.textContent();
      console.log('Error message:', errorText);
    }

    // Check for any error messages on page
    const errorElements = await page.$$('.text-red-500');
    if (errorElements.length > 0) {
      console.log('Error elements found on page');
    }

    // Print console errors
    console.log('\n=== Console Errors ===');
    if (errors.length === 0) {
      console.log('No console errors!');
    } else {
      errors.forEach((err, i) => {
        console.log(`Error ${i + 1}: ${err}`);
      });
    }

    // Print all console logs
    console.log('\n=== All Console Logs ===');
    logs.forEach((log, i) => {
      console.log(`[${log.type}] ${log.text}`);
    });

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
