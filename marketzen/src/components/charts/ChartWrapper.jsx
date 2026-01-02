import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Line, ComposedChart, Bar } from 'recharts'
import { Spinner } from '../common/LoadingSkeleton'
import { ErrorWithRetry } from '../common/ErrorDisplay'
import { TrendingUp, Activity, BarChart3 } from 'lucide-react'

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

// Yahoo Finance API configuration - Chart API
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

// Alternative: Use Yahoo Finance 7-day historical data API (less restricted)
const YAHOO_HISTORY_BASE = 'https://finance.yahoo.com/quote'

// Enhanced proxy configurations with better browser simulation
const CORS_PROXIES = [
  { 
    url: 'https://api.allorigins.win/get?url=',
    encode: true,
    timeout: 15000
  },
  { 
    url: 'https://corsproxy.io/?',
    encode: true,
    timeout: 15000
  },
  { 
    url: 'https://api.corsproxy.io/?',
    encode: true,
    timeout: 15000
  },
  { 
    url: 'https://thingproxy.freeboard.io/fetch?url=',
    encode: true,
    timeout: 15000
  }
]

// Browser headers that Yahoo Finance accepts (minimal to avoid CORS issues)
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
}

// EMA Period Constants
const EMA_PERIODS = {
  FAST: 10,
  MEDIUM: 20,
  SLOW: 44
}
const VOLUME_PERIOD = 20

// Format currency for display
function formatCurrency(value) {
  if (!value && value !== 0) return 'N/A'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value)
}

// Format number for display
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined) return '--'
  return value.toFixed(decimals)
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

// =============================================================================
// Demo Data Generator (used when API is unavailable)
// =============================================================================

function calculateEMA(prices, period) {
  if (!prices || prices.length < period || period <= 0) {
    return prices ? prices.map(() => null) : []
  }

  const multiplier = 2 / (period + 1)
  const result = []

  // Initialize with SMA of first 'period' prices
  let initialSum = 0
  for (let i = 0; i < period; i++) {
    initialSum += prices[i]
  }
  let previousEMA = initialSum / period

  // First 'period - 1' values are null
  for (let i = 0; i < period - 1; i++) {
    result.push(null)
  }

  result.push(previousEMA)

  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] - previousEMA) * multiplier + previousEMA
    result.push(currentEMA)
    previousEMA = currentEMA
  }

  return result
}

function calculateSMA(values, period) {
  if (!values || values.length < period || period <= 0) {
    return values ? values.map(() => null) : []
  }

  const result = []

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += values[i - j]
      }
      result.push(sum / period)
    }
  }

  return result
}

function isPerfectStack(close, ema10, ema20, ema44, volume, volSma20) {
  // All EMAs must be calculated
  if (ema10 === null || ema20 === null || ema44 === null) {
    return false
  }
  // Check price alignment (bullish stack)
  const priceAligned = close > ema10 && ema10 > ema20 && ema20 > ema44
  // Volume confirmation (optional - if volume data is available, check it; otherwise skip)
  let volumeConfirmed = true
  if (volume !== null && volSma20 !== null && volSma20 > 0) {
    volumeConfirmed = volume > volSma20
  }
  return priceAligned && volumeConfirmed
}

function enrichChartData(data) {
  if (!data || data.length === 0) return []

  const closes = data.map(d => d.close)
  const volumes = data.map(d => d.volume)

  const ema10 = calculateEMA(closes, EMA_PERIODS.FAST)
  const ema20 = calculateEMA(closes, EMA_PERIODS.MEDIUM)
  const ema44 = calculateEMA(closes, EMA_PERIODS.SLOW)
  const volSma20 = calculateSMA(volumes, VOLUME_PERIOD)

  return data.map((point, index) => ({
    ...point,
    ema10: ema10[index],
    ema20: ema20[index],
    ema44: ema44[index],
    volSma20: volSma20[index],
    isPerfectStack: isPerfectStack(
      point.close,
      ema10[index],
      ema20[index],
      ema44[index],
      point.volume,
      volSma20[index]
    )
  }))
}

// =============================================================================
// Signal Marker Component
// =============================================================================

