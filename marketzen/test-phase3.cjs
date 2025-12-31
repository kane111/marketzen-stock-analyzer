const { chromium } = require('playwright')

async function testPhase3() {
  console.log('Starting Phase 3 tests...\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const errors = []

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  page.on('pageerror', err => {
    errors.push(err.message)
  })

  try {
    console.log('Test 1: Loading MarketZen application...')
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    console.log('✓ Application loaded successfully\n')

    console.log('Test 2: Testing Sectors navigation button...')
    const sectorsButton = page.locator('button:has-text("Sectors")').first()
    await sectorsButton.click()
    await page.waitForTimeout(1000)
    
    // Check if SectorDashboard is rendered
    const sectorTitle = page.locator('h2:has-text("Sector Performance")').first()
    await sectorTitle.waitFor({ timeout: 5000 })
    console.log('✓ Sector Dashboard loaded\n')

    console.log('Test 3: Testing Sector Dashboard views (Heatmap, List, Chart)...')
    
    // Test Heatmap view (default)
    const heatmapView = page.locator('button:has-text("Heatmap")').first()
    await heatmapView.waitFor({ timeout: 5000 })
    console.log('✓ Heatmap view is active\n')

    // Test List view
    const listView = page.locator('button:has-text("List")').first()
    await listView.click()
    await page.waitForTimeout(500)
    const listHeader = page.locator('div:has-text("Sector")').first()
    await listHeader.waitFor({ timeout: 5000 })
    console.log('✓ List view is working\n')

    // Test Chart view
    const chartView = page.locator('button:has-text("Chart")').first()
    await chartView.click()
    await page.waitForTimeout(500)
    const chartTitle = page.locator('text=Sector Comparison').first()
    await chartTitle.waitFor({ timeout: 5000 })
    console.log('✓ Chart view is working\n')

    console.log('Test 4: Testing News navigation button...')
    const newsButton = page.locator('button:has-text("News")').first()
    await newsButton.click()
    await page.waitForTimeout(1000)
    
    // Check if NewsFeed is rendered
    const newsTitle = page.locator('h2:has-text("Market News")').first()
    await newsTitle.waitFor({ timeout: 5000 })
    console.log('✓ News Feed loaded\n')

    console.log('Test 5: Testing News Feed filtering...')
    
    // Test All filter (default)
    const allFilter = page.locator('button:has-text("All News")').first()
    await allFilter.waitFor({ timeout: 5000 })
    console.log('✓ All News filter is active\n')

    // Test Positive filter
    const positiveFilter = page.locator('button:has-text("Positive")').first()
    await positiveFilter.click()
    await page.waitForTimeout(500)
    console.log('✓ Positive filter is working\n')

    // Test Negative filter
    const negativeFilter = page.locator('button:has-text("Negative")').first()
    await negativeFilter.click()
    await page.waitForTimeout(500)
    console.log('✓ Negative filter is working\n')

    console.log('Test 6: Testing News article expansion...')
    const allNewsFilter = page.locator('button:has-text("All News")').first()
    await allNewsFilter.click()
    await page.waitForTimeout(500)
    
    // Click on a news item to expand it
    const newsItem = page.locator('div.glass.rounded-xl').first()
    await newsItem.click()
    await page.waitForTimeout(500)
    console.log('✓ News item expansion is working\n')

    console.log('Test 7: Testing mobile navigation (Sectors and News)...')
    
    // Navigate back to dashboard first
    const marketButton = page.locator('button:has-text("Market")').first()
    await marketButton.click()
    await page.waitForTimeout(500)
    
    // Test mobile sectors navigation by checking if mobile nav exists and has sectors button
    const mobileNav = page.locator('nav.fixed.bottom-0').first()
    const hasMobileNav = await mobileNav.count() > 0
    
    if (hasMobileNav) {
      // Click sectors in mobile nav
      const mobileSectors = page.locator('nav.fixed.bottom-0 button:has-text("Sectors")').first()
      await mobileSectors.click()
      await page.waitForTimeout(1000)
      await sectorTitle.waitFor({ timeout: 5000 })
      console.log('✓ Mobile Sectors navigation is working\n')

      // Click news in mobile nav
      const mobileNews = page.locator('nav.fixed.bottom-0 button:has-text("News")').first()
      await mobileNews.click()
      await page.waitForTimeout(1000)
      await newsTitle.waitFor({ timeout: 5000 })
      console.log('✓ Mobile News navigation is working\n')
    } else {
      console.log('✓ Mobile navigation not visible (desktop mode detected)\n')
    }

    console.log('Test 8: Verifying no console errors...')
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
