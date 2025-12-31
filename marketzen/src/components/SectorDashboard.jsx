import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

// Sector data with performance metrics
const SECTOR_DATA = [
  { id: 'nifty50', name: 'Nifty 50', change: 0.85, marketCap: 250000, constituents: 50 },
  { id: 'niftybank', name: 'Nifty Bank', change: 1.24, marketCap: 120000, constituents: 12 },
  { id: 'niftyit', name: 'Nifty IT', change: -0.42, marketCap: 85000, constituents: 10 },
  { id: 'nifty pharma', name: 'Nifty Pharma', change: 2.15, marketCap: 45000, constituents: 10 },
  { id: 'nifty auto', name: 'Nifty Auto', change: -1.12, marketCap: 65000, constituents: 15 },
  { id: 'nifty fmcg', name: 'Nifty FMCG', change: 0.56, marketCap: 72000, constituents: 10 },
  { id: 'nifty metal', name: 'Nifty Metal', change: -2.34, marketCap: 38000, constituents: 10 },
  { id: 'nifty realty', name: 'Nifty Realty', change: 3.45, marketCap: 28000, constituents: 10 },
  { id: 'nifty energy', name: 'Nifty Energy', change: 0.92, marketCap: 88000, constituents: 10 },
  { id: 'nifty media', name: 'Nifty Media', change: -0.87, marketCap: 12000, constituents: 5 },
  { id: 'nifty consumer', name: 'Nifty Consumer', change: 0.34, marketCap: 42000, constituents: 15 },
  { id: 'nifty healthcare', name: 'Nifty Healthcare', change: 1.56, marketCap: 55000, constituents: 10 },
]

const SECTOR_COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280'
}

// Get heatmap color based on performance
const getHeatmapColor = (change) => {
  if (change >= 2) return '#059669' // Strong positive
  if (change >= 1) return '#10b981' // Positive
  if (change >= 0) return '#34d399' // Mild positive
  if (change >= -1) return '#f87171' // Mild negative
  if (change >= -2) return '#ef4444' // Negative
  return '#dc2626' // Strong negative
}

// Get text color for heatmap
const getHeatmapTextColor = (change) => {
  return change >= 0 ? 'text-white' : 'text-white'
}

