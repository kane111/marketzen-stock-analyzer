import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, TrendingDown, X, BarChart2, RefreshCw, ArrowLeft, Activity, Zap, Target, LineChart, Clock, Globe, Settings, Wifi, WifiOff } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, ReferenceLine, Scatter } from 'recharts'
import SearchOverlay from './components/SearchOverlay'
import PriceCounter from './components/PriceCounter'
import TimeframeSelector from './components/TimeframeSelector'
import LoadingSkeleton from './components/LoadingSkeleton'
import TechnicalAnalysis from './components/TechnicalAnalysis'
import MarketStatus from './components/MarketStatus'

// Yahoo Finance API for Indian stocks (NSE)
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const CORS_PROXY = 'https://corsproxy.io/?'

// Default Indian NSE stocks
const DEFAULT_STOCKS = [
  { id: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries' },
  { id: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy Services' },
  { id: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { id: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { id: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India' }
]

// Map timeframe labels to Yahoo Finance ranges and intervals
const TIMEFRAMES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '1W', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1h' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' }
]

// Technical Analysis Timeframes (longer period for better signals)
const TA_TIMEFRAMES = [
  { label: '1M', range: '1mo', interval: '1h' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' }
]

// Multi-chart timeframes for comparison view
const MULTI_CHART_TIMEFRAMES = [
  { label: '1H', range: '1d', interval: '15m', type: 'intraday' },
  { label: '4H', range: '5d', interval: '1h', type: 'intraday' },
  { label: '1D', range: '1mo', interval: '1d', type: 'daily' },
  { label: '1W', range: '3mo', interval: '1wk', type: 'weekly' }
]

function App() {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('marketzen_watchlist')
    return saved ? JSON.parse(saved) : DEFAULT_STOCKS
  })
  
  const [view, setView] = useState('dashboard') // 'dashboard' or 'analysis'
  const [selectedStock, setSelectedStock] = useState(null)
  const [stockData, setStockData] = useState(null)
  const [chartData, setChartData] = useState([])
  const [multiChartData, setMultiChartData] = useState({})
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[1])
  const [selectedMultiTimeframes, setSelectedMultiTimeframes] = useState(['1D', '1W'])
  const [multiChartMode, setMultiChartMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [priceChange, setPriceChange] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileWatchlist, setShowMobileWatchlist] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [marketStatus, setMarketStatus] = useState('closed')

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load first stock
  useEffect(() => {
    if (watchlist.length > 0 && !selectedStock && view === 'dashboard') {
      setSelectedStock(watchlist[0])
    }
  }, [watchlist, selectedStock, view])

  // Save watchlist
  useEffect(() => {
    localStorage.setItem('marketzen_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Market status detection
  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date()
      const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
      const day = istNow.getDay()
      const hour = istNow.getHours()
      const minute = istNow.getMinutes()
      const currentMinutes = hour * 60 + minute
      
      // BSE/NSE trading hours: 9:15 AM - 3:30 PM IST, Mon-Fri
      const marketOpen = 9 * 60 + 15 // 9:15
      const marketClose = 15 * 60 + 30 // 15:30
      
      let status = 'closed'
      if (day >= 1 && day <= 5) {
        if (currentMinutes >= marketOpen && currentMinutes <= marketClose) {
          status = 'live'
        } else if (currentMinutes > marketClose) {
          status = 'post-market'
        } else {
          status = 'pre-market'
        }
      }
      setMarketStatus(status)
    }
    
    updateMarketStatus()
    const interval = setInterval(updateMarketStatus, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  const fetchStockData = useCallback(async (stock, timeframe = selectedTimeframe, taMode = false, isMultiChart = false, multiTimeframe = null) => {
    if (!stock) return
    
    setError(null)
    setLoading(true)
    
    try {
      const tf = taMode ? timeframe : (multiTimeframe || timeframe)
      const url = `${YAHOO_BASE}/${stock.id}?range=${tf.range}&interval=${tf.interval}`
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const data = await response.json()
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0]
        const quote = result.indicators?.quote?.[0] || {}
        const timestamps = result.timestamp || []
        const prices = quote.close || []
        const highs = quote.high || []
        const lows = quote.low || []
        const opens = quote.open || []
        const volumes = quote.volume || []
        
        // Get current price and previous close for change calculation
        const currentPrice = prices[prices.length - 1]
        const previousPrice = prices[0]
        const changePercent = previousPrice > 0 
          ? ((currentPrice - previousPrice) / previousPrice) * 100 
          : 0
        
        setPriceChange(changePercent)
        
        // Get stock info from meta
        const meta = result.meta
        const stockDataObj = {
          symbol: meta.symbol || stock.symbol,
          name: stock.name,
          current_price: currentPrice,
          previous_close: meta.previous_close || previousPrice,
          open: meta.open || prices[0],
          day_high: meta.day_high,
          day_low: meta.day_low,
          volume: quote.volume?.[prices.length - 1] || 0,
          // Full OHLCV data for technical analysis
          ohlc: timestamps.map((ts, i) => ({
            timestamp: ts,
            open: opens[i] || prices[0],
            high: highs[i] || prices[i],
            low: lows[i] || prices[i],
            close: prices[i],
            volume: volumes[i] || 0,
            date: new Date(ts * 1000).toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short',
              year: 'numeric'
            })
          })).filter(d => d.close !== null && d.close !== undefined)
        }
        
        // Transform chart data
        const transformed = timestamps.map((timestamp, index) => {
          const price = prices[index]
          const date = new Date(timestamp * 1000)
          return {
            timestamp: date,
            price: price,
            time: tf.range === '1d' || tf.range === '5d'
              ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
              : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
          }
        }).filter(item => item.price !== null && item.price !== undefined)
        
        if (isMultiChart) {
          // Store data for multi-chart view
          setMultiChartData(prev => ({
            ...prev,
            [multiTimeframe?.label || timeframe.label]: {
              data: transformed,
              stockData: stockDataObj
            }
          }))
        } else {
          setStockData(stockDataObj)
          setChartData(transformed)
        }
        
        setLastUpdated(new Date())
      } else {
        throw new Error('No data available')
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
      setError('Unable to fetch data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedTimeframe])

  // Fetch multi-chart data when mode is enabled
  useEffect(() => {
    if (multiChartMode && selectedStock) {
      const timeframesToFetch = MULTI_CHART_TIMEFRAMES.filter(tf => 
        selectedMultiTimeframes.includes(tf.label)
      )
      timeframesToFetch.forEach(tf => {
        fetchStockData(selectedStock, null, false, true, tf)
      })
    }
  }, [multiChartMode, selectedStock, selectedMultiTimeframes, fetchStockData])

  useEffect(() => {
    if (selectedStock) {
      const tf = view === 'analysis' ? TA_TIMEFRAMES[1] : selectedTimeframe
      fetchStockData(selectedStock, tf, view === 'analysis')
    }
  }, [selectedStock, selectedTimeframe, fetchStockData, view])

  // Auto-refresh during market hours
  useEffect(() => {
    if (marketStatus === 'live' && selectedStock) {
      const interval = setInterval(() => {
        const tf = view === 'analysis' ? TA_TIMEFRAMES[1] : selectedTimeframe
        fetchStockData(selectedStock, tf, view === 'analysis')
      }, 60000) // Refresh every minute during market hours
      
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    }
  }, [marketStatus, selectedStock, selectedTimeframe, fetchStockData, view])

  const handleStockSelect = (stock) => {
    setSelectedStock(stock)
    setShowMobileWatchlist(false)
    // Reset multi-chart data when switching stock
    if (multiChartMode) {
      setMultiChartData({})
      const timeframesToFetch = MULTI_CHART_TIMEFRAMES.filter(tf => 
        selectedMultiTimeframes.includes(tf.label)
      )
      timeframesToFetch.forEach(tf => {
        fetchStockData(stock, null, false, true, tf)
      })
    }
  }

  const handleAnalyzeClick = (stock, e) => {
    e.stopPropagation()
    setSelectedStock(stock)
    setView('analysis')
    setMultiChartMode(false)
    // Force refetch data for TA with proper timeframe
    setTimeout(() => {
      if (stock) {
        fetchStockData(stock, TA_TIMEFRAMES[1], true)
      }
    }, 100)
  }

  const handleBackToDashboard = () => {
    setView('dashboard')
    setSelectedTimeframe(TIMEFRAMES[1])
    setMultiChartMode(false)
  }

  const toggleMultiTimeframe = (label) => {
    setSelectedMultiTimeframes(prev => {
      if (prev.includes(label)) {
        if (prev.length > 1) {
          return prev.filter(l => l !== label)
        }
        return prev // Keep at least one selected
      } else {
        return [...prev, label]
      }
    })
  }

  const addToWatchlist = (stock) => {
    if (!watchlist.find(s => s.id === stock.id)) {
      setWatchlist(prev => [...prev, stock])
    }
    setSearchOpen(false)
  }

  const removeFromWatchlist = (e, stockId) => {
    e.stopPropagation()
    setWatchlist(prev => {
      const filtered = prev.filter(s => s.id !== stockId)
      if (selectedStock?.id === stockId && filtered.length > 0) {
        setSelectedStock(filtered[0])
      }
      return filtered
    })
  }

  const isPositive = priceChange >= 0

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatNumber = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toLocaleString()
  }

  const formatTimeAgo = (date) => {
    if (!date) return 'Never'
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background text-text overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-40 glass px-4 md:px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold tracking-tight">MarketZen</h1>
            <p className="text-xs text-textSecondary">Indian Stock Tracker</p>
          </div>
        </div>

        {/* Market Status Indicator */}
        <MarketStatus 
          marketStatus={marketStatus} 
          lastUpdated={lastUpdated} 
          onRefresh={() => selectedStock && fetchStockData(selectedStock, view === 'analysis' ? TA_TIMEFRAMES[1] : selectedTimeframe, view === 'analysis')}
        />

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchOpen(true)}
            className="glass px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surfaceLight transition-colors"
          >
            <Search className="w-4 h-4 text-textSecondary" />
            <span className="hidden sm:inline text-sm text-textSecondary">Search NSE stocks...</span>
            <kbd className="hidden md:inline px-2 py-0.5 text-xs bg-surfaceLight rounded text-textSecondary">⌘K</kbd>
          </motion.button>
          
          {isMobile && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileWatchlist(true)}
              className="glass p-2.5 rounded-lg"
            >
              <BarChart2 className="w-5 h-5 text-textSecondary" />
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className="pt-20 h-screen flex">
        {/* Watchlist Sidebar */}
        <AnimatePresence>
          {!isMobile && view === 'dashboard' && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed md:relative left-0 top-20 bottom-0 w-72 glass border-r border-white/5 overflow-y-auto z-30"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-textSecondary uppercase tracking-wider">Watchlist</h2>
                  <span className="text-xs text-textSecondary bg-surfaceLight px-2 py-1 rounded-full">{watchlist.length}</span>
                </div>
                
                <div className="space-y-2">
                  <AnimatePresence>
                    {watchlist.map((stock, index) => (
                      <motion.div
                        key={stock.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleStockSelect(stock)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
                          selectedStock?.id === stock.id 
                            ? 'bg-surfaceLight border border-primary/30' 
                            : 'hover:bg-surfaceLight border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                              selectedStock?.id === stock.id 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-surface text-textSecondary'
                            }`}>
                              {stock.symbol.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{stock.symbol}</p>
                              <p className="text-xs text-textSecondary truncate max-w-[120px]">{stock.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => handleAnalyzeClick(stock, e)}
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              title="Technical Analysis"
                            >
                              <Activity className="w-4 h-4" />
                            </motion.button>
                            <button
                              onClick={(e) => removeFromWatchlist(e, stock.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface rounded-lg transition-all"
                            >
                              <X className="w-4 h-4 text-textSecondary hover:text-negative" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Watchlist Drawer */}
        <AnimatePresence>
          {isMobile && showMobileWatchlist && view === 'dashboard' && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileWatchlist(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed left-0 top-0 bottom-0 w-80 glass z-50 overflow-y-auto"
              >
                <div className="p-4 pt-20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-textSecondary uppercase tracking-wider">Watchlist</h2>
                    <button onClick={() => setShowMobileWatchlist(false)}>
                      <X className="w-5 h-5 text-textSecondary" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {watchlist.map((stock) => (
                      <motion.div
                        key={stock.id}
                        onClick={() => handleStockSelect(stock)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          selectedStock?.id === stock.id 
                            ? 'bg-surfaceLight border border-primary/30' 
                            : 'hover:bg-surfaceLight'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                              selectedStock?.id === stock.id 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-surface text-textSecondary'
                            }`}>
                              {stock.symbol.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{stock.symbol}</p>
                              <p className="text-xs text-textSecondary">{stock.name}</p>
                            </div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleAnalyzeClick(stock, e)}
                            className="p-2 rounded-lg bg-primary/10 text-primary"
                          >
                            <Activity className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 ml-0 md:ml-72 p-4 md:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'analysis' ? (
              <TechnicalAnalysis 
                key="analysis"
                stock={selectedStock}
                stockData={stockData}
                onBack={handleBackToDashboard}
                taTimeframes={TA_TIMEFRAMES}
                fetchStockData={fetchStockData}
                loading={loading}
              />
            ) : loading ? (
              <LoadingSkeleton key="loading" />
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-64"
              >
                <div className="text-negative mb-4">{error}</div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchStockData(selectedStock)}
                  className="glass px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </motion.button>
              </motion.div>
            ) : stockData ? (
              <motion.div
                key={stockData.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto"
              >
                {/* Stock Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{stockData.symbol.substring(0, 2)}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold">{stockData.name}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-lg text-textSecondary">{stockData.symbol}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-surfaceLight text-textSecondary">
                          NSE
                        </span>
                        {/* Multi-chart mode toggle */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setMultiChartMode(!multiChartMode)
                            if (!multiChartMode) {
                              // Initialize multi-chart data
                              setMultiChartData({})
                              const timeframesToFetch = MULTI_CHART_TIMEFRAMES.filter(tf => 
                                selectedMultiTimeframes.includes(tf.label)
                              )
                              timeframesToFetch.forEach(tf => {
                                fetchStockData(selectedStock, null, false, true, tf)
                              })
                            }
                          }}
                          className={`ml-auto px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                            multiChartMode 
                              ? 'bg-primary text-white' 
                              : 'bg-surfaceLight text-textSecondary hover:bg-surface'
                          }`}
                        >
                          <BarChart2 className="w-4 h-4" />
                          Multi-Timeframe
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setView('analysis')}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm flex items-center gap-2 hover:bg-primary/20 transition-colors"
                        >
                          <Activity className="w-4 h-4" />
                          Technical Analysis
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <PriceCounter 
                      value={stockData.current_price} 
                      isPositive={isPositive}
                      prefix="₹"
                    />
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isPositive ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-mono font-medium">
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                      </span>
                      <span className="text-xs opacity-70">{selectedTimeframe.label}</span>
                    </motion.div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {[
                      { label: 'Open', value: formatCurrency(stockData.open) },
                      { label: 'Day High', value: formatCurrency(stockData.day_high) },
                      { label: 'Day Low', value: formatCurrency(stockData.day_low) },
                      { label: 'Volume', value: formatNumber(stockData.volume) }
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass p-4 rounded-xl"
                      >
                        <p className="text-xs text-textSecondary mb-1">{stat.label}</p>
                        <p className="font-mono font-medium">{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Chart Section */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <h3 className="text-lg font-medium">
                      {multiChartMode ? 'Multi-Timeframe Analysis' : 'Price Chart'}
                    </h3>
                    
                    {!multiChartMode ? (
                      <TimeframeSelector 
                        timeframes={TIMEFRAMES}
                        selected={selectedTimeframe}
                        onSelect={setSelectedTimeframe}
                      />
                    ) : (
                      /* Multi-chart timeframe selector */
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-textSecondary mr-2">Compare:</span>
                        {MULTI_CHART_TIMEFRAMES.map((tf) => (
                          <motion.button
                            key={tf.label}
                            onClick={() => toggleMultiTimeframe(tf.label)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              selectedMultiTimeframes.includes(tf.label)
                                ? 'bg-primary text-white'
                                : 'bg-surfaceLight text-textSecondary hover:bg-surface'
                            }`}
                          >
                            {tf.label}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Single Chart View */}
                  {!multiChartMode ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            interval="preserveStartEnd"
                            minTickGap={50}
                          />
                          <YAxis 
                            domain={['auto', 'auto']}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickFormatter={(value) => `₹${value.toLocaleString()}`}
                            width={80}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(21, 26, 33, 0.95)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              backdropFilter: 'blur(12px)'
                            }}
                            labelStyle={{ color: '#9ca3af' }}
                            formatter={(value) => [formatCurrency(value), 'Price']}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={isPositive ? '#10b981' : '#ef4444'}
                            strokeWidth={2}
                            fill="url(#colorPrice)"
                            animationDuration={1000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    /* Multi-Chart Grid View */
                    <div className={`grid gap-4 ${
                      selectedMultiTimeframes.length <= 2 ? 'grid-cols-2' : 
                      selectedMultiTimeframes.length <= 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'
                    }`}>
                      {selectedMultiTimeframes.map((tfLabel) => {
                        const chartInfo = multiChartData[tfLabel]
                        const timeframe = MULTI_CHART_TIMEFRAMES.find(t => t.label === tfLabel)
                        const chartDataTf = chartInfo?.data || []
                        const stockDataTf = chartInfo?.stockData
                        const isPositiveTf = stockDataTf ? 
                          (stockDataTf.current_price >= stockDataTf.previous_close) : true
                        
                        return (
                          <motion.div
                            key={tfLabel}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-textSecondary">{tfLabel}</span>
                              {stockDataTf && (
                                <span className={`text-sm font-mono ${
                                  isPositiveTf ? 'text-positive' : 'text-negative'
                                }`}>
                                  {formatCurrency(stockDataTf.current_price)}
                                </span>
                              )}
                            </div>
                            <div className="h-40">
                              {chartDataTf.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartDataTf}>
                                    <defs>
                                      <linearGradient id={`colorPrice${tfLabel}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPositiveTf ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={isPositiveTf ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" hide />
                                    <YAxis 
                                      domain={['auto', 'auto']}
                                      tick={{ fill: '#6b7280', fontSize: 10 }}
                                      tickFormatter={(value) => `₹${value}`}
                                      width={50}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        background: 'rgba(21, 26, 33, 0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        fontSize: '11px'
                                      }}
                                      formatter={(value) => [formatCurrency(value), 'Price']}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="price"
                                      stroke={isPositiveTf ? '#10b981' : '#ef4444'}
                                      strokeWidth={1.5}
                                      fill={`url(#colorPrice${tfLabel})`}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                                  />
                                </div>
                              )}
                            </div>
                            {stockDataTf && (
                              <div className="mt-2 flex items-center justify-between text-xs text-textSecondary">
                                <span>Vol: {formatNumber(stockDataTf.volume)}</span>
                                <span className={isPositiveTf ? 'text-positive' : 'text-negative'}>
                                  {isPositiveTf ? '+' : ''}
                                  {((stockDataTf.current_price - stockDataTf.previous_close) / stockDataTf.previous_close * 100).toFixed(2)}%
                                </span>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-textSecondary">Select a stock to view details</p>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Search Overlay */}
      <SearchOverlay 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={addToWatchlist}
      />
    </div>
  )
}

export default App
