import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, PieChart, BarChart3, RefreshCw, Download, ExternalLink, Info } from 'lucide-react'

// Yahoo Finance quote summary endpoint
const YAHOO_QUOTE_SUMMARY = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary'
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://justfetch.itsvg.in/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.pages.dev/?',
  'https://proxy.cors.sh/'
]

const FUNDAMENTAL_MODULES = 'summaryDetail,defaultKeyStatistics,financialData,incomeStatementHistory,balanceSheetHistory'

// Sector mapping for Indian stocks
const SECTOR_MAPPING = {
  'RELIANCE.NS': 'Energy',
  'TCS.NS': 'Technology',
  'HDFCBANK.NS': 'Financials',
  'ICICIBANK.NS': 'Financials',
  'SBIN.NS': 'Financials',
  'INFY.NS': 'Technology',
  'HINDUNILVR.NS': 'Consumer Staples',
  'ASIANPAINT.NS': 'Consumer Discretionary',
  'NESTLEIND.NS': 'Consumer Staples',
  'MARUTI.NS': 'Consumer Discretionary',
  'TATAMOTORS.NS': 'Consumer Discretionary',
  'SUNPHARMA.NS': 'Healthcare',
  'AXISBANK.NS': 'Financials',
  'KOTAKBANK.NS': 'Financials',
  'WIPRO.NS': 'Technology',
  'BHARTIARTL.NS': 'Communication',
  'BAJFINANCE.NS': 'Financials',
  'TATASTEEL.NS': 'Materials',
  'JSWSTEEL.NS': 'Materials',
  'MOTHERSUMI.NS': 'Consumer Discretionary',
  'BAJAJ-AUTO.NS': 'Consumer Discretionary',
  'EICHERMOT.NS': 'Consumer Discretionary',
  'DABUR.NS': 'Consumer Staples',
  'BRITANNIA.NS': 'Consumer Staples',
  'COALINDIA.NS': 'Energy',
  'VEDL.NS': 'Materials',
  'ONGC.NS': 'Energy',
  'IOC.NS': 'Energy',
  'NTPC.NS': 'Utilities',
  'POWERGRID.NS': 'Utilities',
  'CIPLA.NS': 'Healthcare',
  'DRREDDY.NS': 'Healthcare',
  'ZYDUSLIFE.NS': 'Healthcare',
  'DLF.NS': 'Real Estate',
  'GODREJPROP.NS': 'Real Estate',
  'SOBHA.NS': 'Real Estate',
  'PRESTIGE.NS': 'Real Estate',
  'LODHA.NS': 'Real Estate',
  'APOLLOHOSP.NS': 'Healthcare',
  'FORTIS.NS': 'Healthcare',
  'MAXHEALTH.NS': 'Healthcare',
  'METROPOLIS.NS': 'Healthcare',
  'ZEE.NS': 'Communication',
  'PVR.NS': 'Communication',
  'INOXLEISUR.NS': 'Communication',
  'DISHTV.NS': 'Communication',
  'SUNTV.NS': 'Communication',
  'ITC.NS': 'Consumer Staples',
  'GODREJCP.NS': 'Consumer Staples',
  'HCLTECH.NS': 'Technology',
  'TECHM.NS': 'Technology'
}