function SignalMarker({ cx, cy, payload }) {
  if (!cx || !cy || !payload || !payload.isPerfectStack) {
    return null
  }

  return (
    <g>
      {/* Glow effect */}
      <filter id="signalGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Main arrow marker */}
      <path
        d={`M ${cx - 6} ${cy + 10}
           L ${cx - 6} ${cy}
           L ${cx - 2} ${cy}
           L ${cx} ${cy - 6}
           L ${cx + 2} ${cy}
           L ${cx + 6} ${cy}
           L ${cx + 6} ${cy + 10}
           Z`}
        fill="#22c55e"
        stroke="#16a34a"
        strokeWidth={1}
        filter="url(#signalGlow)"
      />
    </g>
  )
}

// =============================================================================
// Indicator Controls Component
// =============================================================================

function IndicatorControls({ showEMAs, showSignals, showVolume, onToggleEMAs, onToggleSignals, onToggleVolume }) {
  const ToggleButton = ({ label, isActive, onClick, color }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
        border transition-all duration-200
        ${isActive
          ? 'bg-terminal-bg border-terminal-green/50 shadow-lg shadow-terminal-green/10 text-terminal-text'
          : 'bg-terminal-panel border-terminal-border hover:border-terminal-dim text-terminal-dim'
        }
      `}
    >
      <span style={{ color: isActive ? color : undefined }}>
        {label === 'EMAs' && <TrendingUp className="w-3.5 h-3.5" />}
        {label === 'Signals' && <Activity className="w-3.5 h-3.5" />}
        {label === 'Volume' && <BarChart3 className="w-3.5 h-3.5" />}
      </span>
      {label}
    </motion.button>
  )

  return (
    <div className="flex items-center gap-2">
      <ToggleButton
        label="EMAs"
        isActive={showEMAs}
        onClick={onToggleEMAs}
        color="#22d3ee"
      />
      <ToggleButton
        label="Signals"
        isActive={showSignals}
        onClick={onToggleSignals}
        color="#22c55e"
      />
      <ToggleButton
        label="Volume"
        isActive={showVolume}
        onClick={onToggleVolume}
        color="#78716c"
      />
    </div>
  )
}

// =============================================================================
// EMA Legend Component
// =============================================================================

function EMALegend({ ema10, ema20, ema44, currentPrice, isPerfectStack }) {
  const getPriceDiff = (price, ema) => {
    if (price === null || ema === null || ema === 0) return '--'
    const diff = ((price - ema) / ema) * 100
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
  }

  return (
    <div className="flex items-center gap-4 px-3 py-1.5 bg-terminal-panel/95 rounded border border-terminal-border">
      {/* Perfect Stack Badge */}
      {isPerfectStack && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-terminal-green/10 rounded border border-terminal-green/30">
          <TrendingUp className="w-3 h-3 text-terminal-green" />
          <span className="text-[10px] font-medium text-terminal-green">PERFECT STACK</span>
        </div>
      )}

      {/* EMA Values */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22d3ee' }} />
          <span className="text-[10px] text-terminal-dim">10:</span>
          <span className="text-xs font-mono text-terminal-text">{formatNumber(ema10)}</span>
          <span className="text-[10px] text-terminal-green">{getPriceDiff(currentPrice, ema10)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
          <span className="text-[10px] text-terminal-dim">20:</span>
          <span className="text-xs font-mono text-terminal-text">{formatNumber(ema20)}</span>
          <span className="text-[10px] text-terminal-green">{getPriceDiff(currentPrice, ema20)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#a855f7' }} />
          <span className="text-[10px] text-terminal-dim">44:</span>
          <span className="text-xs font-mono text-terminal-text">{formatNumber(ema44)}</span>
          <span className="text-[10px] text-terminal-green">{getPriceDiff(currentPrice, ema44)}</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Timeframe Selector Component
// =============================================================================

function TimeframeSelector({ timeframes, selected, onSelect }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
      {timeframes.map((tf) => (
        <motion.button
          key={tf.label}
          onClick={() => onSelect(tf)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
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

// =============================================================================
// Main Chart Component
// =============================================================================

const StockChartInner = memo(function StockChartInner({
  data,
  isPositive,
  showEMAs,
  showSignals,
  showVolume,
  emaValues,
  isPerfectStack
}) {
  const latestEMA = data.length > 0 ? data[data.length - 1] : {}

  // Find volume domain
  const volumes = data.map(d => d.volume).filter(Boolean)
  const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 1000

  return (
    <div className="
      flex-1 min-h-0 
      border border-terminal-border 
      rounded-lg bg-terminal-panel 
      p-4
    ">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="colorPriceTerminal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#78716c" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#78716c" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
            interval="equidistantPreserveStartEnd"
            minTickGap={50}
            tickMargin={8}
          />

          <YAxis
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
            width={60}
          />

          {/* Volume Axis */}
          <YAxis
            yAxisId="volume"
            orientation="right"
            domain={[0, maxVolume * 1.2]}
            axisLine={false}
            tickLine={false}
            tick={false}
            width={1}
          />

          <Tooltip
            contentStyle={{
              background: 'rgba(3, 7, 18, 0.95)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '4px',
              backdropFilter: 'blur(12px)',
              fontFamily: 'monospace',
              fontSize: '11px'
            }}
            labelStyle={{ color: '#6b7280', fontFamily: 'monospace' }}
            formatter={(value, name) => {
              if (name === 'EMA 10') return [formatNumber(value), 'EMA 10']
              if (name === 'EMA 20') return [formatNumber(value), 'EMA 20']
              if (name === 'EMA 44') return [formatNumber(value), 'EMA 44']
              if (name === 'Volume') return [value.toLocaleString(), 'Volume']
              return [formatCurrency(value), 'PRICE']
            }}
            labelFormatter={(label) => label}
          />

          {/* Price Area */}
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            fill="url(#colorPriceTerminal)"
            animationDuration={800}
            isAnimationActive={false}
          />

          {/* Volume Bars */}
          {showVolume && (
            <Bar
              dataKey="volume"
              yAxisId="volume"
              fill="#78716c"
              fillOpacity={0.3}
              isAnimationActive={false}
            />
          )}

          {/* EMA Lines */}
          {showEMAs && (
            <>
              <Line
                type="monotone"
                dataKey="ema10"
                stroke="#22d3ee"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="EMA 10"
              />
              <Line
                type="monotone"
                dataKey="ema20"
                stroke="#fbbf24"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="EMA 20"
              />
              <Line
                type="monotone"
                dataKey="ema44"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="EMA 44"
              />
            </>
          )}

          {/* Signal Markers */}
          {showSignals && (
            <Line
              type="monotone"
              dataKey="isPerfectStack"
              stroke="transparent"
              dot={(props) => <SignalMarker {...props} />}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
})

// Main Chart Wrapper Component
function ChartWrapper({ stock }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[3])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Indicator visibility state
  const [showEMAs, setShowEMAs] = useState(true)
  const [showSignals, setShowSignals] = useState(true)
  const [showVolume, setShowVolume] = useState(true)

  // Fetch chart data from Yahoo Finance
  const fetchChartData = useCallback(async (stockId, timeframe) => {
    if (!stockId) return

    setLoading(true)
    setError(null)

    const tryFetchWithProxy = async (targetUrl, proxyIndex = 0, retries = 3) => {
      if (proxyIndex >= CORS_PROXIES.length || retries <= 0) {
        throw new Error('All proxies failed')
      }

      const proxyConfig = CORS_PROXIES[proxyIndex]
      const encodedUrl = proxyConfig.encode ? encodeURIComponent(targetUrl) : targetUrl
      const proxyUrl = `${proxyConfig.url}${encodedUrl}`

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), proxyConfig.timeout || 15000)

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: YAHOO_HEADERS,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        let data
        const contentType = response.headers.get('content-type') || ''
        
        if (proxyConfig.url.includes('allorigins')) {
          const json = await response.json()
          if (!json.contents) {
            throw new Error('Empty response from proxy')
          }
          data = JSON.parse(json.contents)
        } else {
          if (!contentType.includes('application/json')) {
            throw new Error(`Invalid content type: ${contentType}`)
          }
          data = await response.json()
        }

        return data
      } catch (err) {
        if (err.name === 'AbortError') {
          return tryFetchWithProxy(targetUrl, proxyIndex + 1, retries - 1)
        }
        return tryFetchWithProxy(targetUrl, proxyIndex + 1, retries - 1)
      }
    }

    try {
      let data = null
      
      try {
        const url = `${YAHOO_BASE}/${stockId}?range=${timeframe.range}&interval=${timeframe.interval}`
        data = await tryFetchWithProxy(url)
      } catch (apiError) {
        // API failed, show empty state
        setError('Unable to fetch chart data. Please check your connection and try again.')
        setChartData([])
        setLoading(false)
        return
      }

      if (data?.chart?.result?.[0]) {
        const result = data.chart.result[0]
        const quote = result.indicators?.quote?.[0] || {}
        const timestamps = result.timestamp || []
        const prices = quote.close || []
        const volumes = quote.volume || []

        const transformed = timestamps.map((ts, i) => {
          const price = prices[i]
          const volume = volumes[i]
          if (price === null || price === undefined) return null

          const date = new Date(ts * 1000)

          let timeLabel
          if (timeframe.value === '1D' || timeframe.value === '1W') {
            timeLabel = formatTimeLabel(date)
          } else {
            timeLabel = formatDateLabel(date)
          }

          return {
            time: timeLabel,
            close: price,
            price: price,
            volume: volume || 0,
            timestamp: ts
          }
        }).filter(Boolean)

        if (transformed.length === 0) {
          setError('No chart data available for this stock')
          setChartData([])
        } else {
          const enrichedData = enrichChartData(transformed)
          setChartData(enrichedData)
        }
      } else {
        setError('No data available for this stock')
        setChartData([])
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
      setError('Unable to fetch chart data. Please try again later.')
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

  // Get current EMA values from latest data point
  const currentEMA = useMemo(() => {
    if (chartData.length === 0) return { ema10: null, ema20: null, ema44: null, isPerfectStack: false }
    const latest = chartData[chartData.length - 1]
    return {
      ema10: latest.ema10,
      ema20: latest.ema20,
      ema44: latest.ema44,
      isPerfectStack: latest.isPerfectStack
    }
  }, [chartData])

  return (
    <div className="
      flex-1 flex flex-col min-h-0 
      p-4
    ">
      {/* Header */}
      <div className="
        flex items-center justify-between mb-4 flex-wrap gap-3 flex-shrink-0
      ">
        <div className="flex items-center gap-3">
          <span className="text-terminal-green font-bold text-sm">CHART</span>

          {/* EMA Legend */}
          <EMALegend
            ema10={currentEMA.ema10}
            ema20={currentEMA.ema20}
            ema44={currentEMA.ema44}
            currentPrice={chartData.length > 0 ? chartData[chartData.length - 1].price : stock?.current_price}
            isPerfectStack={currentEMA.isPerfectStack}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Indicator Controls */}
          <IndicatorControls
            showEMAs={showEMAs}
            showSignals={showSignals}
            showVolume={showVolume}
            onToggleEMAs={() => setShowEMAs(!showEMAs)}
            onToggleSignals={() => setShowSignals(!showSignals)}
            onToggleVolume={() => setShowVolume(!showVolume)}
          />

          {/* Timeframe Selector */}
          <TimeframeSelector
            timeframes={TIMEFRAMES}
            selected={selectedTimeframe}
            onSelect={setSelectedTimeframe}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex-1 flex items-center justify-center border border-terminal-border rounded-lg bg-terminal-panel">
          <ErrorWithRetry
            message={error}
            onRetry={() => fetchChartData(stock?.id, selectedTimeframe)}
            severity="error"
          />
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
          showEMAs={showEMAs}
          showSignals={showSignals}
          showVolume={showVolume}
          emaValues={currentEMA}
          isPerfectStack={currentEMA.isPerfectStack}
        />
      )}
    </div>
  )
}

// Export component
export default ChartWrapper
