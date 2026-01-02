import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, RefreshCw, X, Star, Check } from 'lucide-react'
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

// Note: Sector data is representative. For production, integrate with NSE India API
const SECTOR_DATA = [
  { id: 'nifty50', name: 'Nifty 50', change: 0.85, marketCap: 250000, constituents: 50, symbol: '^NIFTY' },
  { id: 'niftybank', name: 'Nifty Bank', change: 1.24, marketCap: 120000, constituents: 12, symbol: '^NIFTYBANK' },
  { id: 'niftyit', name: 'Nifty IT', change: -0.42, marketCap: 85000, constituents: 10, symbol: '^NIFTYIT' },
  { id: 'nifty pharma', name: 'Nifty Pharma', change: 2.15, marketCap: 45000, constituents: 10, symbol: '^NIFTYPHARMA' },
  { id: 'nifty auto', name: 'Nifty Auto', change: -1.12, marketCap: 65000, constituents: 15, symbol: '^NIFTYAUTO' },
  { id: 'nifty fmcg', name: 'Nifty FMCG', change: 0.56, marketCap: 72000, constituents: 10, symbol: '^NIFTYFMCG' },
  { id: 'nifty metal', name: 'Nifty Metal', change: -2.34, marketCap: 38000, constituents: 10, symbol: '^NIFTYMETAL' },
  { id: 'nifty realty', name: 'Nifty Realty', change: 3.45, marketCap: 28000, constituents: 10, symbol: '^NIFTYREALTY' },
  { id: 'nifty energy', name: 'Nifty Energy', change: 0.92, marketCap: 88000, constituents: 10, symbol: '^NIFTYENERGY' },
  { id: 'nifty media', name: 'Nifty Media', change: -0.87, marketCap: 12000, constituents: 5, symbol: '^NIFTYMEDIA' },
  { id: 'nifty consumer', name: 'Nifty Consumer', change: 0.34, marketCap: 42000, constituents: 15, symbol: '^NIFTYCONS' },
  { id: 'nifty healthcare', name: 'Nifty Healthcare', change: 1.56, marketCap: 55000, constituents: 10, symbol: '^NIFTYHC' },
]

