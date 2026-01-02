import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, TrendingDown, X, BarChart2, RefreshCw, ArrowLeft, Activity, Zap, Target, LineChart, Clock, Globe, Settings, Wifi, WifiOff, Wallet, PieChart, Sliders, BarChart3, Newspaper, Grid, List, Bell, TrendingUp as TrendingUpIcon, AlertTriangle, Eye, Filter, TrendingUp as ChartIcon, Palette, Download, CandlestickChart, Download as DownloadIcon, Menu, Terminal, ChevronRight, ChevronDown, Copy, Check, RotateCcw, Play, Pause, Maximize2, Minimize2, GripVertical } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import SearchOverlay from './components/SearchOverlay'
import PriceCounter from './components/PriceCounter'
import LoadingSkeleton from './components/LoadingSkeleton'
import TechnicalAnalysis from './components/TechnicalAnalysis'
import MarketStatus from './components/MarketStatus'
import Portfolio from './components/Portfolio'
import { IndicatorConfig, DEFAULT_PARAMS } from './components/IndicatorConfig'
import SectorDashboard from './components/SectorDashboard'
import NewsFeed from './components/NewsFeed'
import AlertsManager from './components/AlertsManager'
import FundamentalsPanel from './components/FundamentalsPanel'
import StockComparison from './components/StockComparison'
import WatchlistPanel from './components/WatchlistPanel'
import PerformanceChart from './components/PerformanceChart'
import StockScreener from './components/StockScreener'
import ThemeSettings from './components/ThemeSettings'
import AdvancedCharting from './components/AdvancedCharting'
import DataExport from './components/DataExport'
import ChartWrapper from './components/charts/ChartWrapper'
import { TimeframeSelector, CHART_TIMEFRAMES, TA_TIMEFRAMES, MULTI_CHART_TIMEFRAMES } from './components/charts/TimeframeSelector'
import { AlertsProvider } from './context/AlertsContext'
import { PortfolioProvider } from './context/PortfolioContext'
import { WatchlistProvider } from './context/WatchlistContext'
import { ThemeProvider } from './context/ThemeContext'

// Yahoo Finance API for Indian stocks (NSE)
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

// Multiple CORS proxy options for better reliability in different regions
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://justfetch.itsvg.in/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.pages.dev/?',
  'https://proxy.cors.sh/'
]

