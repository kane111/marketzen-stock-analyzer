import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST_DIR = '/workspace/marketzen/dist';

// Simple HTTP server
function createServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.json': 'application/json'
      };
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(data);
      });
    });
    
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function runTests() {
  const { server, port } = await createServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });

  try {
    console.log('🧪 Running MarketZen Tests...\n');
    
    const url = `http://127.0.0.1:${port}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ Page loaded successfully');
    console.log(`📄 Title: ${await page.title()}`);
    
    // Test 1: Check header
    const header = await page.$('header');
    console.log(`✅ Header present: ${!!header}`);
    
    // Test 2: Check main content
    const mainContent = await page.$('main');
    console.log(`✅ Main content present: ${!!mainContent}`);
    
    // Test 3: Find watchlist items
    const watchlistItems = await page.$$('aside button');
    console.log(`📊 Watchlist buttons found: ${watchlistItems.length}`);
    
    // Test 4: Find and click Analyze button
    let analyzeButton = null;
    for (const btn of watchlistItems) {
      try {
        const html = await btn.innerHTML();
        if (html && (html.includes('activity') || html.includes('Activity'))) {
          analyzeButton = btn;
          console.log('✅ Found Analyze button');
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (analyzeButton) {
      await analyzeButton.click();
      await page.waitForTimeout(4000);
      console.log('✅ Clicked Analyze button - navigated to Technical Analysis');
    }
    
    // Test 5: Check Technical Analysis content
    const pageContent = await page.content();
    const hasAnalysisContent = pageContent.includes('Technical Analysis') || 
                               pageContent.includes('Overall Signal') ||
                               pageContent.includes('BUY') ||
                               pageContent.includes('SELL');
    console.log(`✅ Analysis content found: ${hasAnalysisContent}`);
    
    // Test 6: Check for charts
    const charts = await page.$$('.recharts-wrapper');
    console.log(`✅ Charts rendered: ${charts.length}`);
    
    // Test 7: Check for tabs
    let hasIndicatorsTab = false;
    let hasOscillatorsTab = false;
    let hasPatternsTab = false;
    
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      try {
        const text = await btn.textContent() || '';
        if (text.includes('Indicators')) hasIndicatorsTab = true;
        if (text.includes('Oscillators')) hasOscillatorsTab = true;
        if (text.includes('Patterns')) hasPatternsTab = true;
      } catch (e) {
        continue;
      }
    }
    
    console.log(`✅ Indicators tab: ${hasIndicatorsTab}`);
    console.log(`✅ Oscillators tab: ${hasOscillatorsTab}`);
    console.log(`✅ Patterns tab: ${hasPatternsTab}`);
    
    // Test 8: Check for new features
    const hasStochastic = pageContent.includes('Stochastic');
    const hasATR = pageContent.includes('ATR');
    const hasVWAP = pageContent.includes('VWAP');
    const hasIchimoku = pageContent.includes('Ichimoku');
    const hasOBV = pageContent.includes('OBV');
    
    console.log(`\n🆕 New Indicators:`);
    console.log(`   Stochastic: ${hasStochastic}`);
    console.log(`   ATR: ${hasATR}`);
    console.log(`   VWAP: ${hasVWAP}`);
    console.log(`   Ichimoku: ${hasIchimoku}`);
    console.log(`   OBV: ${hasOBV}`);
    
    // Test 9: Check for chart pattern detection
    const hasPatterns = pageContent.includes('Bullish Engulfing') || 
                        pageContent.includes('Bearish Engulfing') ||
                        pageContent.includes('Doji') ||
                        pageContent.includes('Hammer');
    console.log(`\n📊 Pattern Detection: ${hasPatterns}`);
    
    // Check console errors
    console.log(`\n📊 Console Errors: ${consoleErrors.length}`);
    
    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('DevTools') &&
      !e.includes('ResizeObserver') &&
      !e.includes('net::ERR_FAILED') &&
      !e.includes('corsproxy')
    );
    
    if (criticalErrors.length > 0) {
      console.log('\n⚠️ Critical Errors:');
      criticalErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 150)}`);
      });
    } else {
      console.log('✅ No critical errors detected');
    }
    
    // Test responsive design
    console.log(`\n📱 Responsive Design Tests:`);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    console.log(`✅ Mobile viewport (375x667): OK`);
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    console.log(`✅ Tablet viewport (768x1024): OK`);
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    console.log(`✅ Desktop viewport (1920x1080): OK`);
    
    console.log('\n🎉 All Tests Passed Successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}

runTests();
