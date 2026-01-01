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
  { label: 'ALL', value: 'ALL', days: 3650 }
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

// Format month-year for longer timeframes
function formatMonthYearLabel(date) {
  const month = MONTH_ABBREVIATIONS[date.toLocaleString('en-US', { month: 'long' })]
  const year = date.getFullYear().toString().slice(-2)
  return `${month} '${year}`
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

// Generate mock chart data with proper historical dates
function generateChartData(stock, timeframe) {
  if (!stock || !stock.current_price) return []

  const days = timeframe.days || 365
  const preset = TIMEFRAME_PRESETS[timeframe.value] || 'day'
  
  const data = []
  const today = new Date()
  
  // Use the actual current price to ensure consistency with display
  const actualCurrentPrice = stock.current_price
  const volatility = 0.02
  const trend = 0.0003 // Slight upward trend

  // Calculate number of data points based on timeframe
  let pointsNeeded
  if (days <= 1) {
    pointsNeeded = 78 // 15-min intervals for intraday
  } else if (days <= 7) {
    pointsNeeded = days === 1 ? 78 : days * 4 // 4 data points per day
  } else if (days <= 30) {
    pointsNeeded = days // 1 data point per day
  } else if (days <= 90) {
    pointsNeeded = Math.ceil(days / 3) // 1 data point per 3 days (weekly)
  } else if (days <= 365) {
    pointsNeeded = Math.ceil(days / 7) // 1 data point per week
  } else if (days <= 1825) {
    pointsNeeded = Math.ceil(days / 30) // 1 data point per month
  } else {
    pointsNeeded = 120 // For ALL timeframe
  }

  // Ensure minimum data points for visualization
  pointsNeeded = Math.max(pointsNeeded, 30)

  // Calculate starting price based on trend so that the last point ends at actualCurrentPrice
  // If we have pointsNeeded data points and the price trend goes upward,
  // we need to work backwards from current price
  const totalTrend = trend * (pointsNeeded - 1)
  
  // Start from a price that, after applying trend, will reach actualCurrentPrice
  let currentPrice = actualCurrentPrice / (1 + totalTrend)
  
  // Add some volatility spread to make it look realistic
  const volatilityFactor = 0.5 // Reduce volatility for more realistic looking chart

  // First pass: collect all dates to determine if we span multiple years
  const dateRange = {
    startYear: null,
    endYear: null
  }

  for (let i = pointsNeeded - 1; i >= 0; i--) {
    const date = new Date(today)
    
    // Calculate date going backwards
    if (days <= 1) {
      // Intraday - go back by hours
      date.setHours(date.getHours() - (i * 0.5))
    } else if (days <= 30) {
      // Daily - go back by days
      date.setDate(date.getDate() - i)
    } else if (days <= 90) {
      // Weekly - go back by weeks
      date.setDate(date.getDate() - (i * 7))
    } else {
      // Monthly - go back by months
      date.setMonth(date.getMonth() - i)
    }

    if (i === pointsNeeded - 1) {
      dateRange.endYear = date.getFullYear()
    }
    if (i === 0) {
      dateRange.startYear = date.getFullYear()
    }
  }

  // Determine if we need to show years in labels
  const showYear = dateRange.startYear !== dateRange.endYear

  // Second pass: generate actual data with proper labels
  for (let i = pointsNeeded - 1; i >= 0; i--) {
    const date = new Date(today)
    
    // Calculate date going backwards
    if (days <= 1) {
      // Intraday - go back by hours
      date.setHours(date.getHours() - (i * 0.5))
    } else if (days <= 30) {
      // Daily - go back by days
      date.setDate(date.getDate() - i)
    } else if (days <= 90) {
      // Weekly - go back by weeks
      date.setDate(date.getDate() - (i * 7))
    } else {
      // Monthly - go back by months
      date.setMonth(date.getMonth() - i)
    }

    // Apply trend (price increases as we move forward in time)
    const trendChange = trend * i
    currentPrice = currentPrice * (1 + trendChange)
    
    // For the last data point (most recent), ensure it matches the actual current price
    // For other points, add realistic randomness
    if (i === pointsNeeded - 1) {
      // Last point - exact match with current price
      currentPrice = actualCurrentPrice
    } else {
      // Add some randomness for price movement
      const randomChange = (Math.random() - 0.5) * 2 * volatility * volatilityFactor
      currentPrice = currentPrice * (1 + randomChange)
    }

    // Generate time label based on preset and year boundary detection
    let timeLabel
    const dateYear = date.getFullYear()
    const month = MONTH_ABBREVIATIONS[date.toLocaleString('en-US', { month: 'long' })]
    
    if (preset === 'day' && days <= 7) {
      // For short timeframes (1D, 1W), show time for intraday or day-month for week
      if (days <= 1) {
        timeLabel = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
      } else {
        // 1W shows day and month
        const day = date.getDate().toString().padStart(2, '0')
        timeLabel = `${day} ${month}`
      }
    } else if (preset === 'day' && days <= 30) {
      // For 1M, show full date
      const day = date.getDate().toString().padStart(2, '0')
      const year = dateYear.toString().slice(-2)
      timeLabel = `${day} ${month} '${year}`
    } else if (preset === 'week') {
      // For weekly (3M, 6M), show date and month
      const day = date.getDate().toString().padStart(2, '0')
      // Include year if spanning multiple years or if it's not the current year
      if (showYear || dateYear !== dateRange.endYear) {
        const year = dateYear.toString().slice(-2)
        timeLabel = `${day} ${month} '${year}`
      } else {
        timeLabel = `${day} ${month}`
      }
    } else {
      // For monthly (1Y, 5Y, ALL), show month and year
      const year = dateYear.toString().slice(-2)
      timeLabel = `${month} '${year}`
    }

    data.push({
      time: timeLabel,
      price: Math.round(currentPrice * 100) / 100,
      date: date // Keep original date for debugging if needed
    })
  }

  // Ensure the last data point exactly matches the current price
  if (data.length > 0) {
    data[data.length - 1].price = actualCurrentPrice
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
