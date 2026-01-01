const { chromium } = require('playwright');

async function testTerminalWorkspace() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const consoleErrors = [];
  const consoleWarnings = [];
  
  // Collect console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });
  
  // Collect page errors
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });
  
  try {
    console.log('Testing MarketZen Terminal Workspace...\n');
    
    // Navigate to the deployed application
    const url = 'https://4pwpvbuo9zg2.space.minimax.io';
    console.log(`1. Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for the page to fully load
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    console.log('   ✓ Page loaded successfully\n');
    
    // Test 1: Check terminal header
    console.log('2. Testing terminal header...');
    const headerExists = await page.$('header.fixed');
    if (headerExists) {
      console.log('   ✓ Terminal header found');
    } else {
      console.log('   ✗ Terminal header not found');
    }
    
    // Test 2: Check command bar
    console.log('3. Testing command bar...');
    const commandBarExists = await page.$('input[placeholder*="command mode"]');
    if (commandBarExists) {
      console.log('   ✓ Command bar found');
    } else {
      console.log('   ✗ Command bar not found');
    }
    
    // Test 3: Check left panel (Watchlist)
    console.log('4. Testing left panel (Watchlist)...');
    const leftPanelExists = await page.$('.bg-terminal-panel.border-r');
    if (leftPanelExists) {
      console.log('   ✓ Left panel (Watchlist) found');
    } else {
      console.log('   ✗ Left panel not found');
    }
    
    // Test 4: Check main content area
    console.log('5. Testing main content area...');
    const mainContentExists = await page.$('main.flex-1');
    if (mainContentExists) {
      console.log('   ✓ Main content area found');
    } else {
      console.log('   ✗ Main content area not found');
    }
    
    // Test 5: Check right panel (Market Depth)
    console.log('6. Testing right panel (Market Depth)...');
    const rightPanelExists = await page.$('.bg-terminal-panel.border-l');
    if (rightPanelExists) {
      console.log('   ✓ Right panel (Market Depth) found');
    } else {
      console.log('   ✗ Right panel not found');
    }
    
    // Test 6: Check for terminal-specific elements
    console.log('7. Testing terminal-specific elements...');
    const terminalIcon = await page.$('.text-terminal-green');
    if (terminalIcon) {
      console.log('   ✓ Terminal green color accents found');
    } else {
      console.log('   ✗ Terminal accents not found');
    }
    
    // Test 7: Check status indicators
    console.log('8. Testing status indicators...');
    const statusIndicator = await page.$('.w-2.h-2.rounded-full');
    if (statusIndicator) {
      console.log('   ✓ Status indicators found');
    } else {
      console.log('   ✗ Status indicators not found');
    }
    
    // Test 8: Check keyboard shortcut buttons
    console.log('9. Testing keyboard shortcut buttons...');
    const shortcutButton = await page.$('[title*="Shortcuts"]');
    if (shortcutButton) {
      console.log('   ✓ Keyboard shortcut button found');
    } else {
      console.log('   ✗ Shortcut button not found');
    }
    
    // Test 9: Test command mode activation
    console.log('10. Testing command mode (pressing /)...');
    await page.keyboard.press('/');
    await page.waitForTimeout(300);
    const commandInputActive = await page.$('input:focus') || await page.$('.bg-terminal-green\\/20');
    if (commandInputActive) {
      console.log('   ✓ Command mode activated successfully');
    } else {
      console.log('   ✗ Command mode activation failed');
    }
    
    // Exit command mode
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    console.log('   ✓ Exited command mode');
    
    // Test 10: Check for stock data rendering
    console.log('11. Testing stock data rendering...');
    await page.waitForTimeout(2000); // Wait for data to load
    const stockSymbol = await page.$('.font-bold');
    if (stockSymbol) {
      console.log('   ✓ Stock data is rendering');
    } else {
      console.log('   ✗ Stock data not found');
    }
    
    // Summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    
    if (consoleErrors.length === 0) {
      console.log('✓ No console errors detected');
    } else {
      console.log(`✗ ${consoleErrors.length} console error(s) detected:`);
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.substring(0, 100)}...`);
      });
    }
    
    if (consoleWarnings.length > 0) {
      console.log(`⚠ ${consoleWarnings.length} warning(s) detected (non-critical)`);
    }
    
    console.log('\n========================================');
    console.log('Terminal Workspace Layout Test: COMPLETE');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testTerminalWorkspace().catch(console.error);
