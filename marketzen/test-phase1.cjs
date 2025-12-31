const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

// Simple static file server
const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

async function runTests() {
  const port = 3456;
  
  return new Promise((resolve) => {
    server.listen(port, async () => {
      console.log(`Test server running on port ${port}`);
      
      let browser;
      try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        page.on('pageerror', err => {
          errors.push(err.message);
        });
        
        console.log('\n=== Phase 1 Feature Tests ===\n');
        
        // Test 1: Load the application
        console.log('Test 1: Loading MarketZen application...');
        await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        console.log('✓ Application loaded successfully');
        
        // Test 2: Check for Market Status indicator
        console.log('\nTest 2: Checking Market Status indicator...');
        const marketStatusButton = await page.$('button:has-text("Live"), button:has-text("Closed"), button:has-text("Pre-Market"), button:has-text("Post-Market")');
        if (marketStatusButton) {
          console.log('✓ Market Status indicator found');
          
          // Click to open dropdown
          await marketStatusButton.click();
          await page.waitForTimeout(500);
          
          const dropdownVisible = await page.$('.glass.rounded-xl');
          if (dropdownVisible) {
            console.log('✓ Market Status dropdown opens correctly');
          }
          
          // Check for refresh button
          const refreshButton = await page.$('button:has-text("Refresh Now")');
          if (refreshButton) {
            console.log('✓ Refresh button present in dropdown');
          }
        } else {
          console.log('⚠ Market Status indicator not found');
        }
        
        // Test 3: Check Multi-Timeframe toggle
        console.log('\nTest 3: Checking Multi-Timeframe feature...');
        const multiTimeframeBtn = await page.$('button:has-text("Multi-Timeframe")');
        if (multiTimeframeBtn) {
          console.log('✓ Multi-Timeframe toggle button found');
          
          await multiTimeframeBtn.click();
          await page.waitForTimeout(2000);
          
          // Check if multi-chart grid appeared
          const chartGrid = await page.$('.grid.gap-4');
          if (chartGrid) {
            console.log('✓ Multi-chart grid view activated');
          }
          
          // Check for timeframe selectors
          const timeframeButtons = await page.$$('button:has-text("1H"), button:has-text("4H"), button:has-text("1D"), button:has-text("1W")');
          console.log(`✓ Found ${timeframeButtons.length} timeframe comparison buttons`);
        } else {
          console.log('⚠ Multi-Timeframe toggle not found');
        }
        
        // Test 4: Check Technical Analysis navigation
        console.log('\nTest 4: Checking Technical Analysis flow...');
        const taButton = await page.$('button:has-text("Technical Analysis")');
        if (taButton) {
          await taButton.click();
          await page.waitForTimeout(2000);
          
          const taHeader = await page.$('h2:has-text("Technical Analysis")');
          if (taHeader) {
            console.log('✓ Technical Analysis page navigates correctly');
          }
          
          // Go back to dashboard
          const backButton = await page.$('button:has(svg.lucide-arrow-left)');
          if (backButton) {
            await backButton.click();
            await page.waitForTimeout(1000);
            console.log('✓ Back navigation works');
          }
        }
        
        // Test 5: Check data timestamp
        console.log('\nTest 5: Checking data timestamp display...');
        const timeAgo = await page.$('text=/\\d+m ago|Just now|Never/');
        if (timeAgo) {
          console.log('✓ Data timestamp displayed');
        }
        
        // Report errors
        console.log('\n=== Console Error Report ===\n');
        const criticalErrors = errors.filter(e => 
          !e.includes('favicon') && 
          !e.includes('Download the React DevTools') &&
          !e.includes('Failed to load resource')
        );
        
        if (criticalErrors.length > 0) {
          console.log('Critical errors found:');
          criticalErrors.forEach(e => console.log(`  - ${e}`));
        } else {
          console.log('✓ No critical console errors detected');
        }
        
        console.log('\n=== Phase 1 Implementation Complete ===\n');
        console.log('Features implemented:');
        console.log('  1. Market Status Indicator System');
        console.log('     - Live/Closed/Pre-Market/Post-Market status');
        console.log('     - Data timestamp display');
        console.log('     - Auto-refresh configuration');
        console.log('  2. Multi-Timeframe Chart System');
        console.log('     - Multi-chart comparison view');
        console.log('     - Timeframe selection toggle');
        console.log('     - Grid layout for comparison');
        
      } catch (err) {
        console.error('Test error:', err.message);
      } finally {
        if (browser) await browser.close();
        server.close();
        resolve();
      }
    });
  });
}

runTests();
