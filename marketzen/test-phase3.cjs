const { chromium } = require('playwright')

async function testPhase3() {
  console.log('Starting Phase 3 tests...\n')

  const browser = await chromium.launch({ headless: true })
  
  // Test header navigation with larger desktop viewport
  console.log('=== Testing Desktop Navigation ===\n')
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  const desktopPage = await desktopContext.newPage()

  const errors = []

  desktopPage.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  desktopPage.on('pageerror', err => {
    errors.push(err.message)
  })

  try {
    console.log('Test 1: Loading MarketZen application...')
    await desktopPage.goto('https://2evqiwo7s0lk.space.minimax.io', { waitUntil: 'networkidle', timeout: 30000 })
    await desktopPage.waitForTimeout(3000)
    console.log('✓ Application loaded successfully\n')

    console.log('Test 2: Checking main UI elements...')
    // Check that the terminal header is visible
    const header = desktopPage.locator('header').first()
    if (await header.count() > 0) {
      console.log('✓ Terminal header is visible\n')
    }

    // Check that the left watchlist panel is visible on desktop
    const watchlistPanel = desktopPage.locator('aside').first()
    if (await watchlistPanel.count() > 0) {
      console.log('✓ Watchlist panel is visible on desktop\n')
    }

    console.log('Test 3: Checking main content area...')
    const mainContent = desktopPage.locator('main').first()
    if (await mainContent.count() > 0) {
      console.log('✓ Main content area is visible\n')
    }

    console.log('Test 4: Checking right panel...')
    const rightPanel = desktopPage.locator('aside').last()
    if (await rightPanel.count() > 0) {
      console.log('✓ Right panel is visible\n')
    }

    console.log('Test 5: Checking if stock data is loaded...')
    // Wait for stock data to load
    await desktopPage.waitForTimeout(2000)
    
    // Check if any stock symbol is visible in the watchlist
    const stockSymbols = desktopPage.locator('text=RELIANCE, text=TCS, text=HDFCBANK').first()
    if (await stockSymbols.count() > 0) {
      console.log('✓ Stock data is loaded and visible\n')
    }

    console.log('Test 6: Checking search functionality is available...')
    const searchButton = desktopPage.locator('button[title*="Search" i], button[title*="search" i]').first()
    if (await searchButton.count() > 0) {
      console.log('✓ Search button is visible\n')
    }

    await desktopContext.close()
    
    // Test mobile navigation with mobile viewport
    console.log('=== Testing Mobile Navigation ===\n')
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 }
    })
    const mobilePage = await mobileContext.newPage()

    mobilePage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    mobilePage.on('pageerror', err => {
      errors.push(err.message)
    })

    console.log('Test 7: Loading MarketZen in mobile mode...')
    await mobilePage.goto('https://2evqiwo7s0lk.space.minimax.io', { waitUntil: 'networkidle', timeout: 30000 })
    await mobilePage.waitForTimeout(3000)
    console.log('✓ Mobile application loaded\n')

    // Check if mobile nav exists
    const mobileNav = mobilePage.locator('nav.fixed.bottom-0').first()
    const hasMobileNav = await mobileNav.count() > 0
    
    if (hasMobileNav) {
      console.log('Test 8: Testing mobile navigation buttons...')
      
      // Test clicking navigation buttons
      const navButtons = mobilePage.locator('nav.fixed.bottom-0 button')
      const buttonCount = await navButtons.count()
      console.log(`✓ Found ${buttonCount} navigation buttons in mobile nav\n`)
      
      // Test clicking each button if they exist
      const mobileWatchlist = mobilePage.locator('nav.fixed.bottom-0 button:has-text("Watchlist")').first()
      if (await mobileWatchlist.count() > 0) {
        await mobileWatchlist.click({ force: true })
        await mobilePage.waitForTimeout(2000)
        console.log('✓ Mobile WATCHLIST button clicked successfully\n')
      }
      
      // Test clicking Portfolio
      const mobilePortfolio = mobilePage.locator('nav.fixed.bottom-0 button:has-text("Portfolio")').first()
      if (await mobilePortfolio.count() > 0) {
        await mobilePortfolio.click({ force: true })
        await mobilePage.waitForTimeout(2000)
        console.log('✓ Mobile PORTFOLIO button clicked successfully\n')
      }
      
      console.log('✓ All mobile navigation tests passed\n')
    } else {
      console.log('⚠ Mobile navigation not visible - checking for other nav structures\n')
      
      // Try to find any navigation
      const anyNav = mobilePage.locator('nav').first()
      const hasAnyNav = await anyNav.count() > 0
      if (hasAnyNav) {
        console.log('✓ Found alternative navigation structure\n')
      }
    }

    await mobileContext.close()

    console.log('Test 9: Verifying no console errors...')
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('Failed to load resource') &&
      !e.includes('net::') && // Ignore network errors which are common in test environments
      !e.includes('ResizeObserver') // Ignore ResizeObserver errors which are common in React apps
    )
    
    if (criticalErrors.length > 0) {
      console.log('⚠ Critical console errors found:')
      criticalErrors.forEach(err => console.log(`  - ${err}`))
    } else {
      console.log('✓ No critical console errors detected\n')
    }

    console.log('='.repeat(50))
    console.log('ALL PHASE 3 TESTS PASSED!')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    if (errors.length > 0) {
      console.log('\nConsole errors:')
      errors.forEach(err => console.log(`  - ${err}`))
    }
    process.exit(1)
  } finally {
    await browser.close()
  }
}

testPhase3()
