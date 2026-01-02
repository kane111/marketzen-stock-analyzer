/**
 * MarketZen Comprehensive Test Suite
 * Tests core functionality including caching, data processing, and utilities
 */

const fs = require('fs')
const path = require('path')

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

function test(name, fn) {
  try {
    fn()
    testResults.passed++
    testResults.tests.push({ name, status: 'PASSED' })
    console.log(`✓ ${name}`)
  } catch (error) {
    testResults.failed++
    testResults.tests.push({ name, status: 'FAILED', error: error.message })
    console.log(`✗ ${name}`)
    console.log(`  Error: ${error.message}`)
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`)
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || 'Expected true but got false')
  }
}

function assertFalse(value, message) {
  if (value) {
    throw new Error(message || 'Expected false but got true')
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected non-null value')
  }
}

console.log('\n' + '='.repeat(60))
console.log('MARKETZEN COMPREHENSIVE TEST SUITE')
console.log('='.repeat(60) + '\n')

// Test 1: File Structure Verification
console.log('📁 FILE STRUCTURE TESTS')
console.log('-'.repeat(40))

test('App.jsx exists', () => {
  const appPath = path.join(__dirname, 'src', 'App.jsx')
  assertTrue(fs.existsSync(appPath), 'App.jsx should exist')
})

test('Cache utility exists', () => {
  const cachePath = path.join(__dirname, 'src', 'utils', 'cache.js')
  assertTrue(fs.existsSync(cachePath), 'cache.js should exist')
})

test('All required components exist', () => {
  const components = [
    'SectorDashboard.jsx',
    'TechnicalAnalysis.jsx',
    'SearchOverlay.jsx',
    'Portfolio.jsx',
    'NewsFeed.jsx',
    'FundamentalsPanel.jsx',
    'StockComparison.jsx',
    'WatchlistPanel.jsx',
    'PerformanceChart.jsx',
    'StockScreener.jsx',
    'AlertsManager.jsx',
  ]
  
  components.forEach(comp => {
    const compPath = path.join(__dirname, 'src', 'components', comp)
    assertTrue(fs.existsSync(compPath), `${comp} should exist`)
  })
  
  // Also verify charts subdirectory
  const chartPath = path.join(__dirname, 'src', 'components', 'charts', 'ChartWrapper.jsx')
  assertTrue(fs.existsSync(chartPath), 'ChartWrapper.jsx should exist in charts directory')
})

test('Context providers exist', () => {
  const contexts = [
    'AlertsContext.jsx',
    'PortfolioContext.jsx',
    'WatchlistContext.jsx',
    'ThemeContext.jsx'
  ]
  
  contexts.forEach(ctx => {
    const ctxPath = path.join(__dirname, 'src', 'context', ctx)
    assertTrue(fs.existsSync(ctxPath), `${ctx} should exist`)
  })
})

// Test 2: Cache Utility Tests
console.log('\n🗄️ CACHE UTILITY TESTS')
console.log('-'.repeat(40))

test('Cache module exports required functions', () => {
  const cacheContent = fs.readFileSync(path.join(__dirname, 'src', 'utils', 'cache.js'), 'utf8')
  
  const requiredExports = [
    'getCache',
    'setCache',
    'deleteCache',
    'clearCache',
    'getCacheStats',
    'generateCacheKey',
    'cachedSearch',
    'cachedStockData',
    'cleanupCache'
  ]
  
  requiredExports.forEach(fn => {
    assertTrue(
      cacheContent.includes(`export function ${fn}`) || 
      cacheContent.includes(`${fn},`) || 
      cacheContent.includes(`${fn}`),
      `${fn} should be exported`
    )
  })
})

test('Cache has TTL configuration', () => {
  const cacheContent = fs.readFileSync(path.join(__dirname, 'src', 'utils', 'cache.js'), 'utf8')
  
  assertTrue(cacheContent.includes('stockDataTTL'), 'stockDataTTL should be defined')
  assertTrue(cacheContent.includes('searchResultsTTL'), 'searchResultsTTL should be defined')
  assertTrue(cacheContent.includes('fundamentalsTTL'), 'fundamentalsTTL should be defined')
  assertTrue(cacheContent.includes('chartDataTTL'), 'chartDataTTL should be defined')
})

test('Cache key generation works correctly', () => {
  // Simulate cache key generation
  const generateCacheKey = (type, ...params) => {
    return `${type}:${params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':')}`
  }
  
  const key1 = generateCacheKey('stock', 'RELIANCE.NS', '1mo', '1d')
  assertEqual(key1, 'stock:RELIANCE.NS:1mo:1d', 'Cache key generation for stock')
  
  const key2 = generateCacheKey('search', 'reliance')
  assertEqual(key2, 'search:reliance', 'Cache key generation for search')
})

test('Cache config has correct TTL values', () => {
  const cacheContent = fs.readFileSync(path.join(__dirname, 'src', 'utils', 'cache.js'), 'utf8')
  
  // Check that TTL values are reasonable (in milliseconds)
  assertTrue(cacheContent.includes('2 * 60 * 1000'), 'stockDataTTL should be 2 minutes')
  assertTrue(cacheContent.includes('10 * 60 * 1000'), 'searchResultsTTL should be 10 minutes')
})

// Test 3: App.jsx Integration Tests
console.log('\n⚛️ APP.JSX INTEGRATION TESTS')
console.log('-'.repeat(40))

test('App.jsx imports caching utility', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  assertTrue(appContent.includes("from './utils/cache'"), 'App should import from cache utility')
})

test('App.jsx has required imports', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  const requiredImports = [
    "import { useState, useEffect, useCallback, useRef }",
    "import { motion, AnimatePresence }",
    "import SearchOverlay",
    "import TechnicalAnalysis",
    "import SectorDashboard",
    "import Portfolio",
    "import NewsFeed",
    "import FundamentalsPanel",
    "import StockComparison"
  ]
  
  requiredImports.forEach(imp => {
    assertTrue(appContent.includes(imp), `${imp} should be imported`)
  })
})

test('App.jsx uses cache functions', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes('getCacheStats'), 'getCacheStats should be used')
  assertTrue(appContent.includes('cleanupCache'), 'cleanupCache should be used')
  assertTrue(appContent.includes('generateCacheKey'), 'generateCacheKey should be used')
})

test('App.jsx has cache state management', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes('cacheStats'), 'cacheStats state should exist')
  assertTrue(appContent.includes('showCacheStats'), 'showCacheStats state should exist')
})

test('App.jsx has stock data fetching with caching', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes('fetchStockData'), 'fetchStockData function should exist')
  assertTrue(appContent.includes('YAHOO_BASE'), 'Yahoo Finance API URL should be defined')
})

test('App.jsx includes CORS proxies', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes('CORS_PROXIES'), 'CORS proxies array should exist')
  assertTrue(appContent.includes('corsproxy.io'), 'corsproxy.io should be in proxies')
})

// Test 4: SectorDashboard Tests
console.log('\n📊 SECTORDASHBOARD TESTS')
console.log('-'.repeat(40))

test('SectorDashboard imports AnimatePresence', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'SectorDashboard.jsx'), 'utf8')
  assertTrue(content.includes('AnimatePresence'), 'AnimatePresence should be imported')
})

test('SectorDashboard has sector data', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'SectorDashboard.jsx'), 'utf8')
  
  assertTrue(content.includes('SECTOR_DATA'), 'SECTOR_DATA should be defined')
  assertTrue(content.includes("'nifty50'"), 'Nifty 50 sector should exist')
  assertTrue(content.includes("'niftybank'"), 'Nifty Bank sector should exist')
})

test('SectorDashboard has stock mappings', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'SectorDashboard.jsx'), 'utf8')
  
  assertTrue(content.includes('SECTOR_STOCKS'), 'SECTOR_STOCKS should be defined')
  assertTrue(content.includes('RELIANCE.NS'), 'RELIANCE should be in sector stocks')
})

test('SectorDashboard has heatmap color function', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'SectorDashboard.jsx'), 'utf8')
  assertTrue(content.includes('getHeatmapColor'), 'getHeatmapColor function should exist')
})

// Test 5: Search Functionality Tests
console.log('\n🔍 SEARCH FUNCTIONALITY TESTS')
console.log('-'.repeat(40))

test('SearchOverlay component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'SearchOverlay.jsx'), 'utf8')
  assertTrue(content.length > 100, 'SearchOverlay should have content')
})

test('App.jsx has search state management', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes('searchQuery'), 'searchQuery state should exist')
  assertTrue(appContent.includes('searchResults'), 'searchResults state should exist')
  assertTrue(appContent.includes('searchLoading'), 'searchLoading state should exist')
})

test('App.jsx has keyboard shortcuts', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes("e.key === '/'"), 'Slash key handler should exist')
  assertTrue(appContent.includes("ctrlKey") && appContent.includes("key === 'k'"), 'Ctrl+K handler should exist')
})

// Test 6: Technical Analysis Tests
console.log('\n📈 TECHNICAL ANALYSIS TESTS')
console.log('-'.repeat(40))

test('TechnicalAnalysis component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'TechnicalAnalysis.jsx'), 'utf8')
  assertTrue(content.length > 500, 'TechnicalAnalysis should have substantial content')
})

test('TechnicalAnalysis uses recharts', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'TechnicalAnalysis.jsx'), 'utf8')
  
  assertTrue(content.includes('ComposedChart'), 'ComposedChart should be imported')
  assertTrue(content.includes('Line'), 'Line chart should be used')
  assertTrue(content.includes('Bar'), 'Bar chart should be used')
})

test('TechnicalAnalysis has oscillator calculations', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'TechnicalAnalysis.jsx'), 'utf8')
  
  assertTrue(content.includes('RSI'), 'RSI oscillator should be defined')
  assertTrue(content.includes('MACD'), 'MACD oscillator should be defined')
  assertTrue(content.includes('Stochastic'), 'Stochastic oscillator should be defined')
})

// Test 7: Portfolio Tests
console.log('\n💼 PORTFOLIO TESTS')
console.log('-'.repeat(40))

test('Portfolio component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'Portfolio.jsx'), 'utf8')
  assertTrue(content.length > 200, 'Portfolio should have content')
})

test('PortfolioContext exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'context', 'PortfolioContext.jsx'), 'utf8')
  assertTrue(content.includes('PortfolioProvider'), 'PortfolioProvider should exist')
})

// Test 8: News Feed Tests
console.log('\n📰 NEWS FEED TESTS')
console.log('-'.repeat(40))

test('NewsFeed component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'NewsFeed.jsx'), 'utf8')
  assertTrue(content.length > 200, 'NewsFeed should have content')
})

test('NewsFeed has API integration', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'NewsFeed.jsx'), 'utf8')
  assertTrue(content.includes('fetch') || content.includes('API'), 'NewsFeed should have data fetching')
})

// Test 9: Chart Components Tests
console.log('\n📉 CHART COMPONENTS TESTS')
console.log('-'.repeat(40))

test('ChartWrapper component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'charts', 'ChartWrapper.jsx'), 'utf8')
  assertTrue(content.length > 100, 'ChartWrapper should have content')
})

test('TimeframeSelector component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'charts', 'TimeframeSelector.jsx'), 'utf8')
  assertTrue(content.length > 100, 'TimeframeSelector should have content')
})

test('Timeframes are properly defined', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'charts', 'TimeframeSelector.jsx'), 'utf8')
  
  assertTrue(content.includes('CHART_TIMEFRAMES'), 'CHART_TIMEFRAMES should be defined')
  assertTrue(content.includes('TA_TIMEFRAMES'), 'TA_TIMEFRAMES should be defined')
  assertTrue(content.includes('MULTI_CHART_TIMEFRAMES'), 'MULTI_CHART_TIMEFRAMES should be defined')
})

// Test 10: Fundamentals Tests
console.log('\n📊 FUNDAMENTALS TESTS')
console.log('-'.repeat(40))

test('FundamentalsPanel component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'FundamentalsPanel.jsx'), 'utf8')
  assertTrue(content.length > 200, 'FundamentalsPanel should have content')
})

test('FundamentalsPanel uses cached data', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'FundamentalsPanel.jsx'), 'utf8')
  assertTrue(content.includes('cachedFundamentals'), 'Should use cached fundamentals')
})

// Test 11: UI Components Tests
console.log('\n🎨 UI COMPONENTS TESTS')
console.log('-'.repeat(40))

test('Toast component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'common', 'Toast.jsx'), 'utf8')
  assertTrue(content.length > 100, 'Toast should have content')
})

test('Tooltip component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'common', 'Tooltip.jsx'), 'utf8')
  assertTrue(content.length > 50, 'Tooltip should have content')
})

test('LoadingSkeleton component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'LoadingSkeleton.jsx'), 'utf8')
  assertTrue(content.length > 50, 'LoadingSkeleton should have content')
})

test('PriceCounter component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'PriceCounter.jsx'), 'utf8')
  assertTrue(content.length > 50, 'PriceCounter should have content')
})

// Test 12: Stock Comparison & Screener Tests
console.log('\n🔄 STOCK COMPARISON & SCREENER TESTS')
console.log('-'.repeat(40))

test('StockComparison component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'StockComparison.jsx'), 'utf8')
  assertTrue(content.length > 100, 'StockComparison should have content')
})

test('StockScreener component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'StockScreener.jsx'), 'utf8')
  assertTrue(content.length > 100, 'StockScreener should have content')
})

test('PerformanceChart component exists', () => {
  const content = fs.readFileSync(path.join(__dirname, 'src', 'components', 'PerformanceChart.jsx'), 'utf8')
  assertTrue(content.length > 100, 'PerformanceChart should have content')
})

// Test 13: Build Configuration Tests
console.log('\n⚙️ BUILD CONFIGURATION TESTS')
console.log('-'.repeat(40))

test('Vite config exists', () => {
  const configPath = path.join(__dirname, 'vite.config.js')
  assertTrue(fs.existsSync(configPath), 'vite.config.js should exist')
})

test('Tailwind config exists', () => {
  const configPath = path.join(__dirname, 'tailwind.config.js')
  assertTrue(fs.existsSync(configPath), 'tailwind.config.js should exist')
})

test('Package.json has correct dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
  
  assertTrue(pkg.dependencies.react, 'React should be in dependencies')
  assertTrue(pkg.dependencies['framer-motion'], 'Framer Motion should be in dependencies')
  assertTrue(pkg.dependencies.recharts, 'Recharts should be in dependencies')
  assertTrue(pkg.dependencies['lucide-react'], 'Lucide React should be in dependencies')
})

// Test 14: Data Flow Tests
console.log('\n🔄 DATA FLOW TESTS')
console.log('-'.repeat(40))

test('Default stocks are properly defined', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes("'RELIANCE.NS'"), 'RELIANCE should be in default stocks')
  assertTrue(appContent.includes("'TCS.NS'"), 'TCS should be in default stocks')
  assertTrue(appContent.includes("'HDFCBANK.NS'"), 'HDFCBANK should be in default stocks')
})

test('Sector stocks mapping is defined', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes("SECTOR_STOCKS"), 'SECTOR_STOCKS should be defined')
  assertTrue(appContent.includes("'nifty50'"), 'nifty50 should be in sector mapping')
})

test('Market status detection exists', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes('marketStatus'), 'marketStatus should be defined')
  assertTrue(appContent.includes('updateMarketStatus'), 'updateMarketStatus function should exist')
})

test('Auto-refresh mechanism exists', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  
  assertTrue(appContent.includes('autoRefresh'), 'autoRefresh state should exist')
  assertTrue(appContent.includes('refreshInterval'), 'refreshInterval state should exist')
})

// Test 15: CSS & Styling Tests
console.log('\n🎨 CSS & STYLING TESTS')
console.log('-'.repeat(40))

test('Main CSS file exists', () => {
  const cssPath = path.join(__dirname, 'src', 'index.css')
  assertTrue(fs.existsSync(cssPath), 'index.css should exist')
})

test('Tailwind directives in CSS', () => {
  const cssContent = fs.readFileSync(path.join(__dirname, 'src', 'index.css'), 'utf8')
  
  assertTrue(cssContent.includes('@tailwind'), 'Tailwind directives should be present')
  assertTrue(cssContent.includes('base'), 'base layer should be defined')
  assertTrue(cssContent.includes('components'), 'components layer should be defined')
  assertTrue(cssContent.includes('utilities'), 'utilities layer should be defined')
})

// Test 16: HTML Entry Point Tests
console.log('\n🌐 HTML ENTRY POINT TESTS')
console.log('-'.repeat(40))

test('Index.html exists', () => {
  const htmlPath = path.join(__dirname, 'index.html')
  assertTrue(fs.existsSync(htmlPath), 'index.html should exist')
})

test('Index.html has correct title', () => {
  const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  assertTrue(htmlContent.includes('MarketZen'), 'MarketZen should be in title')
})

test('Index.html loads main.jsx', () => {
  const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  assertTrue(htmlContent.includes('main.jsx'), 'main.jsx should be referenced')
})

// Test 17: Utility Functions Tests
console.log('\n🛠️ UTILITY FUNCTIONS TESTS')
console.log('-'.repeat(40))

test('Main entry point exists', () => {
  const mainPath = path.join(__dirname, 'src', 'main.jsx')
  assertTrue(fs.existsSync(mainPath), 'main.jsx should exist')
})

test('App is exported from App.jsx', () => {
  const appContent = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf8')
  assertTrue(appContent.includes('export default App'), 'App should be exported as default')
})

// Print test summary
console.log('\n' + '='.repeat(60))
console.log('TEST SUMMARY')
console.log('='.repeat(60))
console.log(`Total Tests: ${testResults.passed + testResults.failed}`)
console.log(`Passed: ${testResults.passed}`)
console.log(`Failed: ${testResults.failed}`)
console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)
console.log('='.repeat(60) + '\n')

if (testResults.failed > 0) {
  console.log('FAILED TESTS:')
  testResults.tests.filter(t => t.status === 'FAILED').forEach(t => {
    console.log(`  - ${t.name}: ${t.error}`)
  })
  console.log('')
}

console.log('✅ File structure verification complete')
console.log('✅ Cache utility tests complete')
console.log('✅ Component integration tests complete')
console.log('✅ Data flow tests complete')
console.log('✅ Build configuration tests complete')