// Default Indian NSE stocks
const DEFAULT_STOCKS = [
  { id: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries' },
  { id: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy Services' },
  { id: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { id: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { id: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India' }
]

// Map timeframe labels to Yahoo Finance ranges and interval (deprecated - use CHART_TIMEFRAMES)
const TIMEFRAMES = CHART_TIMEFRAMES

// Sector to stock mapping
const SECTOR_STOCKS = {
  'nifty50': ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'INFY.NS'],
  'niftybank': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
  'niftyit': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'TECHM.NS', 'HCLTECH.NS'],
  'nifty pharma': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'BHARTIARTL.NS', 'ZYDUSLIFE.NS'],
  'nifty auto': ['MARUTI.NS', 'TATAMOTORS.NS', 'MOTHERSUMI.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS'],
  'nifty fmcg': ['HINDUNILVR.NS', 'NESTLEIND.NS', 'ASIANPAINT.NS', 'DABUR.NS', 'BRITANNIA.NS'],
  'nifty metal': ['TATASTEEL.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'COALINDIA.NS', 'VEDL.NS'],
  'nifty realty': ['DLF.NS', 'GODREJPROP.NS', 'SOBHA.NS', 'PRESTIGE.NS', 'LODHA.NS'],
  'nifty energy': ['RELIANCE.NS', 'ONGC.NS', 'IOC.NS', 'NTPC.NS', 'POWERGRID.NS'],
  'nifty media': ['ZEE.NS', 'PVR.NS', 'INOXLEISUR.NS', 'DISHTV.NS', 'SUNTV.NS'],
  'nifty consumer': ['HINDUNILVR.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'ITC.NS', 'GODREJCP.NS'],
  'nifty healthcare': ['APOLLOHOSP.NS', 'FORTIS.NS', 'MAXHEALTH.NS', 'METROPOLIS.NS', 'DRREDDY.NS']
}

function AppContent() {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('marketzen_watchlist')
    return saved ? JSON.parse(saved) : DEFAULT_STOCKS
  })
  
  // Main view state: dashboard, analysis, portfolio, sectors, news, alerts, fundamentals, comparison, watchlist, performance, screener, theme, advancedChart, export
  const [view, setView] = useState('dashboard')
  const [selectedStock, setSelectedStock] = useState(null)
  const [stockData, setStockData] = useState(null)
  const [chartData, setChartData] = useState([])
  const [multiChartData, setMultiChartData] = useState({})
  const [selectedMultiTimeframes, setSelectedMultiTimeframes] = useState(['1D', '1W'])
  const [multiChartMode, setMultiChartMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [priceChange, setPriceChange] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileWatchlist, setShowMobileWatchlist] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [marketStatus, setMarketStatus] = useState('closed')
  const [showIndicatorConfig, setShowIndicatorConfig] = useState(false)
  const [notification, setNotification] = useState(null)
  const [indicatorParams, setIndicatorParams] = useState(() => {
    const saved = localStorage.getItem('marketzen_indicator_params')
    return saved ? JSON.parse(saved) : DEFAULT_PARAMS
  })
  
  // Search bar state (replaces command mode)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchHighlighted, setSearchHighlighted] = useState(0)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  
  // Terminal Workspace specific state
  const [copiedData, setCopiedData] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [cursorBlink, setCursorBlink] = useState(true)
  const [rightPanelTab, setRightPanelTab] = useState('depth')
  
  // Fundamentals panel state
  const [showFundamentalsPanel, setShowFundamentalsPanel] = useState(false)
  const handleCloseFundamentals = useCallback(() => {
    setShowFundamentalsPanel(false)
  }, [])
  
  // Fundamentals cache for background fetching
  const [fundamentalsCache, setFundamentalsCache] = useState({})
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false)
  
  // Panel sizing
  const [leftPanelWidth, setLeftPanelWidth] = useState(200)
  const [rightPanelWidth, setRightPanelWidth] = useState(250)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  
  const searchInputRef = useRef(null)
  const resizeTimeoutRef = useRef(null)
  
  // Combined stock list for search (watchlist + popular stocks)
  const allStocksForSearch = [...watchlist, ...DEFAULT_STOCKS.filter(ds => !watchlist.find(w => w.id === ds.id))]
  
  // Search functionality
  const handleSearchChange = (e) => {
    const query = e.target.value.trim().toUpperCase()
    setSearchQuery(query)
    
    if (query.length > 0) {
      const filtered = allStocksForSearch.filter(stock => 
        stock.symbol.toUpperCase().includes(query) || 
        stock.name.toUpperCase().includes(query)
      ).slice(0, 8)
      setSearchResults(filtered)
      setShowSearchDropdown(true)
      setSearchHighlighted(0)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }
  
  const handleSearchKeyDown = (e) => {
    if (!showSearchDropdown) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSearchHighlighted(prev => Math.min(prev + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSearchHighlighted(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults[searchHighlighted]) {
        handleStockSelect(searchResults[searchHighlighted])
        clearSearch()
      }
    } else if (e.key === 'Escape') {
      clearSearch()
    }
  }
  
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchDropdown(false)
    setSearchHighlighted(0)
    searchInputRef.current?.blur()
  }
  
  const handleSearchResultClick = (stock) => {
    handleStockSelect(stock)
    clearSearch()
  }

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle Escape key for modals (Search Overlay and Keyboard Shortcuts)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false)
        }
        if (searchOpen) {
          setSearchOpen(false)
        }
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showKeyboardShortcuts, searchOpen])

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load first stock and fetch data
  useEffect(() => {
    if (watchlist.length > 0 && !selectedStock && view === 'dashboard') {
      const firstStock = watchlist[0]
      setSelectedStock(firstStock)
      fetchStockData(firstStock, TIMEFRAMES[1])
    }
  }, [watchlist, selectedStock, view])

  // Save watchlist
  useEffect(() => {
    localStorage.setItem('marketzen_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Save indicator params
  useEffect(() => {
    localStorage.setItem('marketzen_indicator_params', JSON.stringify(indicatorParams))
  }, [indicatorParams])

  // Clear refresh interval on unmount or view change
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [refreshInterval])

  // Cursor blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorBlink(prev => !prev)
    }, 530)
    return () => clearInterval(blinkInterval)
  }, [])

  // Market status detection
  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date()
      const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
      const day = istNow.getDay()
      const hour = istNow.getHours()
      const minute = istNow.getMinutes()
      const currentMinutes = hour * 60 + minute
      
      const marketOpen = 9 * 60 + 15
      const marketClose = 15 * 60 + 30
      
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
    const interval = setInterval(updateMarketStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchStockData = useCallback(async (stock, timeframe, taMode = false, isMultiChart = false, multiTimeframe = null) => {
    if (!stock) return
    
    const effectiveTimeframe = timeframe || TIMEFRAMES[1]
    
    setError(null)
    setLoading(true)
    
    const tf = taMode ? timeframe : (multiTimeframe || effectiveTimeframe)
    const url = `${YAHOO_BASE}/${stock.id}?range=${tf.range}&interval=${tf.interval}`
    
    const tryFetchWithProxy = async (proxyIndex = 0) => {
      if (proxyIndex >= CORS_PROXIES.length) {
        throw new Error('All proxies failed')
      }
      
      const proxy = CORS_PROXIES[proxyIndex]
      
      try {
        const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': window.location.origin,
          }
        })
        
        if (!response.ok) {
          throw new Error(`Proxy ${proxyIndex + 1} returned ${response.status}`)
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Proxy ${proxyIndex + 1} returned non-JSON response`)
        }
        
        return await response.json()
      } catch (err) {
        console.warn(`Proxy ${proxyIndex + 1} failed:`, err.message)
        return tryFetchWithProxy(proxyIndex + 1)
      }
    }
    
    try {
      const data = await tryFetchWithProxy()
      
      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0]
        const quote = result.indicators?.quote?.[0] || {}
        const timestamps = result.timestamp || []
        const prices = quote.close || []
        const highs = quote.high || []
        const lows = quote.low || []
        const opens = quote.open || []
        const volumes = quote.volume || []
        
        const currentPrice = prices[prices.length - 1]
        const previousPrice = prices[0]
        const changePercent = previousPrice > 0 
          ? ((currentPrice - previousPrice) / previousPrice) * 100 
          : 0
        
        setPriceChange(changePercent)
        
        const meta = result.meta
        const stockDataObj = {
          id: stock.id,
          symbol: meta.symbol || stock.symbol,
          name: stock.name,
          current_price: currentPrice,
          previous_close: meta.previous_close || previousPrice,
          open: meta.open || prices[0],
          day_high: meta.day_high,
          day_low: meta.day_low,
          volume: quote.volume?.[prices.length - 1] || 0,
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
        throw new Error('No data available for this stock')
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
      setError('Unable to fetch data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [TIMEFRAMES[1]])

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

  // Auto-refresh during market hours
  useEffect(() => {
    if (autoRefresh && marketStatus === 'live' && selectedStock && (view === 'dashboard' || view === 'analysis')) {
      const interval = setInterval(() => {
        const tf = view === 'analysis' ? TA_TIMEFRAMES[1] : TIMEFRAMES[1]
        fetchStockData(selectedStock, tf, view === 'analysis')
      }, 60000)
      
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    }
  }, [marketStatus, selectedStock, TIMEFRAMES[1], fetchStockData, view, autoRefresh])

  const handleStockSelect = (stock) => {
    setSelectedStock(stock)
    setShowMobileWatchlist(false)
    setView('dashboard')
    
    // Always fetch data for the selected stock
    const timeframe = view === 'analysis' ? TA_TIMEFRAMES[1] : TIMEFRAMES[1]
    fetchStockData(stock, timeframe, view === 'analysis')
    
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

  // Background fundamentals fetching - fetch when stock changes even if panel is closed
  useEffect(() => {
    if (!selectedStock?.id) return
    
    // Check if we already have cached data that's not too old (5 minutes)
    const cached = fundamentalsCache[selectedStock.id]
    const cacheAge = cached?.timestamp ? Date.now() - cached.timestamp : Infinity
    const CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes
    
    if (cached && cacheAge < CACHE_MAX_AGE) {
      // Use cached data, no need to fetch
      return
    }
    
    // Fetch fundamentals in background
    setFundamentalsLoading(true)
    const YAHOO_QUOTE_SUMMARY = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary'
    const FUNDAMENTAL_MODULES = 'summaryDetail,defaultKeyStatistics,financialData,incomeStatementHistory,balanceSheetHistory'
    const url = `${YAHOO_QUOTE_SUMMARY}/${selectedStock.id}?modules=${FUNDAMENTAL_MODULES}`
    
    const CORS_PROXIES = [
      'https://corsproxy.io/?',
      'https://justfetch.itsvg.in/?url=',
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.pages.dev/?',
      'https://proxy.cors.sh/'
    ]
    
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
    
    tryFetchWithProxy()
      .then(result => {
        if (result.quoteSummary?.result?.[0]) {
          setFundamentalsCache(prev => ({
            ...prev,
            [selectedStock.id]: {
              data: result.quoteSummary.result[0],
              timestamp: Date.now()
            }
          }))
        }
      })
      .catch(err => {
        console.error('Background fundamentals fetch error:', err)
      })
      .finally(() => {
        setFundamentalsLoading(false)
      })
  }, [selectedStock?.id, fundamentalsCache])

  const handleAnalyzeClick = (stock, e) => {
    e.stopPropagation()
    setSelectedStock(stock)
    setView('analysis')
    setMultiChartMode(false)
    setTimeout(() => {
      if (stock) {
        fetchStockData(stock, TA_TIMEFRAMES[1], true)
      }
    }, 100)
  }

  const handleBackToDashboard = () => {
    setView('dashboard')
    setMultiChartMode(false)
  }

  const toggleMultiTimeframe = (label) => {
    setSelectedMultiTimeframes(prev => {
      if (prev.includes(label)) {
        if (prev.length > 1) {
          return prev.filter(l => l !== label)
        }
        return prev
      } else {
        return [...prev, label]
      }
    })
  }

  const addToWatchlist = (stock) => {
    const exists = watchlist.find(s => s.id === stock.id)
    if (exists) {
      showNotification(`${stock.symbol} is already in your watchlist`, 'warning')
    } else {
      setWatchlist(prev => [...prev, stock])
      showNotification(`${stock.symbol} added to watchlist`, 'success')
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

  const handleSectorSelect = (sector) => {
    const sectorStockIds = SECTOR_STOCKS[sector.id] || []
    const newStocks = []
    
    sectorStockIds.forEach(stockId => {
      const exists = watchlist.find(s => s.id === stockId)
      if (!exists) {
        const stockInfo = DEFAULT_STOCKS.find(s => s.id === stockId)
        if (stockInfo) {
          newStocks.push(stockInfo)
        }
      }
    })
    
    if (newStocks.length > 0) {
      setWatchlist(prev => [...prev, ...newStocks])
      showNotification(`${newStocks.length} stocks from ${sector.name} added to watchlist`, 'success')
    } else {
      showNotification(`${sector.name} stocks are already in your watchlist`, 'info')
    }
    
    setView('dashboard')
  }

  const handlePortfolioStockSelect = (stock) => {
    setSelectedStock(stock)
    setView('dashboard')
  }

  const isPositive = priceChange >= 0

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '--'
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value) || value === 0) {
      return '--'
    }
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toLocaleString()
  }

  const handleIndicatorParamsChange = (newParams) => {
    setIndicatorParams(newParams)
    setShowIndicatorConfig(false)
  }

  // Copy data to clipboard
  const copyToClipboard = (data) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text)
    setCopiedData(true)
    setTimeout(() => setCopiedData(false), 2000)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K for advanced search overlay
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      
      // R for quick refresh
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement !== searchInputRef.current) {
        if (selectedStock) {
          fetchStockData(selectedStock, TIMEFRAMES[1], view === 'analysis')
        }
        return
      }
      
      // A for analysis
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement !== searchInputRef.current) {
        if (selectedStock) {
          setView('analysis')
        }
        return
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStock, TIMEFRAMES[1], view, fetchStockData])

  // Panel resizing handlers
  const handleMouseDownLeft = (e) => {
    e.preventDefault()
    setIsResizingLeft(true)
  }
  
  const handleMouseDownRight = (e) => {
    e.preventDefault()
    setIsResizingRight(true)
  }
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = Math.min(Math.max(200, e.clientX), 450)
        setLeftPanelWidth(newWidth)
      }
      if (isResizingRight) {
        const newWidth = Math.min(Math.max(250, window.innerWidth - e.clientX - 80), 500)
        setRightPanelWidth(newWidth)
      }
    }
    
    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }
    
    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingLeft, isResizingRight])

  // View navigation helper
  const isViewActive = (targetView) => view === targetView

  return (
    <ThemeProvider>
      <WatchlistProvider>
        <PortfolioProvider watchlist={watchlist}>
          <AlertsProvider stockData={stockData} marketStatus={marketStatus}>
            <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono overflow-hidden">
              {/* Notification Toast */}
              <AnimatePresence>
                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg font-mono text-sm ${
                      notification.type === 'success' ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/30' :
                      notification.type === 'warning' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                      notification.type === 'info' ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/30' :
                      'bg-negative/20 text-negative border border-negative/30'
                    }`}
                  >
                    <p className="font-medium">{notification.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keyboard Shortcuts Modal */}
              <AnimatePresence>
                {showKeyboardShortcuts && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
                    onClick={() => setShowKeyboardShortcuts(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-terminal-panel border border-terminal-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-terminal-green flex items-center gap-2">
                          <Terminal className="w-5 h-5" />
                          Keyboard Shortcuts
                        </h3>
                        <button
                          onClick={() => setShowKeyboardShortcuts(false)}
                          className="text-terminal-dim hover:text-terminal-text transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-3 text-sm">
                        {[
                          { keys: '/', desc: 'Open command mode' },
                          { keys: 'Ctrl/Cmd + K', desc: 'Search stocks' },
                          { keys: 'Ctrl/Cmd + /', desc: 'Show shortcuts' },
                          { keys: 'Esc', desc: 'Close command mode' },
                          { keys: '↑/↓', desc: 'Navigate command history' },
                          { keys: 'R', desc: 'Quick refresh data' },
                          { keys: 'A', desc: 'Go to analysis' },
                        ].map((shortcut) => (
                          <div key={shortcut.keys} className="flex items-center justify-between py-2 border-b border-terminal-border/50 last:border-0">
                            <kbd className="px-3 py-1 bg-terminal-bg rounded text-terminal-green font-mono text-xs">
                              {shortcut.keys}
                            </kbd>
                            <span className="text-terminal-dim">{shortcut.desc}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 pt-4 border-t border-terminal-border">
                        <p className="text-xs text-terminal-dim text-center">
                          Press <kbd className="px-2 py-0.5 bg-terminal-bg rounded text-terminal-green mx-1">?</kbd> anywhere to show this help
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terminal Header */}
              <motion.header 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-50 bg-terminal-header border-b border-terminal-border px-4 py-2"
              >
                <div className="flex items-center justify-between">
                  {/* Logo & Status */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-terminal-green/20 flex items-center justify-center">
                        <Terminal className="w-4 h-4 text-terminal-green" />
                      </div>
                      <span className="font-bold text-terminal-text">MarketZen_Terminal</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-terminal-bg text-terminal-dim">v2.0</span>
                    </div>
                    
                    {/* Status Indicators */}
                    <div className="hidden md:flex items-center gap-4 ml-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${marketStatus === 'live' ? 'bg-terminal-green animate-pulse' : marketStatus === 'pre-market' ? 'bg-amber-500' : marketStatus === 'post-market' ? 'bg-blue-500' : 'bg-terminal-dim'}`}></span>
                        <span className="text-xs text-terminal-dim">
                          {marketStatus === 'live' ? 'MARKET OPEN' : marketStatus === 'pre-market' ? 'PRE-MARKET' : marketStatus === 'post-market' ? 'POST-MARKET' : 'MARKET CLOSED'}
                        </span>
                      </div>
                      
                      {autoRefresh && (
                        <div className="flex items-center gap-1 text-xs text-terminal-green">
                          <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                          <span>AUTO</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-terminal-dim">
                        <Clock className="w-3 h-3" />
                        <span>{lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { hour12: false }) : '--:--:--'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Search Bar */}
                  <div className="flex-1 max-w-xl mx-6 relative">
                    <div className="flex items-center bg-terminal-bg rounded-lg border border-terminal-border focus-within:border-terminal-green transition-all duration-200">
                      <span className="pl-3 text-terminal-dim">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => searchQuery && setShowSearchDropdown(true)}
                        placeholder="Search stocks (e.g., RELIANCE, TCS, HDFC...)"
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-terminal-text placeholder-terminal-dim focus:outline-none font-mono"
                      />
                      <div className="pr-3 flex items-center gap-2">
                        {searchQuery && (
                          <button
                            onClick={clearSearch}
                            className="text-terminal-dim hover:text-terminal-text transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <span className="text-xs text-terminal-dim bg-terminal-panel px-1.5 py-0.5 rounded border border-terminal-border">
                          Ctrl+K
                        </span>
                      </div>
                    </div>
                    
                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                      {showSearchDropdown && searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-full max-w-xl bg-terminal-panel border border-terminal-border rounded-lg shadow-xl overflow-hidden z-50"
                        >
                          {searchResults.map((stock, index) => (
                            <button
                              key={stock.id}
                              onClick={() => handleSearchResultClick(stock)}
                              className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-terminal-bg transition-colors ${
                                index === searchHighlighted ? 'bg-terminal-bg' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-terminal-bg flex items-center justify-center text-xs font-bold font-mono text-terminal-green">
                                  {stock.symbol.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-terminal-text">{stock.symbol}</p>
                                  <p className="text-xs text-terminal-dim truncate max-w-[200px]">{stock.name}</p>
                                </div>
                              </div>
                              {index === searchHighlighted && (
                                <ChevronRight className="w-4 h-4 text-terminal-dim" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchOpen(true)}
                      className="p-2 rounded-lg bg-terminal-bg border border-terminal-border hover:border-terminal-dim transition-colors"
                      title="Search (Ctrl+K)"
                    >
                      <Search className="w-4 h-4 text-terminal-dim" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectedStock && fetchStockData(selectedStock, TIMEFRAMES[1], view === 'analysis')}
                      className="p-2 rounded-lg bg-terminal-bg border border-terminal-border hover:border-terminal-green hover:text-terminal-green transition-colors"
                      title="Manual Refresh (R)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.header>

              {/* Terminal Workspace - Three Panel Layout */}
              <div className="pt-14 h-screen flex overflow-hidden">
                
                {/* Left Panel - Watchlist */}
                <motion.aside
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="hidden lg:flex flex-col bg-terminal-panel border-r border-terminal-border relative"
                  style={{ width: leftPanelWidth }}
                >
                  {/* Resize Handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-terminal-green transition-colors z-10"
                    onMouseDown={handleMouseDownLeft}
                  />
                  
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border bg-terminal-header">
                    <div className="flex items-center gap-2">
                      <span className="text-terminal-green font-bold text-sm">WATCHLIST</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-terminal-bg text-terminal-dim">
                        {watchlist.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSearchOpen(true)}
                        className="p-1 rounded hover:bg-terminal-bg transition-colors"
                        title="Add Stock"
                      >
                        <span className="text-terminal-dim text-xs">+</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Stock List */}
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence>
                      {watchlist.map((stock, index) => (
                        <motion.div
                          key={stock.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleStockSelect(stock)}
                          className={`px-4 py-3 border-b border-terminal-border/50 cursor-pointer transition-all hover:bg-terminal-bg group ${
                            selectedStock?.id === stock.id ? 'bg-terminal-bg border-l-2 border-l-terminal-green' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold font-mono ${
                                selectedStock?.id === stock.id 
                                  ? 'bg-terminal-green/20 text-terminal-green' 
                                  : 'bg-terminal-bg text-terminal-dim'
                              }`}>
                                {stock.symbol.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{stock.symbol}</p>
                                <p className="text-xs text-terminal-dim truncate max-w-[120px]">{stock.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleAnalyzeClick(stock, e)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-terminal-green/20 text-terminal-green hover:bg-terminal-green/30 transition-all"
                                title="Analysis (A)"
                              >
                                <Activity className="w-3 h-3" />
                              </motion.button>
                              <button
                                onClick={(e) => removeFromWatchlist(e, stock.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-negative/20 rounded transition-all"
                              >
                                <X className="w-3 h-3 text-terminal-dim hover:text-negative" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {/* Panel Footer */}
                  <div className="px-4 py-2 border-t border-terminal-border bg-terminal-header">
                    <p className="text-xs text-terminal-dim font-mono">
                      <span className="text-terminal-green">$</span> workspace:watchlist
                    </p>
                  </div>
                </motion.aside>

                {/* Main Content - Chart & Analysis */}
                <main className="flex-1 flex flex-col overflow-hidden bg-terminal-bg min-w-0 relative">
                  <AnimatePresence mode="wait">
                    {/* Alerts View */}
                    {view === 'alerts' && (
                      <AlertsManager
                        key="alerts"
                        stock={selectedStock}
                        currentStockData={stockData}
                        onClose={() => setView('dashboard')}
                      />
                    )}

                    {/* Watchlist View */}
                    {view === 'watchlist' && (
                      <WatchlistPanel
                        key="watchlist"
                        onStockSelect={handleStockSelect}
                      />
                    )}

                    {/* Performance View */}
                    {view === 'performance' && (
                      <PerformanceChart
                        key="performance"
                        onStockSelect={handleStockSelect}
                      />
                    )}

                    {/* Stock Screener View */}
                    {view === 'screener' && (
                      <StockScreener
                        key="screener"
                        onStockSelect={handleStockSelect}
                      />
                    )}

                    {/* Theme Settings View */}
                    {view === 'theme' && (
                      <ThemeSettings
                        key="theme"
                      />
                    )}

                    {/* Advanced Charting View */}
                    {view === 'advancedChart' && (
                      <AdvancedCharting
                        key="advancedChart"
                        onStockSelect={handleStockSelect}
                      />
                    )}

                    {/* Data Export View */}
                    {view === 'export' && (
                      <DataExport
                        key="export"
                      />
                    )}

                    {/* Comparison View */}
                    {view === 'comparison' && (
                      <StockComparison
                        key="comparison"
                        onClose={() => setView('dashboard')}
                        watchlist={watchlist}
                      />
                    )}

                    {/* Portfolio View */}
                    {view === 'portfolio' ? (
                      <Portfolio 
                        key="portfolio"
                        onStockSelect={handlePortfolioStockSelect}
                      />
                    ) : view === 'sectors' ? (
                      <SectorDashboard 
                        key="sectors"
                        onSectorSelect={handleSectorSelect}
                      />
                    ) : view === 'news' ? (
                      <NewsFeed 
                        key="news"
                        stockId={selectedStock?.id || null}
                        onBack={() => setView('dashboard')}
                      />
                    ) : view === 'analysis' ? (
                      <TechnicalAnalysis 
                        key="analysis"
                        stock={selectedStock}
                        stockData={stockData}
                        onBack={handleBackToDashboard}
                        taTimeframes={TA_TIMEFRAMES}
                        fetchStockData={fetchStockData}
                        loading={loading}
                        indicatorParams={indicatorParams}
                        onOpenConfig={() => setShowIndicatorConfig(true)}
                      />
                    ) : loading ? (
                      <LoadingSkeleton key="loading" />
                    ) : error ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full"
                      >
                        <div className="text-negative mb-4 font-mono">{error}</div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => fetchStockData(selectedStock)}
                          className="px-4 py-2 rounded border border-terminal-border flex items-center gap-2 hover:bg-terminal-panel transition-colors font-mono text-sm"
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
                        className="h-full flex flex-col"
                      >
                        {/* Stock Header */}
                        <div className="flex-shrink-0 px-6 py-4 border-b border-terminal-border bg-terminal-panel">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded bg-terminal-green/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold font-mono text-terminal-green">{stockData.symbol.substring(0, 2)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-lg font-semibold truncate">{stockData.name}</h2>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-sm text-terminal-dim font-mono">{stockData.symbol}</span>
                                <span className="px-2 py-0.5 rounded text-xs bg-terminal-bg text-terminal-dim border border-terminal-border">
                                  NSE
                                </span>
                                
                                {/* Quick Actions */}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setShowFundamentalsPanel(!showFundamentalsPanel)}
                                  className={`px-3 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                                    showFundamentalsPanel 
                                      ? 'bg-terminal-green text-terminal-bg border border-terminal-green' 
                                      : 'bg-terminal-bg border border-terminal-border hover:border-terminal-dim'
                                  }`}
                                >
                                  <PieChart className="w-3 h-3" />
                                  Fundamentals
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setMultiChartMode(!multiChartMode)
                                    if (!multiChartMode) {
                                      setMultiChartData({})
                                      const timeframesToFetch = MULTI_CHART_TIMEFRAMES.filter(tf => 
                                        selectedMultiTimeframes.includes(tf.label)
                                      )
                                      timeframesToFetch.forEach(tf => {
                                        fetchStockData(selectedStock, null, false, true, tf)
                                      })
                                    }
                                  }}
                                  className={`px-3 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                                    multiChartMode 
                                      ? 'bg-terminal-green text-terminal-bg border border-terminal-green' 
                                      : 'bg-terminal-bg border border-terminal-border hover:border-terminal-dim'
                                  }`}
                                >
                                  <BarChart2 className="w-3 h-3" />
                                  Multi
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setView('analysis')}
                                  className="px-3 py-1 rounded text-xs bg-terminal-green/20 text-terminal-green border border-terminal-green/50 flex items-center gap-2 hover:bg-terminal-green/30 transition-colors"
                                >
                                  <Activity className="w-3 h-3" />
                                  Analysis
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => copyToClipboard(stockData)}
                                  className="p-1.5 rounded bg-terminal-bg border border-terminal-border hover:border-terminal-dim transition-colors"
                                  title="Copy Data"
                                >
                                  {copiedData ? <Check className="w-3 h-3 text-terminal-green" /> : <Copy className="w-3 h-3" />}
                                </motion.button>
                              </div>
                            </div>
                          </div>

                          {/* Price Display */}
                          <div className="flex items-baseline gap-4 mt-4">
                            <PriceCounter 
                              value={stockData.current_price} 
                              isPositive={isPositive}
                              prefix="₹"
                            />
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={`flex items-center gap-2 px-3 py-1 rounded font-mono text-sm ${
                                isPositive ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="font-bold">
                                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                              </span>
                              <span className="text-xs opacity-70">{TIMEFRAMES[1].label}</span>
                            </motion.div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-4 gap-4 mt-4">
                            {[
                              { label: 'OPEN', value: formatCurrency(stockData.open) },
                              { label: 'HIGH', value: formatCurrency(stockData.day_high) },
                              { label: 'LOW', value: formatCurrency(stockData.day_low) },
                              { label: 'VOL', value: formatNumber(stockData.volume) }
                            ].map((stat, i) => (
                              <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-terminal-bg border border-terminal-border rounded p-3"
                              >
                                <p className="text-xs text-terminal-dim mb-1">{stat.label}</p>
                                <p className="font-mono font-medium">{stat.value}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Chart Section - Resizes when fundamentals panel is open */}
                        <div className={`flex-1 flex flex-col min-h-0 p-4 transition-all duration-300 ${
                          showFundamentalsPanel ? 'pb-1 pt-2' : ''
                        }`}>
                          <div className={`flex items-center justify-between mb-4 flex-wrap gap-3 flex-shrink-0 ${
                            showFundamentalsPanel ? 'mb-2' : ''
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="text-terminal-green font-bold text-sm">CHART</span>
                            </div>

                            {!multiChartMode ? (
                              <div />
                            ) : (
                              <div className="flex items-center gap-2">
                                {MULTI_CHART_TIMEFRAMES.map((tf) => (
                                  <motion.button
                                    key={tf.label}
                                    onClick={() => toggleMultiTimeframe(tf.label)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                                      selectedMultiTimeframes.includes(tf.label)
                                        ? 'bg-terminal-green text-terminal-bg'
                                        : 'bg-terminal-bg border border-terminal-border hover:border-terminal-dim'
                                    }`}
                                  >
                                    {tf.label}
                                  </motion.button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Chart Container - Chart Wrapper fetches its own data */}
                          {!multiChartMode ? (
                            <ChartWrapper
                              stock={stockData}
                              showFundamentalsPanel={showFundamentalsPanel}
                            />
                          ) : (
                            /* Multi-Chart Grid View */
                            <div className={`flex-1 min-h-0 grid gap-3 transition-all duration-300 ${
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
                                    className="border border-terminal-border rounded-lg bg-terminal-panel p-3 overflow-hidden flex flex-col"
                                  >
                                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                                      <span className="text-xs font-bold text-terminal-dim font-mono">{tfLabel}</span>
                                      {stockDataTf && (
                                        <span className={`text-xs font-mono font-bold ${
                                          isPositiveTf ? 'text-terminal-green' : 'text-negative'
                                        }`}>
                                          {formatCurrency(stockDataTf.current_price)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-h-0">
                                      {chartDataTf.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <AreaChart data={chartDataTf}>
                                            <defs>
                                              <linearGradient id={`colorPriceTerminal${tfLabel}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={isPositiveTf ? '#22c55e' : '#ef4444'} stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor={isPositiveTf ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                                              </linearGradient>
                                            </defs>
                                            <XAxis dataKey="time" hide />
                                            <YAxis 
                                              domain={['auto', 'auto']}
                                              tick={{ fill: '#4b5563', fontSize: 9, fontFamily: 'monospace' }}
                                              tickFormatter={(value) => `₹${value}`}
                                              width={45}
                                            />
                                            <Tooltip
                                              contentStyle={{
                                                background: 'rgba(3, 7, 18, 0.95)',
                                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                                borderRadius: '4px',
                                                fontSize: '10px'
                                              }}
                                              formatter={(value) => [formatCurrency(value), 'PRICE']}
                                            />
                                            <Area
                                              type="monotone"
                                              dataKey="price"
                                              stroke={isPositiveTf ? '#22c55e' : '#ef4444'}
                                              strokeWidth={1.5}
                                              fill={`url(#colorPriceTerminal${tfLabel})`}
                                            />
                                          </AreaChart>
                                        </ResponsiveContainer>
                                      ) : (
                                        <div className="h-full flex items-center justify-center">
                                          <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-5 h-5 border-2 border-terminal-green border-t-transparent rounded-full"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    {stockDataTf && (
                                      <div className="mt-2 flex items-center justify-between text-xs text-terminal-dim flex-shrink-0">
                                        <span>VOL: {formatNumber(stockDataTf.volume)}</span>
                                        <span className={isPositiveTf ? 'text-terminal-green' : 'text-negative'}>
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

                        {/* Fundamentals Bottom Panel */}
                        <AnimatePresence>
                          {showFundamentalsPanel && stockData && (
                            <motion.div
                              key="fundamentals-panel"
                              initial={{ maxHeight: 0, opacity: 0 }}
                              animate={{ maxHeight: 500, opacity: 1 }}
                              exit={{ maxHeight: 0, opacity: 0 }}
                              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                              className="bg-terminal-panel border-t border-terminal-border overflow-hidden"
                            >
                              <FundamentalsPanel
                                stock={selectedStock}
                                stockData={stockData}
                                onClose={handleCloseFundamentals}
                                cachedFundamentals={fundamentalsCache[selectedStock?.id]}
                                loading={fundamentalsLoading}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-terminal-dim mb-2 font-mono text-sm">No stock selected</p>
                          <p className="text-xs text-terminal-dim/50 font-mono">Press / or Ctrl+K to search</p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </main>

                {/* Right Panel - Market Depth & Stats */}
                <motion.aside
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="hidden lg:flex flex-col bg-terminal-panel border-l border-terminal-border relative"
                  style={{ width: rightPanelWidth }}
                >
                  {/* Resize Handle */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-terminal-green transition-colors z-10"
                    onMouseDown={handleMouseDownRight}
                  />
                  
                  {/* Panel Tabs */}
                  <div className="flex border-b border-terminal-border bg-terminal-header">
                    <button 
                      onClick={() => setRightPanelTab('depth')}
                      className={`flex-1 px-4 py-3 text-xs font-bold transition-all ${
                        rightPanelTab === 'depth' 
                          ? 'text-terminal-green border-b-2 border-terminal-green bg-terminal-bg' 
                          : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg'
                      }`}
                    >
                      MARKET DEPTH
                    </button>
                    <button 
                      onClick={() => setRightPanelTab('stats')}
                      className={`flex-1 px-4 py-3 text-xs font-bold transition-all ${
                        rightPanelTab === 'stats' 
                          ? 'text-terminal-green border-b-2 border-terminal-green bg-terminal-bg' 
                          : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg'
                      }`}
                    >
                      STATS
                    </button>
                    <button 
                      onClick={() => setRightPanelTab('orders')}
                      className={`flex-1 px-4 py-3 text-xs font-bold transition-all ${
                        rightPanelTab === 'orders' 
                          ? 'text-terminal-green border-b-2 border-terminal-green bg-terminal-bg' 
                          : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg'
                      }`}
                    >
                      ORDERS
                    </button>
                  </div>
                  
                  {/* Market Depth Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {/* MARKET DEPTH Tab */}
                    {rightPanelTab === 'depth' && (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-terminal-dim font-mono">BID / ASK</span>
                          <span className="text-xs text-terminal-dim font-mono">QTY</span>
                        </div>
                        
                        <div className="space-y-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={`ask-${i}`} className="flex items-center justify-between text-xs font-mono">
                              <span className="text-negative flex items-center gap-1">
                                <span className="w-1 h-1 bg-negative rounded-full"></span>
                                {stockData ? formatCurrency(stockData.day_high - (i * 0.5)) : '--'}
                              </span>
                              <span className="text-terminal-dim">{Math.floor(Math.random() * 5000 + 1000)}</span>
                            </div>
                          ))}
                        </div>
                        
                        {stockData && (
                          <div className="py-3 border-y border-terminal-border bg-terminal-bg my-4">
                            <p className="text-center font-mono text-lg font-bold text-terminal-text">
                              {formatCurrency(stockData.current_price)}
                            </p>
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={`bid-${i}`} className="flex items-center justify-between text-xs font-mono">
                              <span className="text-terminal-green flex items-center gap-1">
                                <span className="w-1 h-1 bg-terminal-green rounded-full"></span>
                                {stockData ? formatCurrency(stockData.day_low + (i * 0.5)) : '--'}
                              </span>
                              <span className="text-terminal-dim">{Math.floor(Math.random() * 5000 + 1000)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* STATS Tab */}
                    {rightPanelTab === 'stats' && stockData && (
                      <>
                        <p className="text-xs text-terminal-dim font-mono mb-4">KEY METRICS</p>
                        
                        <div className="space-y-3 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-terminal-dim">Open:</span>
                            <span>{formatCurrency(stockData.open)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-terminal-dim">High:</span>
                            <span className="text-terminal-green">{formatCurrency(stockData.day_high)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-terminal-dim">Low:</span>
                            <span className="text-negative">{formatCurrency(stockData.day_low)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-terminal-dim">Close:</span>
                            <span>{formatCurrency(stockData.current_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-terminal-dim">Volume:</span>
                            <span>{formatNumber(stockData.volume)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <p className="text-xs text-terminal-dim font-mono mb-2">CHANGE</p>
                          <div className="h-2 bg-terminal-bg rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(Math.abs(priceChange) * 5, 100)}%` }}
                              className={`h-full ${isPositive ? 'bg-terminal-green' : 'bg-negative'}`}
                            />
                          </div>
                          <p className={`text-xs font-mono mt-2 ${isPositive ? 'text-terminal-green' : 'text-negative'}`}>
                            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                          </p>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-terminal-border">
                          <p className="text-xs text-terminal-dim font-mono mb-3">QUICK STATS</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-terminal-bg rounded p-2">
                              <p className="text-terminal-dim mb-1">52W High</p>
                              <p className="font-mono text-terminal-green">{formatCurrency(stockData.day_high * 1.3)}</p>
                            </div>
                            <div className="bg-terminal-bg rounded p-2">
                              <p className="text-terminal-dim mb-1">52W Low</p>
                              <p className="font-mono text-negative">{formatCurrency(stockData.day_low * 0.7)}</p>
                            </div>
                            <div className="bg-terminal-bg rounded p-2">
                              <p className="text-terminal-dim mb-1">Mkt Cap</p>
                              <p className="font-mono">--</p>
                            </div>
                            <div className="bg-terminal-bg rounded p-2">
                              <p className="text-terminal-dim mb-1">P/E</p>
                              <p className="font-mono">--</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* ORDERS Tab */}
                    {rightPanelTab === 'orders' && (
                      <div className="text-center py-8">
                        <p className="text-xs text-terminal-dim font-mono mb-2">ORDER BOOK</p>
                        <p className="text-sm text-terminal-text">Coming Soon</p>
                        <p className="text-xs text-terminal-dim mt-2">Real-time order flow integration</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Panel Footer */}
                  <div className="px-4 py-2 border-t border-terminal-border bg-terminal-header">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-terminal-dim font-mono">
                        <span className="text-terminal-green">$</span> workspace:{rightPanelTab}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cursorBlink ? 'bg-terminal-green' : 'bg-terminal-green/30'}`}></span>
                        <span className="text-xs text-terminal-dim font-mono">online</span>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              </div>

              {/* Mobile Watchlist Drawer */}
              <AnimatePresence>
                {isMobile && showMobileWatchlist && (view === 'dashboard' || view === 'analysis') && (
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
                      className="fixed left-0 top-0 bottom-0 w-80 bg-terminal-panel z-50 overflow-y-auto"
                    >
                      <div className="p-4 pt-14">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-medium text-terminal-dim uppercase tracking-wider">Watchlist</h2>
                          <button onClick={() => setShowMobileWatchlist(false)}>
                            <X className="w-5 h-5 text-terminal-dim" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {watchlist.map((stock) => (
                            <motion.div
                              key={stock.id}
                              onClick={() => handleStockSelect(stock)}
                              className={`p-4 rounded-xl cursor-pointer transition-all ${
                                selectedStock?.id === stock.id 
                                  ? 'bg-terminal-bg border border-terminal-green/50' 
                                  : 'hover:bg-terminal-bg border border-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded flex items-center justify-center text-sm font-semibold font-mono ${
                                    selectedStock?.id === stock.id 
                                      ? 'bg-terminal-green/20 text-terminal-green' 
                                      : 'bg-terminal-bg text-terminal-dim'
                                  }`}>
                                    {stock.symbol.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{stock.symbol}</p>
                                    <p className="text-xs text-terminal-dim">{stock.name}</p>
                                  </div>
                                </div>
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => handleAnalyzeClick(stock, e)}
                                  className="p-2 rounded-lg bg-terminal-green/20 text-terminal-green"
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

              {/* Bottom Navigation for Mobile */}
              {isMobile && (
                <motion.nav
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="fixed bottom-0 left-0 right-0 z-40 px-2 py-2 pb-safe flex items-center justify-around bg-terminal-panel border-t border-terminal-border"
                >
                  {[
                    { id: 'dashboard', icon: TrendingUp, label: 'Market' },
                    { id: 'sectors', icon: BarChart3, label: 'Sectors' },
                    { id: 'news', icon: Newspaper, label: 'News' },
                    { id: 'watchlist', icon: Eye, label: 'Watchlist' },
                    { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
                  ].map((item) => (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setView(item.id)}
                      className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px] ${
                        view === item.id 
                          ? 'text-terminal-green' 
                          : 'text-terminal-dim hover:text-terminal-text'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-[10px] font-medium font-mono">{item.label}</span>
                      {view === item.id && (
                        <motion.div
                          layoutId="activeTabTerminal"
                          className="absolute inset-0 bg-terminal-green/10 rounded-xl"
                          transition={{ type: 'spring', damping: 25 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </motion.nav>
              )}

              {/* Search Overlay */}
              <SearchOverlay 
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                onAdd={addToWatchlist}
              />

              {/* Indicator Configuration Modal */}
              <AnimatePresence>
                {showIndicatorConfig && (
                  <IndicatorConfig
                    params={indicatorParams}
                    onChange={handleIndicatorParamsChange}
                    onClose={() => setShowIndicatorConfig(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </AlertsProvider>
        </PortfolioProvider>
      </WatchlistProvider>
    </ThemeProvider>
  )
}

function App() {
  return <AppContent />
}

export default App
