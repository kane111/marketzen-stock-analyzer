/**
 * MarketZen Cache System
 * Provides in-memory caching with TTL and localStorage persistence
 */

// Cache configuration
const CACHE_CONFIG = {
  // Default TTL in milliseconds (5 minutes)
  defaultTTL: 5 * 60 * 1000,
  
  // Stock data TTL (2 minutes - more frequent updates for live data)
  stockDataTTL: 2 * 60 * 1000,
  
  // Search results TTL (10 minutes - less frequent updates)
  searchResultsTTL: 10 * 60 * 1000,
  
  // Fundamentals TTL (15 minutes - rarely changes)
  fundamentalsTTL: 15 * 60 * 1000,
  
  // Chart data TTL (5 minutes)
  chartDataTTL: 5 * 60 * 1000,
  
  // Max cache size (number of items)
  maxSize: 100,
  
  // Enable persistence to localStorage
  enablePersistence: true,
  
  // LocalStorage key prefix
  storagePrefix: 'marketzen_cache_'
}

// In-memory cache store
const memoryCache = new Map()

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  size: 0
}

/**
 * Generate a cache key from parameters
 */
export function generateCacheKey(type, ...params) {
  return `${type}:${params.map(p => 
    typeof p === 'object' ? JSON.stringify(p) : String(p)
  ).join(':')}`
}

/**
 * Check if cached item is still valid
 */
function isCacheValid(cachedItem) {
  if (!cachedItem) return false
  
  const now = Date.now()
  const age = now - cachedItem.timestamp
  
  return age < cachedItem.ttl
}

/**
 * Get item from cache
 */
export function getCache(key) {
  // Try memory cache first
  if (memoryCache.has(key)) {
    const cachedItem = memoryCache.get(key)
    if (isCacheValid(cachedItem)) {
      cacheStats.hits++
      updateStats()
      
      // Update access time for LRU
      cachedItem.lastAccess = Date.now()
      return cachedItem.data
    } else {
      // Expired - remove from cache
      memoryCache.delete(key)
    }
  }
  
  // Try localStorage if enabled
  if (CACHE_CONFIG.enablePersistence) {
    try {
      const storedItem = localStorage.getItem(CACHE_CONFIG.storagePrefix + key)
      if (storedItem) {
        const cachedItem = JSON.parse(storedItem)
        if (isCacheValid(cachedItem)) {
          // Restore to memory cache
          memoryCache.set(key, cachedItem)
          cacheStats.hits++
          updateStats()
          return cachedItem.data
        } else {
          // Expired - remove from localStorage
          localStorage.removeItem(CACHE_CONFIG.storagePrefix + key)
        }
      }
    } catch (err) {
      console.warn('Cache read error:', err)
    }
  }
  
  cacheStats.misses++
  updateStats()
  return null
}

/**
 * Set item in cache
 */
export function setCache(key, data, ttl = CACHE_CONFIG.defaultTTL) {
  const now = Date.now()
  const cachedItem = {
    data,
    timestamp: now,
    ttl,
    lastAccess: now
  }
  
  // Enforce max size - remove oldest items (LRU)
  if (memoryCache.size >= CACHE_CONFIG.maxSize) {
    const oldestKey = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess)[0][0]
    memoryCache.delete(oldestKey)
  }
  
  memoryCache.set(key, cachedItem)
  cacheStats.sets++
  updateStats()
  
  // Persist to localStorage if enabled
  if (CACHE_CONFIG.enablePersistence) {
    try {
      localStorage.setItem(CACHE_CONFIG.storagePrefix + key, JSON.stringify(cachedItem))
    } catch (err) {
      console.warn('Cache write error:', err)
    }
  }
  
  return cachedItem
}

/**
 * Delete item from cache
 */
export function deleteCache(key) {
  memoryCache.delete(key)
  if (CACHE_CONFIG.enablePersistence) {
    localStorage.removeItem(CACHE_CONFIG.storagePrefix + key)
  }
  cacheStats.deletes++
  updateStats()
}

/**
 * Clear all cache
 */