function FundamentalsPanel({ stock, stockData, onClose, onAddToComparison }) {
  const [fundamentals, setFundamentals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('valuation')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dataSource, setDataSource] = useState('yahoo')

  // Fetch fundamentals
  useEffect(() => {
    if (stock) {
      fetchFundamentals(stock.id)
    }
  }, [stock])

  const fetchFundamentals = async (symbol) => {
    setLoading(true)
    setDataSource('yahoo')
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
      const data = await tryFetchWithProxy()
      if (data.quoteSummary?.result?.[0]) {
        setFundamentals(data.quoteSummary.result[0])
        setLastUpdated(new Date())
        setDataSource('Yahoo Finance')
      } else {
        // Use mock data if API fails
        setFundamentals(getMockFundamentals(symbol))
        setDataSource('Demo Data')
      }
    } catch (error) {
      console.error('Error fetching fundamentals:', error)
      setFundamentals(getMockFundamentals(symbol))
      setDataSource('Demo Data (API unavailable)')
    } finally {
      setLoading(false)
    }
  }

  const getMetric = (path, formatter = null) => {
    if (!fundamentals) return null
    const keys = path.split('.')
    let value = fundamentals
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined || value === null) return null
    }
    
    const raw = value?.raw !== undefined ? value.raw : value
    if (raw === undefined || raw === null) return null
    
    if (formatter === 'currency') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(raw)
    }
    if (formatter === 'number') {
      return new Intl.NumberFormat('en-IN').format(raw)
    }
    if (formatter === 'percent') {
      return `${raw.toFixed(2)}%`
    }
    if (formatter === 'ratio') {
      return raw.toFixed(2)
    }
    return raw
  }

  const formatCurrency = (value) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatNumber = (value) => {
    if (!value) return 'N/A'
    if (value >= 1e15) return `${(value / 1e15).toFixed(2)}Q`
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toLocaleString('en-US')
  }

  const getSector = () => {
    return SECTOR_MAPPING[stock?.id] || 'Other'
  }

  const tabs = [
    { id: 'valuation', label: 'Valuation', icon: PieChart },
    { id: 'financials', label: 'Financials', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ]

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="h-full flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
            <div>
              <h2 className="text-xl font-semibold">Fundamentals</h2>
              <p className="text-terminal-dim text-sm">Loading...</p>
            </div>
          </div>
        </div>
        <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4 flex-1">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-terminal-bg-light rounded" />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 bg-terminal-bg flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-xl font-semibold">{stock?.name}</h2>
            <div className="flex items-center gap-2 text-xs text-terminal-dim">
              <span>{stock?.symbol}</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-terminal-bg-light rounded-full">{getSector()}</span>
              <span>•</span>
              <span>NSE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchFundamentals(stock?.id)}
            className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
          {onAddToComparison && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddToComparison}
              className="px-3 py-1.5 bg-terminal-green/10 text-terminal-green rounded-lg flex items-center gap-1.5 text-sm"
            >
              <PieChart className="w-4 h-4" />
              Compare
            </motion.button>
          )}
        </div>
      </div>

      {/* Data Source & Last Updated */}
      <div className="flex items-center justify-between text-xs text-terminal-dim mb-3">
        <span>Data Source: {dataSource}</span>
        {lastUpdated && <span>Last Updated: {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      {/* Current Price Card */}
      {stockData && (
        <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-terminal-dim">Current Price</p>
            <p className="text-xl font-bold">{formatCurrency(stockData.current_price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-terminal-dim">Day Change</p>
            <p className={`text-lg font-semibold ${
              (stockData.current_price - stockData.previous_close) >= 0 ? 'text-terminal-green' : 'text-terminal-red'
            }`}>
              {((stockData.current_price - stockData.previous_close) / stockData.previous_close * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-sm ${
              activeTab === tab.id
                ? 'bg-terminal-green text-terminal-bg'
                : 'bg-terminal-bg-secondary border border-terminal-border hover:bg-terminal-bg-light'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab Content */}
        <AnimatePresence mode="wait">
        {activeTab === 'valuation' && (
          <motion.div
            key="valuation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4"
          >
            <h3 className="text-base font-semibold mb-3">Valuation Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard
                label="P/E Ratio"
                value={getMetric('defaultKeyStatistics.trailingPE.raw', 'ratio')}
                tooltip="Price to Earnings Ratio - Lower may indicate undervaluation"
              />
              <MetricCard
                label="Forward P/E"
                value={getMetric('defaultKeyStatistics.forwardPE.raw', 'ratio')}
                tooltip="Forward P/E based on estimated earnings"
              />
              <MetricCard
                label="P/B Ratio"
                value={getMetric('defaultKeyServices.priceToBookRaw.raw', 'ratio')}
                tooltip="Price to Book Ratio"
              />
              <MetricCard
                label="P/S Ratio"
                value={getMetric('defaultKeyStatistics.priceToSalesTrailing12Months.raw', 'ratio')}
                tooltip="Price to Sales Ratio"
              />
              <MetricCard
                label="EPS (TTM)"
                value={getMetric('defaultKeyStatistics.trailingEps.raw', 'currency')}
                tooltip="Earnings Per Share - Trailing Twelve Months"
              />
              <MetricCard
                label="Dividend Yield"
                value={getMetric('summaryDetail.dividendYieldRaw', 'percent')}
                tooltip="Annual dividend as percentage of stock price"
              />
              <MetricCard
                label="Beta"
                value={getMetric('defaultKeyStatistics.beta.raw', 'ratio')}
                tooltip="Measure of volatility relative to market"
              />
              <MetricCard
                label="Market Cap"
                value={getMetric('summaryDetail.marketCap.raw', 'number')}
                tooltip="Total market value"
                isLarge
              />
              <MetricCard
                label="Enterprise Value"
                value={getMetric('defaultKeyStatistics.enterpriseValue.raw', 'number')}
                tooltip="Total company value including debt"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'financials' && (
          <motion.div
            key="financials"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4"
          >
            <h3 className="text-base font-semibold mb-3">Financial Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard
                label="Revenue (TTM)"
                value={getMetric('financialData.totalRevenue.raw', 'number')}
                tooltip="Total revenue over trailing twelve months"
              />
              <MetricCard
                label="Net Income (TTM)"
                value={getMetric('financialData.netIncomeToCommon.raw', 'number')}
                tooltip="Net profit available to common shareholders"
              />
              <MetricCard
                label="Gross Margin"
                value={getMetric('financialData.grossMargins.raw', 'percent')}
                tooltip="Revenue minus cost of goods sold as percentage"
              />
              <MetricCard
                label="Operating Margin"
                value={getMetric('financialData.operatingMargins.raw', 'percent')}
                tooltip="Operating income as percentage of revenue"
              />
              <MetricCard
                label="Profit Margin"
                value={getMetric('financialData.profitMargins.raw', 'percent')}
                tooltip="Net profit as percentage of revenue"
              />
              <MetricCard
                label="ROE"
                value={getMetric('financialData.returnOnEquity.raw', 'percent')}
                tooltip="Return on Equity - How efficiently equity is used"
              />
              <MetricCard
                label="ROA"
                value={getMetric('financialData.returnOnAssets.raw', 'percent')}
                tooltip="Return on Assets"
              />
              <MetricCard
                label="Debt/Equity"
                value={getMetric('financialData.debtToEquity.raw', 'ratio')}
                tooltip="Total debt divided by shareholder equity"
              />
              <MetricCard
                label="Current Ratio"
                value={getMetric('financialData.currentRatio.raw', 'ratio')}
                tooltip="Current assets divided by current liabilities"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4"
          >
            <h3 className="text-base font-semibold mb-3">Price Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard
                label="52 Week High"
                value={getMetric('summaryDetail.fiftyTwoWeekHighRaw', 'currency')}
              />
              <MetricCard
                label="52 Week Low"
                value={getMetric('summaryDetail.fiftyTwoWeekLowRaw', 'currency')}
              />
              <MetricCard
                label="50 Day MA"
                value={getMetric('summaryDetail.fiftyDayAverage.raw', 'currency')}
                tooltip="Average closing price over last 50 days"
              />
              <MetricCard
                label="200 Day MA"
                value={getMetric('summaryDetail.twoHundredDayAverage.raw', 'currency')}
                tooltip="Average closing price over last 200 days"
              />
              <MetricCard
                label="52 Week Change"
                value={getMetric('defaultKeyStatistics.fiftyTwoWeekChange.raw', 'percent')}
              />
              <MetricCard
                label="Volume (Avg)"
                value={getMetric('summaryDetail.averageVolume.raw', 'number')}
              />
              <MetricCard
                label="Shares Outstanding"
                value={getMetric('summaryDetail.sharesOutstanding.raw', 'number')}
                tooltip="Total number of shares held by all shareholders"
              />
              <MetricCard
                label="Float Shares"
                value={getMetric('defaultKeyStatistics.floatShares.raw', 'number')}
                tooltip="Shares available for public trading"
              />
              <MetricCard
                label="Insider Ownership"
                value={getMetric('defaultKeyStatistics.insiderHoldings.raw', 'percent')}
                tooltip="Percentage owned by company insiders"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Disclaimer */}
      <div className="mt-3 p-3 bg-terminal-bg-secondary border border-terminal-border rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-terminal-dim flex-shrink-0 mt-0.5" />
        <p className="text-xs text-terminal-dim">
          <strong className="text-terminal-text">Disclaimer:</strong> Fundamental data is provided for informational purposes only and should not be considered as financial advice. 
          Always conduct your own research and consider consulting a financial advisor before making investment decisions.
          {dataSource.includes('Demo') && ' Some data shown is demo data as the live API is currently unavailable.'}
        </p>
      </div>
    </motion.div>
  )
}

function MetricCard({ label, value, tooltip, isLarge = false }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div 
      className={`bg-terminal-bg-secondary border border-terminal-border rounded-lg p-3 relative ${isLarge ? 'col-span-2' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <p className="text-xs text-terminal-dim mb-1 flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="cursor-help">
            <Info className="w-3 h-3" />
          </span>
        )}
      </p>
      <p className={`font-mono font-medium ${isLarge ? 'text-lg' : 'text-base'}`}>
        {value || 'N/A'}
      </p>
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-terminal-bg-light border border-terminal-border rounded-lg p-2 text-xs text-terminal-dim z-10">
          {tooltip}
        </div>
      )}
    </div>
  )
}

// Mock data for when API is unavailable
function getMockFundamentals(symbol) {
  const mockData = {
    'RELIANCE.NS': {
      summaryDetail: {
        marketCap: { raw: 16000000000000 },
        fiftyTwoWeekHighRaw: { raw: 3200 },
        fiftyTwoWeekLowRaw: { raw: 2400 },
        dividendYieldRaw: { raw: 0.0035 },
        averageVolume: { raw: 5000000 },
        volume: { raw: 6000000 },
        sharesOutstanding: { raw: 6800000000 },
        twoHundredDayAverage: { raw: 2800 },
        fiftyDayAverage: { raw: 2950 }
      },
      defaultKeyStatistics: {
        trailingPE: { raw: 28.5 },
        forwardPE: { raw: 22.3 },
        priceToBookRaw: { raw: 3.2 },
        priceToSalesTrailing12Months: { raw: 2.1 },
        trailingEps: { raw: 98.5 },
        beta: { raw: 0.85 },
        fiftyTwoWeekChange: { raw: 0.15 },
        floatShares: { raw: 5000000000 },
        insiderHoldings: { raw: 0.45 }
      },
      financialData: {
        totalRevenue: { raw: 800000000000 },
        netIncomeToCommon: { raw: 95000000000 },
        grossMargins: { raw: 0.52 },
        operatingMargins: { raw: 0.18 },
        profitMargins: { raw: 0.12 },
        returnOnEquity: { raw: 0.13 },
        returnOnAssets: { raw: 0.08 },
        debtToEquity: { raw: 0.4 },
        currentRatio: { raw: 1.2 },
        currentPrice: { raw: 2850 }
      }
    }
  }
  
  // Return stock-specific mock data or generic fallback
  return mockData[symbol] || mockData['RELIANCE.NS']
}

export default FundamentalsPanel