// Sector to constituent stocks mapping
const SECTOR_STOCKS = {
  'nifty50': [
    { id: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries' },
    { id: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy Services' },
    { id: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank' },
    { id: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank' },
    { id: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India' },
  ],
  'niftybank': [
    { id: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank' },
    { id: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank' },
    { id: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India' },
    { id: 'KOTAKBANK.NS', symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
    { id: 'AXISBANK.NS', symbol: 'AXISBANK', name: 'Axis Bank' },
  ],
  'niftyit': [
    { id: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy Services' },
    { id: 'INFY.NS', symbol: 'INFY', name: 'Infosys' },
    { id: 'WIPRO.NS', symbol: 'WIPRO', name: 'Wipro' },
    { id: 'TECHM.NS', symbol: 'TECHM', name: 'Tech Mahindra' },
    { id: 'HCLTECH.NS', symbol: 'HCLTECH', name: 'HCL Technologies' },
  ],
  'nifty pharma': [
    { id: 'SUNPHARMA.NS', symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical' },
    { id: 'DRREDDY.NS', symbol: 'DRREDDY', name: 'Dr. Reddy\'s' },
    { id: 'CIPLA.NS', symbol: 'CIPLA', name: 'Cipla' },
    { id: 'APOLLOPHARM.NS', symbol: 'APOLLOPHARM', name: 'Apollo Pharmacy' },
    { id: 'ZYDUSLIFE.NS', symbol: 'ZYDUSLIFE', name: 'Zydus Life' },
  ],
  'nifty auto': [
    { id: 'MARUTI.NS', symbol: 'MARUTI', name: 'Maruti Suzuki' },
    { id: 'TATAMOTORS.NS', symbol: 'TATAMOTORS', name: 'Tata Motors' },
    { id: 'MOTHERSUMI.NS', symbol: 'MOTHERSUMI', name: 'MotherSumi' },
    { id: 'BAJAJ-AUTO.NS', symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto' },
    { id: 'EICHERMOT.NS', symbol: 'EICHERMOT', name: 'Eicher Motors' },
  ],
  'nifty fmcg': [
    { id: 'HINDUNILVR.NS', symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
    { id: 'NESTLEIND.NS', symbol: 'NESTLEIND', name: 'Nestle India' },
    { id: 'ASIANPAINT.NS', symbol: 'ASIANPAINT', name: 'Asian Paints' },
    { id: 'DABUR.NS', symbol: 'DABUR', name: 'Dabur' },
    { id: 'BRITANNIA.NS', symbol: 'BRITANNIA', name: 'Britannia' },
  ],
  'nifty metal': [
    { id: 'TATASTEEL.NS', symbol: 'TATASTEEL', name: 'Tata Steel' },
    { id: 'JSWSTEEL.NS', symbol: 'JSWSTEEL', name: 'JSW Steel' },
    { id: 'HINDALCO.NS', symbol: 'HINDALCO', name: 'Hindalco' },
    { id: 'COALINDIA.NS', symbol: 'COALINDIA', name: 'Coal India' },
    { id: 'VEDL.NS', symbol: 'VEDL', name: 'Vedanta' },
  ],
  'nifty realty': [
    { id: 'DLF.NS', symbol: 'DLF', name: 'DLF' },
    { id: 'GODREJPROP.NS', symbol: 'GODREJPROP', name: 'Godrej Properties' },
    { id: 'SOBHA.NS', symbol: 'SOBHA', name: 'Sobha' },
    { id: 'PRESTIGE.NS', symbol: 'PRESTIGE', name: 'Prestige Estates' },
    { id: 'LODHA.NS', symbol: 'LODHA', name: 'Macrotech Development' },
  ],
  'nifty energy': [
    { id: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries' },
    { id: 'ONGC.NS', symbol: 'ONGC', name: 'Oil & Natural Gas' },
    { id: 'IOC.NS', symbol: 'IOC', name: 'Indian Oil' },
    { id: 'NTPC.NS', symbol: 'NTPC', name: 'NTPC' },
    { id: 'POWERGRID.NS', symbol: 'POWERGRID', name: 'Power Grid' },
  ],
  'nifty media': [
    { id: 'ZEE.NS', symbol: 'ZEE', name: 'Zee Entertainment' },
    { id: 'PVR.NS', symbol: 'PVR', name: 'PVR INOX' },
    { id: 'INOXLEISUR.NS', symbol: 'INOXLEISUR', name: 'INOX Leisure' },
    { id: 'DISHTV.NS', symbol: 'DISHTV', name: 'Dish TV' },
    { id: 'SUNTV.NS', symbol: 'SUNTV', name: 'Sun TV Network' },
  ],
  'nifty consumer': [
    { id: 'HINDUNILVR.NS', symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
    { id: 'NESTLEIND.NS', symbol: 'NESTLEIND', name: 'Nestle India' },
    { id: 'BRITANNIA.NS', symbol: 'BRITANNIA', name: 'Britannia' },
    { id: 'ITC.NS', symbol: 'ITC', name: 'ITC' },
    { id: 'GODREJCP.NS', symbol: 'GODREJCP', name: 'Godrej Consumer' },
  ],
  'nifty healthcare': [
    { id: 'APOLLOHOSP.NS', symbol: 'APOLLOHOSP', name: 'Apollo Hospitals' },
    { id: 'FORTIS.NS', symbol: 'FORTIS', name: 'Fortis Healthcare' },
    { id: 'MAXHEALTH.NS', symbol: 'MAXHEALTH', name: 'Max Healthcare' },
    { id: 'METROPOLIS.NS', symbol: 'METROPOLIS', name: 'Metropolis Healthcare' },
    { id: 'DRREDDY.NS', symbol: 'DRREDDY', name: 'Dr. Reddy\'s' },
  ],
}

// Get heatmap color based on performance - improved contrast
const getHeatmapColor = (change) => {
  if (change >= 2) return '#047857' // Emerald 700 - strong positive
  if (change >= 1) return '#059669' // Emerald 600 - positive
  if (change >= 0) return '#10b981' // Emerald 500 - mild positive
  if (change >= -1) return '#f87171' // Red 400 - mild negative
  if (change >= -2) return '#ef4444' // Red 500 - negative
  return '#dc2626' // Red 600 - strong negative
}

// Get text color for heatmap - ensure contrast
const getHeatmapTextColor = (change) => {
  // Use white text for all colors as they're all dark enough
  return 'text-white'
}

function SectorDashboard({ onSectorSelect, watchlist = [], onAddToWatchlist = null }) {
  const [view, setView] = useState('heatmap') // 'heatmap', 'list', 'chart'
  const [sortBy, setSortBy] = useState('change') // 'change', 'name', 'marketCap'
  const [hoveredSector, setHoveredSector] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sectorData, setSectorData] = useState(SECTOR_DATA)
  const [selectedSectorDetails, setSelectedSectorDetails] = useState(null)

  // Sort sectors based on selected criteria
  const sortedSectors = [...sectorData].sort((a, b) => {
    if (sortBy === 'change') return b.change - a.change
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'marketCap') return b.marketCap - a.marketCap
    return 0
  })

  // Calculate market summary
  const totalGainers = sectorData.filter(s => s.change > 0).length
  const totalLosers = sectorData.filter(s => s.change < 0).length
  const avgChange = sectorData.reduce((sum, s) => sum + s.change, 0) / sectorData.length
  const bestSector = sectorData.reduce((best, s) => s.change > best.change ? s : best, sectorData[0])

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setSectorData(prev => prev.map(sector => ({
        ...sector,
        change: sector.change + (Math.random() - 0.5) * 0.5
      })))
      setIsRefreshing(false)
    }, 1500)
  }

  const formatMarketCap = (value) => {
    if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L Cr`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K Cr`
    return value.toString()
  }

  // Handle sector selection and show constituent stocks
  const handleSectorClick = (sector) => {
    // Show sector details with constituent stocks (don't auto-add to watchlist)
    const constituents = SECTOR_STOCKS[sector.id] || []
    setSelectedSectorDetails({
      sector,
      constituents: constituents.map((stock, index) => ({
        ...stock,
        change: (Math.random() - 0.5) * 3, // Demo change percentage
        price: Math.random() * 5000 + 100
      }))
    })
  }

  // Check if stock is in watchlist
  const isInWatchlist = (stockId) => {
    return watchlist.some(s => s.id === stockId)
  }

  // Handle add single stock to watchlist
  const handleAddToWatchlist = (stock) => {
    if (onAddToWatchlist) {
      onAddToWatchlist(stock)
    }
  }

  // Handle add all stocks to watchlist
  const handleAddAllToWatchlist = () => {
    if (onSectorSelect && selectedSectorDetails) {
      onSectorSelect(selectedSectorDetails.sector)
    }
  }

  // Close sector details panel
  const closeSectorDetails = () => {
    setSelectedSectorDetails(null)
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
            title="Refresh data"
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
          className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4"
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
          className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4"
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
          className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4"
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
          className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4"
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
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
          className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6"
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
                onClick={() => handleSectorClick(sector)}
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
                      <p className="text-xs mt-1">Click to add stocks</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Interactive Hint */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-textSecondary">
            <span className="px-2 py-1 bg-surfaceLight rounded text-xs">Hover</span>
            <span>or</span>
            <span className="px-2 py-1 bg-surfaceLight rounded text-xs">Click</span>
            <span>on tiles to view details and add stocks</span>
          </div>

          {/* Heatmap Legend - Fixed with Tailwind classes */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-textSecondary mb-2">Performance Scale</p>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="px-2 py-1 rounded text-xs text-white font-medium" style={{ backgroundColor: '#dc2626' }}>-2%</span>
              <span className="text-textSecondary">to</span>
              <span className="px-2 py-1 rounded text-xs text-white font-medium" style={{ backgroundColor: '#ef4444' }}>-1%</span>
              <span className="text-textSecondary">|</span>
              <span className="px-2 py-1 rounded text-xs text-white font-medium" style={{ backgroundColor: '#10b981' }}>0%</span>
              <span className="text-textSecondary">to</span>
              <span className="px-2 py-1 rounded text-xs text-white font-medium" style={{ backgroundColor: '#059669' }}>+1%</span>
              <span className="text-textSecondary">|</span>
              <span className="px-2 py-1 rounded text-xs text-white font-medium" style={{ backgroundColor: '#047857' }}>+2%+</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* List View */}
      {view === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl overflow-hidden"
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
                onClick={() => handleSectorClick(sector)}
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
          className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6"
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

      {/* Sector Details Panel - Constituent Stocks with Watchlist */}
      <AnimatePresence>
        {selectedSectorDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getHeatmapColor(selectedSectorDetails.sector.change) }}
                />
                <div>
                  <h3 className="text-lg font-semibold">{selectedSectorDetails.sector.name}</h3>
                  <p className="text-sm text-textSecondary">
                    {selectedSectorDetails.constituents.length} constituents • Click star to add individual stocks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddAllToWatchlist}
                  className="px-3 py-1.5 rounded-lg bg-terminal-green/20 text-terminal-green text-sm font-medium flex items-center gap-2 hover:bg-terminal-green/30 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Add All to Watchlist
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeSectorDetails}
                  className="p-2 rounded-lg bg-surfaceLight hover:bg-surface transition-colors"
                >
                  <X className="w-4 h-4 text-textSecondary" />
                </motion.button>
              </div>
            </div>

            {/* Constituent Stocks */}
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedSectorDetails.constituents.map((stock, index) => {
                  const inWatchlist = isInWatchlist(stock.id)
                  const isPositive = stock.change >= 0
                  
                  return (
                    <motion.div
                      key={stock.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-terminal-bg-light rounded-xl hover:bg-surfaceLight/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isPositive 
                            ? 'bg-terminal-green/20 text-terminal-green' 
                            : 'bg-terminal-red/20 text-terminal-red'
                        }`}>
                          {stock.symbol.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{stock.symbol}</p>
                          <p className="text-xs text-textSecondary truncate max-w-[120px]">{stock.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="text-sm font-mono font-medium">₹{stock.price.toFixed(2)}</p>
                          <p className={`text-xs font-mono ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
                            {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                          </p>
                        </div>
                        
                        {/* Add to Watchlist Button */}
                        {onAddToWatchlist && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddToWatchlist(stock)}
                            disabled={inWatchlist}
                            className={`p-2 rounded-lg transition-all ${
                              inWatchlist
                                ? 'text-textSecondary cursor-not-allowed'
                                : 'text-terminal-green hover:bg-terminal-green/20 opacity-0 group-hover:opacity-100'
                            }`}
                            title={inWatchlist ? 'Already in watchlist' : 'Add to watchlist'}
                          >
                            {inWatchlist ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Star className="w-4 h-4" />
                            )}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default SectorDashboard
