import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Calendar, ArrowRight, RefreshCw } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { usePortfolio } from '../context/PortfolioContext'

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

  // Generate portfolio performance data based on actual holdings
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      const days = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : 365
      
      // Generate data based on actual holdings metrics
      const metrics = calculatePortfolioMetrics()
      
      // Build performance data from actual holdings
      if (holdings.length > 0) {
        const data = []
        const now = new Date()
        
        // Calculate average metrics from holdings
        const avgChange = holdings.reduce((sum, h) => sum + (h.currentValue - h.totalInvested) / h.totalInvested * 100, 0) / holdings.length
        
        let portfolioValue = metrics.totalCurrentValue
        
        for (let i = days; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          
          // Reverse calculate historical value
          const progress = i / days
          const historicalValue = portfolioValue / (1 + (avgChange / 100) * progress)
          const benchmarkValue = 100000 * (1 + (days - i) * 0.0003)
          
          data.push({
            date: date.toISOString().split('T')[0],
            value: Math.round(historicalValue),
            benchmark: Math.round(benchmarkValue)
          })
        }
        
        setPerformanceData(data)
      } else {
        // Empty portfolio - show zero growth
        const data = []
        const now = new Date()
        for (let i = days; i >= 0; i--) {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          data.push({
            date: date.toISOString().split('T')[0],
            value: 100000,
            benchmark: Math.round(100000 * (1 + (days - i) * 0.0003))
          })
        }
        setPerformanceData(data)
      }
      
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [timeRange, holdings, calculatePortfolioMetrics])

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
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-lg p-3 border border-white/10">
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
        className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-8"
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
            className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4"
          >
            <p className="text-sm text-textSecondary mb-1">Current Value</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.currentValue)}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4"
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
            className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4"
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
            className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4"
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
      <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
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
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-4">Best Performers</h3>
          <div className="space-y-3">
            {holdings.slice(0, 5).map((holding) => {
              const returnPct = holding.totalInvested > 0 
                ? ((holding.currentValue - holding.totalInvested) / holding.totalInvested * 100)
                : 0
              return (
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
                    <p className={`text-sm font-medium ${returnPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                    </p>
                  </div>
                </div>
              )
            })}
            {holdings.length === 0 && (
              <p className="text-sm text-textSecondary text-center py-4">
                Add holdings to see performance data
              </p>
            )}
          </div>
        </div>

        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-4">Portfolio Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-surfaceLight rounded-lg">
              <div className="w-8 h-8 rounded-full bg-positive/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-positive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Portfolio Value</p>
                <p className="text-xs text-textSecondary">Based on your holdings</p>
              </div>
              <p className="text-sm font-medium text-positive">
                {holdings.length > 0 ? '+' : ''}{(metrics?.changePercent || 0).toFixed(2)}%
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surfaceLight rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Total Holdings</p>
                <p className="text-xs text-textSecondary">{holdings.length} positions</p>
              </div>
              <p className="text-sm font-mono">{holdings.length}</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surfaceLight rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Total Invested</p>
                <p className="text-xs text-textSecondary">Initial investment</p>
              </div>
              <p className="text-sm font-mono">{formatCurrency(holdings.reduce((sum, h) => sum + h.totalInvested, 0))}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default PerformanceChart
