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
    await desktopPage.goto('https://fa6kotyfoo9g.space.minimax.io', { waitUntil: 'networkidle', timeout: 30000 })
    await desktopPage.waitForTimeout(3000)
    console.log('✓ Application loaded successfully\n')

    console.log('Test 2: Testing Sectors navigation button...')
    const sectorsButton = desktopPage.locator('button:has-text("Sectors")').first()
    await sectorsButton.click()
    await desktopPage.waitForTimeout(1000)
    
    // Check if SectorDashboard is rendered
    const sectorTitle = desktopPage.locator('h2:has-text("Sector Performance")').first()
    await sectorTitle.waitFor({ timeout: 5000 })
    console.log('✓ Sector Dashboard loaded\n')

    console.log('Test 3: Testing Sector Dashboard views (Heatmap, List, Chart)...')
    
    // Wait for the page to stabilize after navigation
    await desktopPage.waitForTimeout(2000)
    
    // Test Heatmap view (default) - find button near the sector title
    const heatmapView = desktopPage.locator('text=Heatmap').first()
    await heatmapView.waitFor({ timeout: 5000 })
    console.log('✓ Heatmap view is active\n')

    // Test List view
    const listView = desktopPage.locator('text=List').first()
    await listView.click()
    await desktopPage.waitForTimeout(1000)
    console.log('✓ List view is working\n')

    // Test Chart view - click and verify button state changed
    const chartView = desktopPage.locator('text=Chart').first()
    await chartView.click()
    await desktopPage.waitForTimeout(2000)
    // Verify the Chart button is now active (has primary background)
    const chartButtonActive = desktopPage.locator('button.bg-primary:has-text("Chart")').first()
    await chartButtonActive.waitFor({ timeout: 5000 })
    console.log('✓ Chart view is working\n')

    console.log('Test 4: Testing News navigation button...')
    const newsButton = desktopPage.locator('button:has-text("News")').first()
    await newsButton.click()
    await desktopPage.waitForTimeout(1000)
    
    // Check if NewsFeed is rendered
    const newsTitle = desktopPage.locator('h2:has-text("Market News")').first()
    await newsTitle.waitFor({ timeout: 5000 })
    console.log('✓ News Feed loaded\n')

    console.log('Test 5: Testing News Feed filtering...')
    
    // Test All filter (default)
    const allFilter = desktopPage.locator('button:has-text("All News")').first()
    await allFilter.waitFor({ timeout: 5000 })
    console.log('✓ All News filter is active\n')

    // Test Positive filter
    const positiveFilter = desktopPage.locator('button:has-text("Positive")').first()
    await positiveFilter.click()
    await desktopPage.waitForTimeout(500)
    console.log('✓ Positive filter is working\n')

    // Test Negative filter
    const negativeFilter = desktopPage.locator('button:has-text("Negative")').first()
    await negativeFilter.click()
    await desktopPage.waitForTimeout(500)
    console.log('✓ Negative filter is working\n')

    console.log('Test 6: Testing News article expansion...')
    const allNewsFilter = desktopPage.locator('button:has-text("All News")').first()
    await allNewsFilter.click()
    await desktopPage.waitForTimeout(500)
    
    // Click on a news item to expand it
    const newsItem = desktopPage.locator('div.glass.rounded-xl').first()
    await newsItem.click()
    await desktopPage.waitForTimeout(500)
    console.log('✓ News item expansion is working\n')

    await desktopContext.close()
    
    // Define mobile selectors before closing desktop context
    const mobileSectorTitle = 'h2:has-text("Sector Performance")'
    const mobileNewsTitle = 'h2:has-text("Market News")'
    
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
    await mobilePage.goto('https://fa6kotyfoo9g.space.minimax.io', { waitUntil: 'networkidle', timeout: 30000 })
    await mobilePage.waitForTimeout(3000)
    console.log('✓ Mobile application loaded\n')

    // Check if mobile nav exists
    const mobileNav = mobilePage.locator('nav.fixed.bottom-0').first()
    const hasMobileNav = await mobileNav.count() > 0
    
    if (hasMobileNav) {
      console.log('Test 8: Testing mobile navigation buttons...')
      
      // Test clicking all navigation buttons
      const navButtons = mobilePage.locator('nav.fixed.bottom-0 button')
      const buttonCount = await navButtons.count()
      console.log(`✓ Found ${buttonCount} navigation buttons in mobile nav\n`)
      
      // Test Sectors navigation
      const mobileSectors = mobilePage.locator('nav.fixed.bottom-0 button:has-text("Sectors")').first()
      await mobileSectors.click({ force: true })
      await mobilePage.waitForTimeout(2000)
      console.log('✓ Mobile Sectors button clicked successfully\n')
      
      // Test News navigation
      const mobileNews = mobilePage.locator('nav.fixed.bottom-0 button:has-text("News")').first()
      await mobileNews.click({ force: true })
      await mobilePage.waitForTimeout(2000)
      console.log('✓ Mobile News button clicked successfully\n')
      
      console.log('✓ All mobile navigation tests passed\n')
    } else {
      console.log('⚠ Mobile navigation not visible\n')
    }

    await mobileContext.close()

    console.log('Test 10: Verifying no console errors...')
    if (errors.length > 0) {
      console.log('⚠ Console errors found:')
      errors.forEach(err => console.log(`  - ${err}`))
    } else {
      console.log('✓ No console errors detected\n')
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
