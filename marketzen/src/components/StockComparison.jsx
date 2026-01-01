import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Plus, Minus, Save, Download, BarChart2, LineChart, PieChart, ArrowRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, ReferenceLine } from 'recharts'
import { useAlerts } from '../context/AlertsContext'
import { TimeframeSelector, COMPARE_TIMEFRAMES } from './charts/TimeframeSelector'
import { Spinner } from './common/LoadingSkeleton'

// Yahoo Finance API endpoints
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const YAHOO_QUOTE = 'https://query1.finance.yahoo.com/v7/finance/quote'
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://justfetch.itsvg.in/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.pages.dev/?',
  'https://proxy.cors.sh/'
]

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function StockComparison({ onClose, watchlist = [] }) {
  const [comparisonStocks, setComparisonStocks] = useState([])
  const [comparisonData, setComparisonData] = useState({})
  const [selectedTimeframe, setSelectedTimeframe] = useState(COMPARE_TIMEFRAMES[1])
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState({})
  const [savedComparisons, setSavedComparisons] = useState(() => {
    const saved = localStorage.getItem('marketzen_comparisons')
    return saved ? JSON.parse(saved) : []
  })
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [comparisonName, setComparisonName] = useState('')

  // Load comparison data when stocks change
  useEffect(() => {
    if (comparisonStocks.length > 0) {
      fetchComparisonData()
    }
  }, [comparisonStocks, selectedTimeframe])

  const fetchComparisonData = async () => {
    setLoading(true)
    const newData = {}
    const newMetrics = {}

    for (const stock of comparisonStocks) {
      try {
        const url = `${YAHOO_BASE}/${stock.id}?range=${selectedTimeframe.range}&interval=${selectedTimeframe.interval}`
        
        const tryFetchWithProxy = async (proxyIndex = 0) => {
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
            return tryFetchWithProxy(proxyIndex + 1)
          }
        }

        const data = await tryFetchWithProxy()
        
        if (data.chart?.result?.[0]) {
          const result = data.chart.result[0]
          const quote = result.indicators?.quote?.[0] || {}
          const timestamps = result.timestamp || []
          const prices = quote.close || []
          const firstPrice = prices.find(p => p !== null && p !== undefined)
          
          // Transform for chart - normalize to percentage change
          const transformed = timestamps.map((ts, i) => {
            const price = prices[i]
            if (price === null || price === undefined) return null
            const pctChange = firstPrice ? ((price - firstPrice) / firstPrice) * 100 : 0
            return {
              timestamp: new Date(ts * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
              [stock.symbol]: pctChange
            }
          }).filter(Boolean)

          newData[stock.symbol] = transformed

          // Get current metrics
          const currentPrice = prices[prices.length - 1]
          const previousClose = result.meta?.previous_close || prices[0]
          newMetrics[stock.symbol] = {
            currentPrice,
            change: previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0,
            firstPrice,
            high: Math.max(...prices.filter(p => p !== null)),
            low: Math.min(...prices.filter(p => p !== null))
          }
        }
      } catch (error) {
        console.error(`Error fetching ${stock.symbol}:`, error)
      }
    }

    setComparisonData(newData)
    setMetrics(newMetrics)
    setLoading(false)
  }

  const addStock = useCallback((stock) => {
    if (comparisonStocks.length >= 4) {
      alert('Maximum 4 stocks can be compared at once')
      return
    }
    if (comparisonStocks.find(s => s.id === stock.id)) {
      alert('Stock already in comparison')
      return
    }
    setComparisonStocks(prev => [...prev, stock])
  }, [comparisonStocks])

  const removeStock = useCallback((stockId) => {
    setComparisonStocks(prev => prev.filter(s => s.id !== stockId))
    setComparisonData(prev => {
      const newData = { ...prev }
      const symbol = comparisonStocks.find(s => s.id === stockId)?.symbol
      if (symbol) delete newData[symbol]
      return newData
    })
  }, [comparisonStocks])

  // Combine data for chart
  const chartData = useCallback(() => {
    if (Object.keys(comparisonData).length === 0) return []
    
    // Find the stock with most data points
    const maxLength = Math.max(...Object.values(comparisonData).map(d => d.length))
    const combined = []
    
    for (let i = 0; i < maxLength; i++) {
      const point = {}
      for (const symbol of Object.keys(comparisonData)) {
        const stockData = comparisonData[symbol][i]
        if (stockData) {
          point.timestamp = stockData.timestamp
          point[symbol] = stockData[symbol]
        }
      }
      if (Object.keys(point).length > 1) {
        combined.push(point)
      }
    }
    
    return combined
  }, [comparisonData])

  const formatCurrency = (value) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value)
  }

  const handleSaveComparison = () => {
    if (!comparisonName.trim()) return
    
    const saved = {
      id: Date.now().toString(),
      name: comparisonName,
      stocks: comparisonStocks,
      timeframe: selectedTimeframe,
      createdAt: new Date().toISOString()
    }
    
    const newSaved = [...savedComparisons, saved]
    setSavedComparisons(newSaved)
    localStorage.setItem('marketzen_comparisons', JSON.stringify(newSaved))
    setShowSaveModal(false)
    setComparisonName('')
  }

  const loadSavedComparison = (saved) => {
    setComparisonStocks(saved.stocks)
    setSelectedTimeframe(saved.timeframe || COMPARE_TIMEFRAMES[1])
  }

  const exportComparison = () => {
    const exportData = {
      name: comparisonName || 'Stock Comparison',
      timeframe: selectedTimeframe,
      stocks: comparisonStocks,
      data: chartData(),
      metrics,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marketzen-comparison-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg bg-surfaceLight hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-2xl font-semibold">Stock Comparison</h2>
            <p className="text-textSecondary text-sm">Compare multiple stocks side by side</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {comparisonStocks.length > 0 && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-surfaceLight text-textSecondary rounded-lg flex items-center gap-2 hover:bg-surface"
              >
                <Save className="w-4 h-4" />
                Save
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportComparison}
                className="px-4 py-2 bg-surfaceLight text-textSecondary rounded-lg flex items-center gap-2 hover:bg-surface"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-6">
        <TimeframeSelector
          timeframes={COMPARE_TIMEFRAMES}
          selected={selectedTimeframe}
          onSelect={setSelectedTimeframe}
          variant="comparison"
        />
      </div>

      {/* Stock Selection */}
      <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            Stocks to Compare ({comparisonStocks.length}/4)
          </h3>
          <div className="flex gap-2">
            {savedComparisons.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    loadSavedComparison(JSON.parse(e.target.value))
                    e.target.value = ''
                  }
                }}
                className="px-3 py-1.5 bg-surfaceLight rounded-lg text-sm outline-none"
              >
                <option value="">Load Saved...</option>
                {savedComparisons.map(s => (
                  <option key={s.id} value={JSON.stringify(s)}>{s.name}</option>
                ))}
              </select>
            )}
            <StockSearchButton onSelect={addStock} existingStocks={comparisonStocks} watchlist={watchlist} />
          </div>
        </div>

        {comparisonStocks.length === 0 ? (
          <div className="text-center py-8">
            <BarChart2 className="w-12 h-12 text-textSecondary mx-auto mb-4 opacity-50" />
            <p className="text-textSecondary mb-4">Add stocks to compare their performance</p>
            <StockSearchButton onSelect={addStock} existingStocks={comparisonStocks} watchlist={watchlist} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {comparisonStocks.map((stock, index) => {
              const m = metrics[stock.symbol] || {}
              const isPositive = (m.change || 0) >= 0

              return (
                <motion.div
                  key={stock.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4 relative"
                  style={{ borderLeft: `3px solid ${COLORS[index % COLORS.length]}` }}
                >
                  <button
                    onClick={() => removeStock(stock.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-surface rounded"
                  >
                    <X className="w-4 h-4 text-textSecondary" />
                  </button>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }}
                    >
                      {stock.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{stock.symbol}</p>
                      <p className="text-xs text-textSecondary truncate max-w-[100px]">{stock.name}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-textSecondary">Current</p>
                      <p className="font-semibold">{formatCurrency(m.currentPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-textSecondary">{selectedTimeframe.label} Change</p>
                      <p className={`font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
                        {isPositive ? '+' : ''}{(m.firstPrice ? ((m.currentPrice - m.firstPrice) / m.firstPrice * 100) : 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Comparison Chart */}
      {comparisonStocks.length > 0 && (
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Performance Comparison (%)</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <Spinner size="2rem" color="terminal-green" />
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData()}>
                  <defs>
                    {comparisonStocks.map((stock, index) => (
                      <linearGradient key={stock.symbol} id={`gradient-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(21, 26, 33, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value.toFixed(2)}%`, '']}
                  />
                  <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                  {comparisonStocks.map((stock, index) => (
                    <Area
                      key={stock.symbol}
                      type="monotone"
                      dataKey={stock.symbol}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      fill={`url(#gradient-${stock.symbol})`}
                      dot={false}
                      name={stock.symbol}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
            {comparisonStocks.map((stock, index) => (
              <div key={stock.symbol} className="flex items-center gap-2">
                <div className="w-6 h-0.5" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm">{stock.symbol}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Comparison Table */}
      {comparisonStocks.length > 1 && (
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-medium text-textSecondary uppercase tracking-wider">Metrics Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surfaceLight/50">
                  <th className="p-4 text-left text-sm font-medium text-textSecondary">Metric</th>
                  {comparisonStocks.map((stock, index) => (
                    <th key={stock.id} className="p-4 text-center text-sm font-medium" style={{ color: COLORS[index % COLORS.length] }}>
                      {stock.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 text-sm text-textSecondary">Current Price</td>
                  {comparisonStocks.map(stock => (
                    <td key={stock.id} className="p-4 text-center font-mono">
                      {formatCurrency(metrics[stock.symbol]?.currentPrice)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-textSecondary">{selectedTimeframe.label} Return</td>
                  {comparisonStocks.map((stock, index) => {
                    const m = metrics[stock.symbol]
                    const returnValue = m?.firstPrice ? ((m.currentPrice - m.firstPrice) / m.firstPrice * 100) : 0
                    return (
                      <td key={stock.id} className="p-4 text-center">
                        <span className={`font-mono font-medium ${returnValue >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {returnValue >= 0 ? '+' : ''}{returnValue.toFixed(2)}%
                        </span>
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-textSecondary">Period High</td>
                  {comparisonStocks.map(stock => (
                    <td key={stock.id} className="p-4 text-center font-mono">
                      {formatCurrency(metrics[stock.symbol]?.high)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-sm text-textSecondary">Period Low</td>
                  {comparisonStocks.map(stock => (
                    <td key={stock.id} className="p-4 text-center font-mono">
                      {formatCurrency(metrics[stock.symbol]?.low)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">Save Comparison</h3>
              <input
                type="text"
                value={comparisonName}
                onChange={(e) => setComparisonName(e.target.value)}
                placeholder="Enter comparison name..."
                className="w-full bg-surfaceLight rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 bg-surfaceLight text-textSecondary rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveComparison}
                  disabled={!comparisonName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StockSearchButton({ onSelect, existingStocks, watchlist }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const availableStocks = watchlist.filter(s => 
    !existingStocks.find(es => es.id === s.id) &&
    (s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
     s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Stock
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full mt-2 w-72 bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl overflow-hidden z-50"
            >
              <div className="p-3 border-b border-white/5">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search stocks..."
                  className="w-full bg-surfaceLight rounded-lg px-3 py-2 outline-none text-sm"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableStocks.length === 0 ? (
                  <div className="p-4 text-center text-textSecondary text-sm">
                    {searchTerm ? 'No matching stocks' : 'Add stocks to watchlist first'}
                  </div>
                ) : (
                  availableStocks.map((stock) => (
                    <button
                      key={stock.id}
                      onClick={() => {
                        onSelect(stock)
                        setShowDropdown(false)
                        setSearchTerm('')
                      }}
                      className="w-full p-3 flex items-center gap-3 hover:bg-surfaceLight transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{stock.symbol.substring(0, 2)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{stock.symbol}</p>
                        <p className="text-xs text-textSecondary truncate">{stock.name}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StockComparison
