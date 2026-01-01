import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Settings, ZoomIn, ZoomOut, MoveHorizontal, CandlestickChart, Activity, RefreshCw, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, BarChart, Bar } from 'recharts'
import { useTheme } from '../context/ThemeContext'

// Generate realistic candlestick-like data
const generateCandlestickData = (days = 100) => {
  const data = []
  let price = 1000
  const now = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    const volatility = 0.02 + Math.random() * 0.03
    const change = (Math.random() - 0.48) * volatility * price
    const open = price
    const close = price + change
    
    const highExtra = Math.random() * volatility * price * 0.5
    const lowExtra = Math.random() * volatility * price * 0.5
    
    const high = Math.max(open, close) + highExtra
    const low = Math.min(open, close) - lowExtra
    
    const isBullish = close >= open
    
    const volume = Math.round(1000000 + Math.random() * 5000000)
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
      isBullish,
      change: ((close - open) / open) * 100,
      body: Math.abs(close - open),
      bodyPosition: Math.min(open, close),
      wickHigh: high,
      wickLow: low
    })
    
    price = close
  }
  
  return data
}

// Simple moving average calculation
const calculateSMA = (data, period) => {
  return data.map((item, index, arr) => {
    if (index < period - 1) return { ...item, sma: null }
    const sum = arr.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.close, 0)
    return { ...item, sma: sum / period }
  })
}

// RSI calculation
const calculateRSI = (data, period = 14) => {
  const result = []
  let gains = 0
  let losses = 0
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push({ ...data[i], rsi: null })
      continue
    }
    
    const change = data[i].close - data[i - 1].close
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    
    if (i < period) {
      gains = (gains * (i) + gain) / (i + 1)
      losses = (losses * (i) + loss) / (i + 1)
      result.push({ ...data[i], rsi: null })
    } else if (i === period) {
      gains = gain
      losses = loss
      const rs = losses === 0 ? 100 : gains / losses
      result.push({ ...data[i], rsi: 100 - (100 / (1 + rs)) })
    } else {
      gains = (gains * (period - 1) + gain) / period
      losses = (losses * (period - 1) + loss) / period
      const rs = losses === 0 ? 100 : gains / losses
      result.push({ ...data[i], rsi: 100 - (100 / (1 + rs)) })
    }
  }
  
  return result
}