function SectorDashboard({ onSectorSelect }) {
  const [view, setView] = useState('heatmap') // 'heatmap', 'list', 'chart'
  const [sortBy, setSortBy] = useState('change') // 'change', 'name', 'marketCap'
  const [hoveredSector, setHoveredSector] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sort sectors based on selected criteria
  const sortedSectors = [...SECTOR_DATA].sort((a, b) => {
    if (sortBy === 'change') return b.change - a.change
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'marketCap') return b.marketCap - a.marketCap
    return 0
  })

  // Calculate market summary
  const totalGainers = SECTOR_DATA.filter(s => s.change > 0).length
  const totalLosers = SECTOR_DATA.filter(s => s.change < 0).length
  const avgChange = SECTOR_DATA.reduce((sum, s) => sum + s.change, 0) / SECTOR_DATA.length
  const bestSector = SECTOR_DATA.reduce((best, s) => s.change > best.change ? s : best, SECTOR_DATA[0])
  const worstSector = SECTOR_DATA.reduce((worst, s) => s.change < worst.change ? s : worst, SECTOR_DATA[0])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const formatMarketCap = (value) => {
    if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L Cr`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K Cr`
    return value.toString()
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
          <h2 className="text-2xl font-semibold">Sector Performance</h2>
          <p className="text-textSecondary text-sm">Market sector analysis and trends</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-surfaceLight rounded-lg p-1">
            <button
              onClick={() => setView('heatmap')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'heatmap' ? 'bg-primary text-white' : 'text-textSecondary hover:text-text'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-primary text-white' : 'text-textSecondary hover:text-text'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('chart')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'chart' ? 'bg-primary text-white' : 'text-textSecondary hover:text-text'
              }`}
            >
              Chart
            </button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-surfaceLight hover:bg-surface transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Market Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-positive" />
            <span className="text-sm text-textSecondary">Gainers</span>
          </div>
          <p className="text-2xl font-bold text-positive">{totalGainers}</p>
          <p className="text-xs text-textSecondary">sectors up</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-negative" />
            <span className="text-sm text-textSecondary">Losers</span>
          </div>
          <p className="text-2xl font-bold text-negative">{totalLosers}</p>
          <p className="text-xs text-textSecondary">sectors down</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm text-textSecondary">Avg Change</span>
          </div>
          <p className={`text-2xl font-bold ${avgChange >= 0 ? 'text-positive' : 'text-negative'}`}>
            {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
          </p>
          <p className="text-xs text-textSecondary">market average</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            {bestSector.change >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-positive" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-negative" />
            )}
            <span className="text-sm text-textSecondary">Top Sector</span>
          </div>
          <p className="text-lg font-bold truncate">{bestSector.name}</p>
          <p className="text-xs text-positive">+{bestSector.change.toFixed(2)}%</p>
        </motion.div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-textSecondary">Sort by:</span>
        <div className="flex items-center gap-2">
          {['change', 'name', 'marketCap'].map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === option 
                  ? 'bg-primary text-white' 
                  : 'bg-surfaceLight text-textSecondary hover:bg-surface'
              }`}
            >
              {option === 'change' ? '% Change' : option === 'name' ? 'Name' : 'Market Cap'}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap View */}
      {view === 'heatmap' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedSectors.map((sector, index) => (
              <motion.div
                key={sector.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredSector(sector)}
                onMouseLeave={() => setHoveredSector(null)}
                onClick={() => onSectorSelect && onSectorSelect(sector)}
                whileHover={{ scale: 1.02 }}
                className="rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden"
                style={{ 
                  backgroundColor: getHeatmapColor(sector.change),
                  minHeight: '100px'
                }}
              >
                <div className={`relative z-10 ${getHeatmapTextColor(sector.change)}`}>
                  <p className="text-sm font-medium truncate">{sector.name}</p>
                  <p className="text-lg font-bold mt-1">
                    {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {formatMarketCap(sector.marketCap)}
                  </p>
                </div>
                
                {/* Hover Details */}
                {hoveredSector?.id === sector.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/30 flex items-center justify-center"
                  >
                    <div className="text-center text-white">
                      <p className="text-xs opacity-75">{sector.constituents} constituents</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Heatmap Legend */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-textSecondary mb-2">Performance Scale</p>
            <div className="flex items-center gap-1">
              <div className="px-2 py-1 bg-red-700 rounded text-xs text-white">-2%</div>
              <div className="px-2 py-1 bg-red-500 rounded text-xs text-white">-1%</div>
              <div className="px-2 py-1 bg-gray-400 rounded text-xs text-white">0%</div>
              <div className="px-2 py-1 bg-emerald-400 rounded text-xs text-white">+1%</div>
              <div className="px-2 py-1 bg-emerald-600 rounded text-xs text-white">+2%+</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* List View */}
      {view === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="grid grid-cols-4 gap-4 p-4 bg-surfaceLight text-sm text-textSecondary font-medium">
            <div>Sector</div>
            <div className="text-right">Change</div>
            <div className="text-right">Market Cap</div>
            <div className="text-right">Constituents</div>
          </div>
          
          <div className="divide-y divide-white/5">
            {sortedSectors.map((sector, index) => (
              <motion.div
                key={sector.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-4 gap-4 p-4 hover:bg-surfaceLight/50 transition-colors cursor-pointer"
                onClick={() => onSectorSelect && onSectorSelect(sector)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getHeatmapColor(sector.change) }}
                  />
                  <span className="font-medium">{sector.name}</span>
                </div>
                <div className={`text-right font-mono font-medium ${
                  sector.change >= 0 ? 'text-positive' : 'text-negative'
                }`}>
                  {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                </div>
                <div className="text-right text-textSecondary">
                  {formatMarketCap(sector.marketCap)}
                </div>
                <div className="text-right text-textSecondary">
                  {sector.constituents}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Chart View */}
      {view === 'chart' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-medium mb-4">Sector Comparison</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sortedSectors}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(21, 26, 33, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Change']}
                />
                <ReferenceLine y={0} stroke="#6b7280" />
                <Bar dataKey="change" name="Change %" radius={[4, 4, 0, 0]}>
                  {sortedSectors.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.change >= 0 ? '#10b981' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default SectorDashboard