export function clearCache() {
  memoryCache.clear()
  if (CACHE_CONFIG.enablePersistence) {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_CONFIG.storagePrefix)) {
        keys.push(key)
      }
    }
    keys.forEach(key => localStorage.removeItem(key))
  }
  cacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    ...cacheStats,
    memorySize: memoryCache.size,
    hitRate: cacheStats.hits + cacheStats.misses > 0 
      ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1) + '%'
      : '0%'
  }
}

/**
 * Update stats display (for debugging)
 */
function updateStats() {
  cacheStats.size = memoryCache.size
}

/**
 * Get cache entry metadata
 */
export function getCacheMetadata(key) {
  if (memoryCache.has(key)) {
    const item = memoryCache.get(key)
    return {
      timestamp: item.timestamp,
      ttl: item.ttl,
      age: Date.now() - item.timestamp,
      remaining: Math.max(0, item.ttl - (Date.now() - item.timestamp)),
      isValid: isCacheValid(item)
    }
  }
  return null
}

/**
 * Clean up expired entries
 */
export function cleanupCache() {
  const now = Date.now()
  const keysToDelete = []
  
  memoryCache.forEach((item, key) => {
    if (now - item.timestamp > item.ttl) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => {
    memoryCache.delete(key)
    if (CACHE_CONFIG.enablePersistence) {
      localStorage.removeItem(CACHE_CONFIG.storagePrefix + key)
    }
  })
  
  return keysToDelete.length
}

/**
 * Prefetch and cache stock data for watchlist stocks
 */
export function prefetchWatchlistStocks(stocks, fetchFn, chartData) {
  stocks.forEach(stock => {
    const cacheKey = generateCacheKey('stock', stock.id, chartData?.range || '1mo', chartData?.interval || '1d')
    
    // Only prefetch if not already cached or expired
    if (!getCache(cacheKey)) {
      fetchFn(stock, chartData).catch(err => {
        console.warn(`Prefetch failed for ${stock.symbol}:`, err)
      })
    }
  })
}

/**
 * Search with caching
 */
export async function cachedSearch(query, fetchFn, ttl = CACHE_CONFIG.searchResultsTTL) {
  const cacheKey = generateCacheKey('search', query.toLowerCase())
  
  // Check cache first
  const cached = getCache(cacheKey)
  if (cached) {
    return { results: cached, fromCache: true }
  }
  
  // Fetch fresh data
  try {
    const results = await fetchFn()
    setCache(cacheKey, results, ttl)
    return { results, fromCache: false }
  } catch (error) {
    console.error('Cached search error:', error)
    return { results: [], fromCache: false, error }
  }
}

/**
 * Stock data with caching
 */
export async function cachedStockData(stock, timeframe, fetchFn, ttl = CACHE_CONFIG.stockDataTTL) {
  const cacheKey = generateCacheKey('stock', stock.id, timeframe?.range || '1mo', timeframe?.interval || '1d')
  
  // Check cache first (only for non-live market hours)
  const cached = getCache(cacheKey)
  if (cached && !isMarketHours()) {
    return { data: cached, fromCache: true }
  }
  
  // Fetch fresh data
  try {
    const data = await fetchFn()
    setCache(cacheKey, data, ttl)
    return { data, fromCache: false }
  } catch (error) {
    // Return cached data on error if available
    if (cached) {
      console.warn('Fetch failed, returning cached data for', stock.symbol)
      return { data: cached, fromCache: true, stale: true }
    }
    return { data: null, fromCache: false, error }
  }
}

/**
 * Check if market is open (for cache validity decisions)
 */
function isMarketHours() {
  const now = new Date()
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = istNow.getDay()
  const hour = istNow.getHours()
  const minute = istNow.getMinutes()
  const currentMinutes = hour * 60 + minute
  
  const marketOpen = 9 * 60 + 15
  const marketClose = 15 * 60 + 30
  
  return day >= 1 && day <= 5 && currentMinutes >= marketOpen && currentMinutes <= marketClose
}

/**
 * Get all cached keys (for debugging)
 */
export function getAllCacheKeys() {
  return Array.from(memoryCache.keys())
}

export default {
  getCache,
  setCache,
  deleteCache,
  clearCache,
  getCacheStats,
  getCacheMetadata,
  cleanupCache,
  generateCacheKey,
  cachedSearch,
  cachedStockData,
  prefetchWatchlistStocks,
  getAllCacheKeys
}