// Custom candlestick component using SVG
const Candlestick = ({ x, y, width, payload, positiveColor, negativeColor }) => {
  if (!payload) return null
  
  const { body, bodyPosition, wickHigh, wickLow, isBullish } = payload
  const color = isBullish ? positiveColor : negativeColor
  
  // Calculate positions based on Y-axis domain
  // This is a simplified visualization
  return (
    <g>
      {/* Wick (high-low line) */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + 50}
        stroke={color}
        strokeWidth={2}
      />
      {/* Body (open-close rectangle) */}
      <rect
        x={x}
        y={y + 10}
        width={width}
        height={30}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

function AdvancedCharting({ onStockSelect }) {
  const { chartStyle, currentTheme } = useTheme()
  const [candlestickData, setCandlestickData] = useState(() => generateCandlestickData(100))
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: false,
    rsi: true,
    volume: true
  })
  const [zoom, setZoom] = useState(1)
  const [selectedCandle, setSelectedCandle] = useState(null)
  const [hoveredData, setHoveredData] = useState(null)

  const theme = currentTheme()

  const chartData = useMemo(() => {
    let data = candlestickData
    
    if (indicators.sma20) {
      data = calculateSMA(data, 20)
    }
    if (indicators.sma50) {
      data = calculateSMA(data, 50)
    }
    if (indicators.rsi) {
      data = calculateRSI(data, 14)
    }
    
    return data
  }, [candlestickData, indicators])

  const priceRange = useMemo(() => {
    const prices = chartData.flatMap(d => [d.high, d.low]).filter(p => p !== null)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const padding = (max - min) * 0.1
    return { min: min - padding, max: max + padding }
  }, [chartData])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  const formatPrice = (value) => {
    return `₹${value.toFixed(0)}`
  }

  const refreshData = () => {
    setLoading(true)
    setTimeout(() => {
      setCandlestickData(generateCandlestickData(100))
      setLoading(false)
    }, 500)
  }

  const handleMouseMove = (data) => {
    if (data && data.activePayload) {
      setHoveredData(data.activePayload[0]?.payload)
    }
  }

  const handleCandleClick = (data) => {
    if (data && data.activePayload) {
      setSelectedCandle(data.activePayload[0]?.payload)
    }
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      if (!data) return null

      return (
        <div className="glass rounded-lg p-3 border border-white/10">
          <p className="text-sm text-textSecondary mb-2">{formatDate(data.date)}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-textSecondary">Open:</span>
              <span className="font-mono">{formatPrice(data.open)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-textSecondary">High:</span>
              <span className="font-mono">{formatPrice(data.high)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-textSecondary">Low:</span>
              <span className="font-mono">{formatPrice(data.low)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-textSecondary">Close:</span>
              <span className={`font-mono ${data.isBullish ? 'text-positive' : 'text-negative'}`}>
                {formatPrice(data.close)}
              </span>
            </div>
            {indicators.volume && (
              <div className="flex justify-between gap-4">
                <span className="text-textSecondary">Volume:</span>
                <span className="font-mono">{(data.volume / 1000000).toFixed(2)}M</span>
              </div>
            )}
            {data.sma && (
              <div className="flex justify-between gap-4">
                <span className="text-textSecondary">SMA(20):</span>
                <span className="font-mono text-amber-500">{formatPrice(data.sma)}</span>
              </div>
            )}
            {data.rsi && (
              <div className="flex justify-between gap-4">
                <span className="text-textSecondary">RSI:</span>
                <span className={`font-mono ${
                  data.rsi > 70 ? 'text-negative' : data.rsi < 30 ? 'text-positive' : 'text-textSecondary'
                }`}>
                  {data.rsi.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
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
        <div>
          <h2 className="text-2xl font-semibold">Advanced Charting</h2>
          <p className="text-textSecondary text-sm">Candlestick charts with technical indicators</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))}
            className="p-2.5 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
            className="p-2.5 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refreshData}
            className="p-2.5 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-lg transition-colors ${
              showSettings ? 'bg-primary text-white' : 'bg-surfaceLight hover:bg-surfaceLight/80'
            }`}
            title="Indicator Settings"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Indicator Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-4 mb-6 overflow-hidden"
          >
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { key: 'sma20', label: 'SMA(20)', color: '#f59e0b' },
                { key: 'sma50', label: 'SMA(50)', color: '#8b5cf6' },
                { key: 'rsi', label: 'RSI', color: '#06b6d4' },
                { key: 'volume', label: 'Volume', color: '#6b7280' }
              ].map(({ key, label, color }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={indicators[key]}
                    onChange={(e) => setIndicators(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20 bg-surfaceLight text-primary focus:ring-primary"
                  />
                  <span className="text-sm flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chart */}
      <div className="glass rounded-2xl p-6">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium">Candlestick Chart</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-positive" />
              <span className="text-xs text-textSecondary">Bullish</span>
              <div className="w-3 h-3 rounded-full bg-negative" />
              <span className="text-xs text-textSecondary">Bearish</span>
            </div>
          </div>
          {hoveredData && (
            <div className="text-right">
              <p className={`text-xl font-bold ${hoveredData.isBullish ? 'text-positive' : 'text-negative'}`}>
                {formatPrice(hoveredData.close)}
              </p>
              <p className="text-sm text-textSecondary">
                {hoveredData.isBullish ? '+' : ''}{hoveredData.change.toFixed(2)}%
              </p>
            </div>
          )}
        </div>

        {/* Main Chart */}
        <div 
          className="h-80"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          onMouseLeave={() => setHoveredData(null)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              onMouseMove={handleMouseMove}
              onClick={handleCandleClick}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[priceRange.min, priceRange.max]}
                tickFormatter={formatPrice}
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Close price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke={theme.primary}
                strokeWidth={2}
                dot={false}
                name="Close"
              />

              {/* SMA Lines */}
              {indicators.sma20 && (
                <Line
                  type="monotone"
                  dataKey="sma"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="SMA(20)"
                />
              )}

              {/* RSI Reference Lines */}
              {indicators.rsi && (
                <>
                  <ReferenceLine y={70} stroke="rgba(239,68,68,0.5)" strokeDasharray="5 5" />
                  <ReferenceLine y={30} stroke="rgba(16,185,129,0.5)" strokeDasharray="5 5" />
                </>
              )}

              {/* Hover indicator */}
              {hoveredData && (
                <ReferenceDot
                  x={hoveredData.date}
                  y={hoveredData.close}
                  r={6}
                  fill={theme.primary}
                  stroke="white"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        {indicators.volume && (
          <div className="mt-4 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-50)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" hide />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                  width={40}
                />
                <Bar
                  dataKey="volume"
                  fill={d => d.isBullish ? theme.positive : theme.negative}
                  opacity={0.5}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RSI Indicator Panel */}
        {indicators.rsi && chartData.length > 0 && (
          <div className="mt-4 p-4 bg-surfaceLight rounded-xl">
            <p className="text-sm font-medium mb-2">Relative Strength Index (14)</p>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-50)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" hide />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    width={30}
                  />
                  <ReferenceLine y={70} stroke="rgba(239,68,68,0.5)" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="rgba(16,185,129,0.5)" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="rsi"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Selected Candle Details */}
      {selectedCandle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Selected: {formatDate(selectedCandle.date)}</h3>
            <button
              onClick={() => setSelectedCandle(null)}
              className="p-1 hover:bg-surfaceLight rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Open', value: selectedCandle.open, positive: false },
              { label: 'High', value: selectedCandle.high, positive: false },
              { label: 'Low', value: selectedCandle.low, positive: false },
              { label: 'Close', value: selectedCandle.close, positive: selectedCandle.isBullish }
            ].map(({ label, value, positive }) => (
              <div key={label} className="p-3 bg-surfaceLight rounded-lg text-center">
                <p className="text-xs text-textSecondary mb-1">{label}</p>
                <p className={`text-lg font-bold ${positive ? 'text-positive' : ''}`}>
                  {formatPrice(value)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Chart Legend */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <h4 className="text-sm font-medium mb-2">Chart Patterns</h4>
          <div className="space-y-2 text-sm text-textSecondary">
            <p>• Doji: Open ≈ Close</p>
            <p>• Hammer: Small body, long lower wick</p>
            <p>• Engulfing: Large body engulfs previous</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <h4 className="text-sm font-medium mb-2">Technical Indicators</h4>
          <div className="space-y-2 text-sm text-textSecondary">
            <p className="text-amber-500">• SMA(20): 20-day average</p>
            <p className="text-purple-500">• SMA(50): 50-day average</p>
            <p className="text-cyan-500">• RSI: Momentum oscillator</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <h4 className="text-sm font-medium mb-2">Quick Tips</h4>
          <div className="space-y-2 text-sm text-textSecondary">
            <p>• Green = Bullish (close {'>'} open)</p>
            <p>• Red = Bearish (close {'<'} open)</p>
            <p>• Wicks show high/low range</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AdvancedCharting
