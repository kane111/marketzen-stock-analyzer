import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { Spinner } from '../common/LoadingSkeleton'

// Timeframe constants - matches Yahoo Finance API
export const TIMEFRAMES = [
  { label: '1D', value: '1D', range: '1d', interval: '5m' },
  { label: '1W', value: '1W', range: '5d', interval: '15m' },
  { label: '1M', value: '1M', range: '1mo', interval: '1h' },
  { label: '3M', value: '3M', range: '3mo', interval: '1d' },
  { label: '6M', value: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', value: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', value: '5Y', range: '5y', interval: '1wk' }
]

const MONTH_ABBREVIATIONS = {
  'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
  'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
  'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
}

// Yahoo Finance API configuration
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://justfetch.itsvg.in/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.pages.dev/?',
  'https://proxy.cors.sh/'
]

// Format currency for display
function formatCurrency(value) {
  if (!value && value !== 0) return 'N/A'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value)
}

// Format date label for x-axis
function formatDateLabel(date) {
  const day = date.getDate().toString().padStart(2, '0')
  const month = MONTH_ABBREVIATIONS[date.toLocaleString('en-US', { month: 'long' })]
  const year = date.getFullYear().toString().slice(-2)
  return `${day} ${month} '${year}`
}

// Format time label for intraday data
function formatTimeLabel(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Timeframe Selector Component
function TimeframeSelector({ timeframes, selected, onSelect }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
      {timeframes.map((tf) => (
        <motion.button
          key={tf.label}
          onClick={() => onSelect(tf)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            selected.label === tf.label
              ? 'bg-terminal-green text-terminal-bg shadow-lg'
              : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg-light'
          }`}
        >
          {tf.label}
        </motion.button>
      ))}
    </div>
  )
}

// Memoized Chart Component
const StockChartInner = memo(function StockChartInner({ data, isPositive, showFundamentalsPanel }) {
  return (
    <div className={`
      flex-1 min-h-0 
      border border-terminal-border 
      rounded-lg bg-terminal-panel 
      transition-all duration-300
      ${showFundamentalsPanel ? 'p-2' : 'p-4'}
    `}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPriceTerminal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}
            interval="equidistantPreserveStartEnd"
            minTickGap={50}
            tickMargin={8}
          />
          <YAxis
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(3, 7, 18, 0.95)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '4px',
              backdropFilter: 'blur(12px)',
              fontFamily: 'monospace'
            }}
            labelStyle={{ color: '#6b7280', fontFamily: 'monospace' }}
            formatter={(value) => [formatCurrency(value), 'PRICE']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            fill="url(#colorPriceTerminal)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

// Main Chart Wrapper Component - Fetches its own data based on timeframe
function ChartWrapper({ stock, showFundamentalsPanel }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[3]) // Default to 3M
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch chart data from Yahoo Finance based on selected timeframe
  const fetchChartData = useCallback(async (stockId, timeframe) => {
    if (!stockId) return

    setLoading(true)
    setError(null)

    try {
      const url = `${YAHOO_BASE}/${stockId}?range=${timeframe.range}&interval=${timeframe.interval}`

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

        const transformed = timestamps.map((ts, i) => {
          const price = prices[i]
          if (price === null || price === undefined) return null

          const date = new Date(ts * 1000)

          // Format label based on timeframe
          let timeLabel
          if (timeframe.value === '1D' || timeframe.value === '1W') {
            timeLabel = formatTimeLabel(date)
          } else {
            timeLabel = formatDateLabel(date)
          }

          return {
            time: timeLabel,
            price: price,
            timestamp: ts
          }
        }).filter(Boolean)

        setChartData(transformed)
      } else {
        throw new Error('No data available')
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
      setError('Unable to fetch chart data')
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch data when timeframe or stock changes
  useEffect(() => {
    if (stock?.id) {
      fetchChartData(stock.id, selectedTimeframe)
    }
  }, [stock?.id, selectedTimeframe, fetchChartData])

  // Calculate if price is positive
  const isPositive = stock && stock.current_price >= stock.previous_close

  return (
    <div className={`
      flex-1 flex flex-col min-h-0 
      transition-all duration-300
      ${showFundamentalsPanel ? 'pb-1 pt-2' : 'p-4'}
    `}>
      {/* Header */}
      <div className={`
        flex items-center justify-between mb-4 flex-wrap gap-3 flex-shrink-0
        ${showFundamentalsPanel ? 'mb-2' : ''}
      `}>
        <div className="flex items-center gap-2">
          <span className="text-terminal-green font-bold text-sm">CHART</span>
        </div>

        <TimeframeSelector
          timeframes={TIMEFRAMES}
          selected={selectedTimeframe}
          onSelect={setSelectedTimeframe}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex-1 flex items-center justify-center border border-terminal-border rounded-lg bg-terminal-panel">
          <div className="text-center">
            <p className="text-negative mb-2 font-mono text-sm">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchChartData(stock?.id, selectedTimeframe)}
              className="px-3 py-1 rounded border border-terminal-border text-terminal-dim hover:text-terminal-text text-sm"
            >
              Retry
            </motion.button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex-1 flex items-center justify-center border border-terminal-border rounded-lg bg-terminal-panel">
          <Spinner size="3rem" />
        </div>
      )}

      {/* Chart */}
      {!loading && !error && (
        <StockChartInner
          data={chartData}
          isPositive={isPositive}
          showFundamentalsPanel={showFundamentalsPanel}
        />
      )}
    </div>
  )
}

// Export memoized version with custom comparison
export default memo(ChartWrapper, (prevProps, nextProps) => {
  // Re-render if stock.id changes (but not when showFundamentalsPanel changes)
  return prevProps.stock?.id === nextProps.stock?.id
})
