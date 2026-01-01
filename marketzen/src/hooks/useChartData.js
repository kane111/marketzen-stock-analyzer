import { useState, useEffect, useCallback, useMemo } from 'react'

// ==========================================
// USE CHART DATA - Chart Data Fetching Hook
// ==========================================
export function useChartData(symbol, timeframe, options = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!symbol) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/stock/${symbol}/history?period=${timeframe.value || timeframe}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }
      
      const result = await response.json()
      setData(result.data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
      console.error('Chart data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [symbol, timeframe])

  // Initial fetch and refresh
  useEffect(() => {
    fetchData()
    
    // Auto refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, autoRefresh, refreshInterval])

  // Computed data
  const computedData = useMemo(() => {
    if (!data) return null
    
    return {
      ...data,
      // Add any computed fields here (e.g., moving averages)
      dates: data.map(d => d.date),
      closes: data.map(d => d.close),
      opens: data.map(d => d.open),
      highs: data.map(d => d.high),
      lows: data.map(d => d.low),
      volumes: data.map(d => d.volume)
    }
  }, [data])

  return {
    data: computedData,
    rawData: data,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
    isEmpty: !loading && !error && (!data || data.length === 0)
  }
}

// ==========================================
// USE STOCK DATA - Stock Information Hook
// ==========================================
export function useStockData(symbol, options = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options
  
  const [stockData, setStockData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!symbol) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/stock/${symbol}/quote`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data')
      }
      
      const result = await response.json()
      setStockData(result.data)
    } catch (err) {
      setError(err.message)
      console.error('Stock data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    fetchData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, autoRefresh, refreshInterval])

  return {
    stockData,
    loading,
    error,
    refresh: fetchData,
    // Computed values
    isPositive: stockData?.change >= 0,
    changePercent: stockData?.change 
      ? ((stockData.change / (stockData.current_price - stockData.change)) * 100).toFixed(2)
      : null
  }
}

// ==========================================
// USE OHLC DATA - OHLC Candlestick Data Hook
// ==========================================
export function useOHLCData(symbol, timeframe, options = {}) {
  const [ohlc, setOhlc] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!symbol) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/stock/${symbol}/ohlc?period=${timeframe.value || timeframe}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch OHLC data')
      }
      
      const result = await response.json()
      setOhlc(result.data || [])
    } catch (err) {
      setError(err.message)
      console.error('OHLC data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [symbol, timeframe])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed values
  const computed = useMemo(() => {
    if (!ohlc.length) return null
    
    const closes = ohlc.map(d => d.close)
    const highs = ohlc.map(d => d.high)
    const lows = ohlc.map(d => d.low)
    const volumes = ohlc.map(d => d.volume)
    
    return {
      ohlc,
      closes,
      highs,
      lows,
      volumes,
      currentPrice: closes[closes.length - 1],
      highestPrice: Math.max(...highs),
      lowestPrice: Math.min(...lows),
      totalVolume: volumes.reduce((a, b) => a + b, 0),
      priceRange: {
        min: Math.min(...lows),
        max: Math.max(...highs)
      }
    }
  }, [ohlc])

  return {
    ohlc,
    loading,
    error,
    refresh: fetchData,
    ...computed
  }
}

export default useChartData
