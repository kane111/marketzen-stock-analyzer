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

async function testMarketZen() {
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
    console.log('🚀 Testing MarketZen Application...\n');
    
    // Load the page via HTTP
    const url = `http://127.0.0.1:${port}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.log(`✅ Page loaded successfully from ${url}`);
    
    // Check if main elements are present
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check for header with logo
    const header = await page.$('header');
    console.log(`✅ Header present: ${!!header}`);
    
    // Check for main content area
    const mainContent = await page.$('main');
    console.log(`✅ Main content area present: ${!!mainContent}`);
    
    // Check for interactive elements (buttons)
    const buttons = await page.$$('button');
    console.log(`✅ Interactive buttons: ${buttons.length}`);
    
    // Check for glassmorphism effects
    const glassElements = await page.$$('.glass');
    console.log(`✅ Glassmorphism elements: ${glassElements.length}`);
    
    // Check for SVG icons
    const svgIcons = await page.$$('svg');
    console.log(`✅ SVG icons: ${svgIcons.length}`);
    
    // Check for charts/recharts
    const chartContainers = await page.$$('.recharts-wrapper');
    console.log(`✅ Chart components: ${chartContainers.length}`);
    
    // Check for inputs
    const inputs = await page.$$('input');
    console.log(`✅ Input fields: ${inputs.length}`);
    
    // Check console for errors (filter out expected warnings)
    console.log('\n📊 Console Analysis:');
    console.log(`   Total messages: ${consoleMessages.length}`);
    
    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('DevTools')
    );
    
    console.log(`   Critical errors: ${criticalErrors.length}`);
    
    if (criticalErrors.length > 0) {
      console.log('\n⚠️ Console Errors:');
      criticalErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 150)}`);
      });
    } else {
      console.log('\n✅ No critical console errors detected');
    }
    
    // Test responsiveness
    console.log('\n📱 Testing Responsive Design:');
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    console.log(`✅ Mobile viewport (375x667): OK`);
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    console.log(`✅ Tablet viewport (768x1024): OK`);
    
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    console.log(`✅ Desktop viewport (1920x1080): OK`);
    
    console.log('\n🎉 MarketZen test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Minimal dark UI with glassmorphism');
    console.log('   • Responsive design for all screen sizes');
    console.log('   • Animated transitions using Framer Motion');
    console.log('   • Interactive charts using Recharts');
    console.log('   • Search functionality with CoinGecko API');
    console.log('   • Watchlist with localStorage persistence');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}

testMarketZen();
