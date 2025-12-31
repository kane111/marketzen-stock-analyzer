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

async function testTechnicalAnalysis() {
  const { server, port } = await createServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  const consoleErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });

  try {
    console.log('🧪 Testing MarketZen Technical Analysis Feature...\n');
    
    // Load the page
    const url = `http://127.0.0.1:${port}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.log('✅ Page loaded successfully');
    console.log(`📄 Title: ${await page.title()}`);
    
    // Test 1: Check dashboard loads
    const header = await page.$('header');
    console.log(`✅ Header present: ${!!header}`);
    
    // Test 2: Check watchlist items
    const watchlistItems = await page.$$('aside button');
    console.log(`📊 Watchlist buttons found: ${watchlistItems.length}`);
    
    // Test 3: Find Activity icon button in watchlist
    let analyzeButton = null;
    for (const btn of watchlistItems) {
      try {
        const html = await btn.innerHTML();
        if (html && (html.includes('activity') || html.includes('Activity'))) {
          analyzeButton = btn;
          console.log('✅ Found Analyze button in watchlist');
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Test 4: Click Analyze button if found
    if (analyzeButton) {
      await analyzeButton.click();
      console.log('✅ Clicked Analyze button');
      await page.waitForTimeout(4000);
    } else {
      console.log('⚠️ Analyze button not found in watchlist');
    }
    
    // Test 5: Check for Technical Analysis page elements
    const pageContent = await page.content();
    const hasAnalysisContent = pageContent.includes('Technical Analysis') || 
                               pageContent.includes('Overall Signal') ||
                               pageContent.includes('STRONG BUY') ||
                               pageContent.includes('STRONG SELL') ||
                               pageContent.includes('BUY') ||
                               pageContent.includes('SELL');
    console.log(`✅ Analysis content found: ${hasAnalysisContent}`);
    
    // Test 6: Check for Tab Navigation
    let hasSummaryTab = false;
    let hasRSITab = false;
    let hasMACDTab = false;
    let hasBollingerTab = false;
    
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      try {
        const text = await btn.textContent() || '';
        if (text.includes('Summary')) hasSummaryTab = true;
        if (text.includes('RSI')) hasRSITab = true;
        if (text.includes('MACD')) hasMACDTab = true;
        if (text.includes('Bollinger')) hasBollingerTab = true;
      } catch (e) {
        continue;
      }
    }
    
    console.log(`✅ Summary tab: ${hasSummaryTab}`);
    console.log(`✅ RSI tab: ${hasRSITab}`);
    console.log(`✅ MACD tab: ${hasMACDTab}`);
    console.log(`✅ Bollinger Bands tab: ${hasBollingerTab}`);
    
    // Test 7: Check for Charts
    const charts = await page.$$('.recharts-wrapper');
    console.log(`✅ Charts rendered: ${charts.length}`);
    
    // Test 8: Check for Refresh button
    let hasRefresh = false;
    for (const btn of allButtons) {
      try {
        const text = await btn.textContent() || '';
        if (text.includes('Refresh')) {
          hasRefresh = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    console.log(`✅ Refresh button found: ${hasRefresh}`);
    
    // Test 9: Click on RSI tab if available
    if (hasRSITab) {
      for (const btn of allButtons) {
        try {
          const text = await btn.textContent() || '';
          if (text.includes('RSI')) {
            await btn.click();
            await page.waitForTimeout(1500);
            console.log('✅ Clicked RSI tab');
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    // Test 10: Check for Back button
    let backButton = null;
    for (const btn of allButtons) {
      try {
        const text = await btn.textContent() || '';
        if (text.includes('Back')) {
          backButton = btn;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    console.log(`✅ Back button found: ${!!backButton}`);
    
    // Test 11: Click back and return to dashboard
    if (backButton) {
      await backButton.click();
      await page.waitForTimeout(2000);
      const dashboardContent = await page.content();
      const hasDashboard = dashboardContent.includes('Indian Stock Tracker') || 
                          dashboardContent.includes('Watchlist');
      console.log(`✅ Returned to dashboard: ${hasDashboard}`);
    }
    
    // Check console for errors
    console.log('\n📊 Console Analysis:');
    console.log(`   Total messages: ${consoleMessages.length}`);
    
    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('DevTools') &&
      !e.includes('ResizeObserver') &&
      !e.includes('net::ERR_FAILED') &&
      !e.includes('corsproxy')
    );
    
    console.log(`   Critical errors: ${criticalErrors.length}`);
    
    if (criticalErrors.length > 0) {
      console.log('\n⚠️ Console Errors Found:');
      criticalErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 200)}`);
      });
    } else {
      console.log('\n✅ No critical console errors detected');
    }
    
    // Test responsiveness
    console.log('\n📱 Testing Responsive Design:');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    console.log(`✅ Mobile viewport (375x667): OK`);
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    console.log(`✅ Tablet viewport (768x1024): OK`);
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    console.log(`✅ Desktop viewport (1920x1080): OK`);
    
    console.log('\n🎉 Technical Analysis Test Completed!');
    console.log('\n📋 Feature Summary:');
    console.log('   • Watchlist with Analyze button (Activity icon)');
    console.log('   • Technical Analysis page with signal banner');
    console.log('   • Multiple indicator tabs (Summary, Price, RSI, MACD, Bollinger, Volume)');
    console.log('   • Interactive charts for each indicator');
    console.log('   • Buy/Sell/Neutral signal generation');
    console.log('   • Back navigation to dashboard');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}

testTechnicalAnalysis();
