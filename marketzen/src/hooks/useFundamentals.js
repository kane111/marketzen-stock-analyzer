import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// ============================================================================
// USE FUNDAMENTALS - Fundamental Data Hook
// ============================================================================

const YAHOO_QUOTE_SUMMARY = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary'
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://justfetch.itsvg.in/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.pages.dev/?',
  'https://proxy.cors.sh/'
]

const FUNDAMENTAL_MODULES = 'summaryDetail,defaultKeyStatistics,financialData,incomeStatementHistory,balanceSheetHistory'

export function useFundamentals(symbol, options = {}) {
  const { autoRefresh = false, refreshInterval = 300000 } = options

  // Use refs to track previous symbol to prevent unnecessary re-fetches
  const prevSymbolRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState('Yahoo Finance')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Memoize the fetch function to maintain stability
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!symbol) return

    // Skip if symbol hasn't changed and not forcing refresh
    if (!forceRefresh && symbol === prevSymbolRef.current) {
      return
    }

    prevSymbolRef.current = symbol

    setLoading(true)
    setDataSource('Yahoo Finance')
    setError(null)

    const url = `${YAHOO_QUOTE_SUMMARY}/${symbol}?modules=${FUNDAMENTAL_MODULES}`

    const tryFetchWithProxy = async (proxyIndex = 0, attempts = 0) => {
      if (proxyIndex >= CORS_PROXIES.length) {
        throw new Error('All proxies failed')
      }

      const proxy = CORS_PROXIES[proxyIndex]

      try {
        const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      } catch (err) {
        if (attempts < 3) {
          return tryFetchWithProxy(proxyIndex, attempts + 1)
        }
        return tryFetchWithProxy(proxyIndex + 1, 0)
      }
    }

    try {
      const result = await tryFetchWithProxy()

      if (result.quoteSummary?.result?.[0]) {
        setData(result.quoteSummary.result[0])
        setLastUpdated(new Date())
        setDataSource('Yahoo Finance')
      } else {
        // No data available from API
        setData(null)
        setError('No fundamental data available for this symbol')
      }
    } catch (err) {
      console.error('Error fetching fundamentals:', err)
      setData(null)
      setError(`Failed to fetch fundamentals: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    // Only fetch on mount or when symbol changes
    fetchData(true)

    if (autoRefresh) {
      const interval = setInterval(() => fetchData(true), refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, autoRefresh, refreshInterval])

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    data,
    loading,
    error,
    dataSource,
    lastUpdated,
    refresh: () => fetchData(true)
  }), [data, loading, error, dataSource, lastUpdated, fetchData])
}

// ============================================================================
// DATA FORMATTING UTILITIES
// ============================================================================

export function formatCurrency(value, currency = 'INR') {
  if (!value && value !== 0) return 'N/A'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(value)
}

export function formatNumber(value) {
  if (!value && value !== 0) return 'N/A'
  if (value >= 1e15) return `${(value / 1e15).toFixed(2)}Q`
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  return value.toLocaleString('en-US')
}

export function formatPercent(value) {
  if (!value && value !== 0) return 'N/A'
  return `${(value * 100).toFixed(2)}%`
}

export function formatRatio(value) {
  if (!value && value !== 0) return 'N/A'
  return value.toFixed(2)
}

// Get nested value from object path
export function getMetric(data, path) {
  if (!data) return null
  const keys = path.split('.')
  let value = data
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined || value === null) return null
  }
  return value?.raw !== undefined ? value.raw : value
}

