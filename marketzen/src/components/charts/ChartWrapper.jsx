import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

// Timeframe constants
export const TIMEFRAMES = [
  { label: '1D', value: '1D', days: 1 },
  { label: '1W', value: '1W', days: 7 },
  { label: '1M', value: '1M', days: 30 },
  { label: '3M', value: '3M', days: 90 },
  { label: '6M', value: '6M', days: 180 },
  { label: '1Y', value: '1Y', days: 365 },
  { label: '5Y', value: '5Y', days: 1825 },
  { label: 'ALL', value: 'ALL', days: null }
]

const TIMEFRAME_PRESETS = {
  '1D': 'day',
  '1W': 'day',
  '1M': 'day',
  '3M': 'week',
  '6M': 'week',
  '1Y': 'month',
  '5Y': 'month',
  'ALL': 'month'
}

const MONTH_ABBREVIATIONS = {
  'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
  'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
  'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
}

// Format date with consistent 3-letter month abbreviations
function formatDateLabel(date, includeYear = false) {
  const day = date.getDate().toString().padStart(2, '0')
  const month = MONTH_ABBREVIATIONS[date.toLocaleString('en-US', { month: 'long' })]
  
  if (includeYear) {
    const year = date.getFullYear().toString().slice(-2)
    return `${day} ${month} '${year}`
  }
  return `${day} ${month}`
}

// Format currency for display
function formatCurrency(value) {
  if (!value && value !== 0) return 'N/A'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value)
}

// Generate mock chart data
function generateChartData(stock, timeframe) {
  if (!stock || !stock.current_price) return []

  const days = timeframe.days || 365
  const data = []
  const preset = TIMEFRAME_PRESETS[timeframe.value] || 'day'

  let currentPrice = stock.current_price
  const volatility = 0.02
  const trend = 0.0005

  // Generate enough data points based on timeframe
  // Using trading days approximation (~252 trading days per year)
  const pointsNeeded = days <= 1 ? 78 
    : days <= 7 ? 28 
    : days <= 30 ? 30 
    : days <= 90 ? 65 
    : days <= 180 ? 126 
    : days <= 365 ? 252 
    : days <= 730 ? 504 
    : days <= 1095 ? 756 
    : days <= 1825 ? 1260 
    : 2000

  for (let i = pointsNeeded; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    // Add some randomness for price movement
    const randomChange = (Math.random() - 0.5) * 2 * volatility
    const trendChange = trend * i
    currentPrice = currentPrice * (1 - trendChange) * (1 + randomChange)

    let timeLabel
    if (preset === 'day') {
      timeLabel = formatDateLabel(date, false)
    } else if (preset === 'week') {
      timeLabel = formatDateLabel(date, false)
    } else {
      timeLabel = formatDateLabel(date, true)
    }

    data.push({
      time: timeLabel,
      price: Math.round(currentPrice * 100) / 100
    })
  }

  return data
}

// Timeframe Selector Component with improved UX
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

// Memoized Chart Component with improved UX
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

// Main Chart Wrapper Component - Completely Isolated with improved UX
function ChartWrapper({ stock, showFundamentalsPanel }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[1])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  // Track previous stock to avoid unnecessary re-fetches
  const prevStockRef = useRef(null)

  // Fetch chart data when timeframe or stock changes
  useEffect(() => {
    if (!stock || stock.id === prevStockRef.current?.id) {
      // Just update the chart data without full loading state
      const data = generateChartData(stock, selectedTimeframe)
      setChartData(data)
      setLoading(false)
      return
    }

    prevStockRef.current = stock
    setLoading(true)

    // Simulate data fetch
    const timer = setTimeout(() => {
      const data = generateChartData(stock, selectedTimeframe)
      setChartData(data)
      setLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [stock, selectedTimeframe])

  // Calculate if price is positive
  const isPositive = stock && stock.current_price >= stock.previous_close

  return (
    <div className={`
      flex-1 flex flex-col min-h-0 
      transition-all duration-300
      ${showFundamentalsPanel ? 'pb-1 pt-2' : 'p-4'}
    `}>
      {/* Header with improved spacing */}
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

      {/* Chart or Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center border border-terminal-border rounded-lg bg-terminal-panel">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-terminal-green border-t-transparent rounded-full"
          />
        </div>
      ) : (
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
  // Only re-render if stock.id changes
  return prevProps.stock?.id === nextProps.stock?.id
})
