import { useState, useEffect, useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

// Timeframe constants
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

// Format currency for display
function formatCurrency(value) {
  if (!value && value !== 0) return 'N/A'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value)
}

// Filter data based on timeframe using actual dates from the data
function filterDataByTimeframe(data, timeframe) {
  if (!data || data.length === 0) return []
  
  const now = new Date()
  const days = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    '5Y': 1825
  }[timeframe.value] || 30
  
  const cutoffDate = new Date(now)
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  return data.filter(item => {
    const itemDate = new Date(item.timestamp || item.date)
    return itemDate >= cutoffDate
  })
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

// Main Chart Wrapper Component - Uses real data from parent
function ChartWrapper({ stock, chartData, showFundamentalsPanel }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[3]) // Default to 3M

  // Process and format chart data based on selected timeframe
  const processedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return []
    
    // Filter data based on timeframe
    const filteredData = filterDataByTimeframe(chartData, selectedTimeframe)
    
    // Format the data for display
    return filteredData.map(item => {
      const date = new Date(item.timestamp || item.date)
      
      // For intraday (1D, 1W), show time
      if (selectedTimeframe.value === '1D' || selectedTimeframe.value === '1W') {
        return {
          time: formatTimeLabel(date),
          price: item.price,
          timestamp: item.timestamp || item.date
        }
      }
      
      // For daily data, show date
      return {
        time: formatDateLabel(date),
        price: item.price,
        timestamp: item.timestamp || item.date
      }
    })
  }, [chartData, selectedTimeframe])

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

      {/* Chart */}
      {processedData.length > 0 ? (
        <StockChartInner
          data={processedData}
          isPositive={isPositive}
          showFundamentalsPanel={showFundamentalsPanel}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center border border-terminal-border rounded-lg bg-terminal-panel">
          <div className="text-center">
            <p className="text-terminal-dim mb-2 font-mono text-sm">No chart data available</p>
            <p className="text-xs text-terminal-dim/50 font-mono">Try selecting a different timeframe</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Export memoized version with custom comparison
export default memo(ChartWrapper, (prevProps, nextProps) => {
  // Only re-render if stock.id or chartData changes
  return prevProps.stock?.id === nextProps.stock?.id && 
         prevProps.chartData === nextProps.chartData &&
         prevProps.showFundamentalsPanel === nextProps.showFundamentalsPanel
})
