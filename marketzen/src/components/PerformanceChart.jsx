import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Calendar, ArrowRight, RefreshCw } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { usePortfolio } from '../context/PortfolioContext'

// Generate mock historical data for demonstration
const generatePerformanceData = (days = 365) => {
  const data = []
  let value = 100000 // Starting portfolio value
  const now = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Simulate realistic market movement
    const dailyReturn = (Math.random() - 0.48) * 0.03 // Slight positive bias
    value = value * (1 + dailyReturn)
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
      benchmark: Math.round(100000 * (1 + (days - i) * 0.0003 + (Math.random() - 0.5) * 0.02))
    })
  }
  
  return data
}

const COLORS = {
  portfolio: '#3b82f6',
  benchmark: '#6b7280'
}

function PerformanceChart({ onStockSelect }) {
  const { holdings, calculatePortfolioMetrics } = usePortfolio()
  const [timeRange, setTimeRange] = useState('1Y')
  const [chartType, setChartType] = useState('area')
  const [showBenchmark, setShowBenchmark] = useState(true)
  const [performanceData, setPerformanceData] = useState([])
  const [loading, setLoading] = useState(true)

  // Generate data on mount and when time range changes
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      const days = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : 365
      setPerformanceData(generatePerformanceData(days))
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [timeRange])

  // Calculate metrics
  const metrics = useMemo(() => {
    if (performanceData.length === 0) return null
    
    const startValue = performanceData[0].value
    const endValue = performanceData[performanceData.length - 1].value
    const change = endValue - startValue
    const changePercent = (change / startValue) * 100
    
    const benchmarkStart = performanceData[0].benchmark
    const benchmarkEnd = performanceData[performanceData.length - 1].benchmark
    const benchmarkChange = ((benchmarkEnd - benchmarkStart) / benchmarkStart) * 100
    
    return {
      currentValue: endValue,
      change,
      changePercent,
      benchmarkChange,
      outperformance: changePercent - benchmarkChange
    }
  }, [performanceData])

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `₹${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`
    }
    return `₹${value.toFixed(0)}`
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-white/10">
          <p className="text-sm text-textSecondary mb-2">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-textSecondary">{entry.name}:</span>
              <span className="font-mono font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-2xl p-8"
      >
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      </motion.div>
    )
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
          <h2 className="text-2xl font-semibold">Performance</h2>
          <p className="text-textSecondary text-sm">Track your portfolio performance over time</p>
        </div>
        <div className="flex items-center gap-2">
          {['1W', '1M', '3M', '6M', '1Y'].map((range) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-surfaceLight text-textSecondary hover:bg-surfaceLight/80'
              }`}
            >
              {range}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-sm text-textSecondary mb-1">Current Value</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.currentValue)}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-sm text-textSecondary mb-1">Total Return</p>
            <div className="flex items-center gap-2">
              {metrics.change >= 0 ? (
                <TrendingUp className="w-5 h-5 text-positive" />
              ) : (
                <TrendingDown className="w-5 h-5 text-negative" />
              )}
              <p className={`text-2xl font-bold ${metrics.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                {metrics.change >= 0 ? '+' : ''}{metrics.changePercent.toFixed(2)}%
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-sm text-textSecondary mb-1">vs Benchmark</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${metrics.outperformance >= 0 ? 'text-positive' : 'text-negative'}`}>
                {metrics.outperformance >= 0 ? '+' : ''}{metrics.outperformance.toFixed(2)}%
              </p>
              <ArrowRight className="w-4 h-4 text-textSecondary" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-sm text-textSecondary mb-1">Holdings</p>
            <p className="text-2xl font-bold">{holdings.length}</p>
            <p className="text-xs text-textSecondary">Active positions</p>
          </motion.div>
        </div>
      )}

      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'area' ? 'bg-primary text-white' : 'bg-surfaceLight text-textSecondary'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'line' ? 'bg-primary text-white' : 'bg-surfaceLight text-textSecondary'
            }`}
          >
            Line
          </button>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showBenchmark}
            onChange={(e) => setShowBenchmark(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-surfaceLight text-primary focus:ring-primary"
          />
          <span className="text-sm text-textSecondary">Show Benchmark</span>
        </label>
      </div>

      {/* Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.portfolio} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.portfolio} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                {showBenchmark && (
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => <span className="text-sm text-textSecondary">{value}</span>}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Portfolio"
                  stroke={COLORS.portfolio}
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                />
                {showBenchmark && (
                  <Area
                    type="monotone"
                    dataKey="benchmark"
                    name="Benchmark"
                    stroke={COLORS.benchmark}
                    strokeWidth={2}
                    fill="transparent"
                    strokeDasharray="5 5"
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                {showBenchmark && (
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => <span className="text-sm text-textSecondary">{value}</span>}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Portfolio"
                  stroke={COLORS.portfolio}
                  strokeWidth={2}
                  dot={false}
                />
                {showBenchmark && (
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    name="Benchmark"
                    stroke={COLORS.benchmark}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-4">Best Performers</h3>
          <div className="space-y-3">
            {holdings.slice(0, 5).map((holding) => (
              <div key={holding.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{holding.symbol.substring(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{holding.symbol}</p>
                    <p className="text-xs text-textSecondary">{holding.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-positive">
                    +{(Math.random() * 20).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
            {holdings.length === 0 && (
              <p className="text-sm text-textSecondary text-center py-4">
                Add holdings to see performance data
              </p>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-surfaceLight rounded-lg">
              <div className="w-8 h-8 rounded-full bg-positive/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-positive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Portfolio Value</p>
                <p className="text-xs text-textSecondary">Updated today</p>
              </div>
              <p className="text-sm font-medium text-positive">
                +{(Math.random() * 5).toFixed(2)}%
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surfaceLight rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Market Sessions</p>
                <p className="text-xs text-textSecondary">Last 30 days</p>
              </div>
              <p className="text-sm font-mono">22/22</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surfaceLight rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Best Day</p>
                <p className="text-xs text-textSecondary">This month</p>
              </div>
              <p className="text-sm font-medium text-positive">+3.24%</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default PerformanceChart
