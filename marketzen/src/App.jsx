import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, TrendingDown, X, Plus, Star, Clock, BarChart2, RefreshCw, ChevronDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import SearchOverlay from './components/SearchOverlay'
import Sparkline from './components/Sparkline'
import PriceCounter from './components/PriceCounter'
import TimeframeSelector from './components/TimeframeSelector'
import LoadingSkeleton from './components/LoadingSkeleton'
import MobileNav from './components/MobileNav'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

const DEFAULT_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' }
]

const TIMEFRAMES = [
  { label: '1H', days: 0.04, interval: 'minute' },
  { label: '1D', days: 1, interval: 'hourly' },
  { label: '1W', days: 7, interval: 'daily' },
  { label: '1M', days: 30, interval: 'daily' },
  { label: '1Y', days: 365, interval: 'daily' }
]

function App() {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('marketzen_watchlist')
    return saved ? JSON.parse(saved) : DEFAULT_ASSETS
  })
  
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [assetData, setAssetData] = useState(null)
  const [chartData, setChartData] = useState([])
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[1])
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [priceChange, setPriceChange] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileWatchlist, setShowMobileWatchlist] = useState(false)

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load first asset
  useEffect(() => {
    if (watchlist.length > 0 && !selectedAsset) {
      setSelectedAsset(watchlist[0])
    }
  }, [watchlist, selectedAsset])

  // Save watchlist
  useEffect(() => {
    localStorage.setItem('marketzen_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  const fetchAssetData = useCallback(async (asset) => {
    if (!asset) return
    
    try {
      const [marketRes, chartRes] = await Promise.all([
        fetch(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${asset.id}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`),
        fetch(`${COINGECKO_BASE}/coins/${asset.id}/market_chart?vs_currency=usd&days=${selectedTimeframe.days}&interval=${selectedTimeframe.interval}`)
      ])
      
      const marketData = await marketRes.json()
      const chartDataRaw = await chartRes.json()
      
      if (marketData.length > 0) {
        const data = marketData[0]
        setAssetData(data)
        setPriceChange(data.price_change_percentage_24h || 0)
      }
      
      // Transform chart data
      if (chartDataRaw.prices) {
        const transformed = chartDataRaw.prices.map(([timestamp, price]) => ({
          timestamp: new Date(timestamp),
          price,
          time: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }))
        setChartData(transformed)
      }
    } catch (error) {
      console.error('Error fetching asset data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedTimeframe])

  useEffect(() => {
    if (selectedAsset) {
      setLoading(true)
      fetchAssetData(selectedAsset)
    }
  }, [selectedAsset, selectedTimeframe, fetchAssetData])

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset)
    setShowMobileWatchlist(false)
  }

  const addToWatchlist = (asset) => {
    if (!watchlist.find(a => a.id === asset.id)) {
      setWatchlist(prev => [...prev, asset])
    }
    setSearchOpen(false)
  }

  const removeFromWatchlist = (e, assetId) => {
    e.stopPropagation()
    setWatchlist(prev => {
      const filtered = prev.filter(a => a.id !== assetId)
      if (selectedAsset?.id === assetId && filtered.length > 0) {
        setSelectedAsset(filtered[0])
      }
      return filtered
    })
  }

  const isPositive = priceChange >= 0

  return (
    <div className="min-h-screen bg-background text-text overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-40 glass px-4 md:px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold tracking-tight">MarketZen</h1>
            <p className="text-xs text-textSecondary">Asset Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchOpen(true)}
            className="glass px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surfaceLight transition-colors"
          >
            <Search className="w-4 h-4 text-textSecondary" />
            <span className="hidden sm:inline text-sm text-textSecondary">Search assets...</span>
            <kbd className="hidden md:inline px-2 py-0.5 text-xs bg-surfaceLight rounded text-textSecondary">⌘K</kbd>
          </motion.button>
          
          {isMobile && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileWatchlist(true)}
              className="glass p-2.5 rounded-lg"
            >
              <BarChart2 className="w-5 h-5 text-textSecondary" />
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className="pt-20 h-screen flex">
        {/* Watchlist Sidebar */}
        <AnimatePresence>
          {!isMobile && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed md:relative left-0 top-20 bottom-0 w-72 glass border-r border-white/5 overflow-y-auto z-30"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-textSecondary uppercase tracking-wider">Watchlist</h2>
                  <span className="text-xs text-textSecondary bg-surfaceLight px-2 py-1 rounded-full">{watchlist.length}</span>
                </div>
                
                <div className="space-y-2">
                  <AnimatePresence>
                    {watchlist.map((asset, index) => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleAssetSelect(asset)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedAsset?.id === asset.id 
                            ? 'bg-surfaceLight border border-primary/30' 
                            : 'hover:bg-surfaceLight border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                              selectedAsset?.id === asset.id 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-surface text-textSecondary'
                            }`}>
                              {asset.symbol.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{asset.symbol.toUpperCase()}</p>
                              <p className="text-xs text-textSecondary">{asset.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => removeFromWatchlist(e, asset.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface rounded-lg transition-all"
                          >
                            <X className="w-4 h-4 text-textSecondary hover:text-negative" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-mono text-sm">--</span>
                          <Sparkline assetId={asset.id} isPositive={true} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Watchlist Drawer */}
        <AnimatePresence>
          {isMobile && showMobileWatchlist && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileWatchlist(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed left-0 top-0 bottom-0 w-80 glass z-50 overflow-y-auto"
              >
                <div className="p-4 pt-20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-textSecondary uppercase tracking-wider">Watchlist</h2>
                    <button onClick={() => setShowMobileWatchlist(false)}>
                      <X className="w-5 h-5 text-textSecondary" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {watchlist.map((asset) => (
                      <motion.div
                        key={asset.id}
                        onClick={() => handleAssetSelect(asset)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          selectedAsset?.id === asset.id 
                            ? 'bg-surfaceLight border border-primary/30' 
                            : 'hover:bg-surfaceLight'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                            selectedAsset?.id === asset.id 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-surface text-textSecondary'
                          }`}>
                            {asset.symbol.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{asset.symbol.toUpperCase()}</p>
                            <p className="text-xs text-textSecondary">{asset.name}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 ml-0 md:ml-72 p-4 md:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingSkeleton key="loading" />
            ) : assetData ? (
              <motion.div
                key={assetData.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                {/* Asset Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={assetData.image} alt={assetData.name} className="w-16 h-16 rounded-full" />
                    <div>
                      <h2 className="text-2xl font-semibold">{assetData.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg text-textSecondary">{assetData.symbol.toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isPositive ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'
                        }`}>
                          Rank #{assetData.market_cap_rank || '--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="flex items-baseline gap-4">
                    <PriceCounter 
                      value={assetData.current_price} 
                      isPositive={isPositive}
                    />
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isPositive ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-mono font-medium">
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                      </span>
                      <span className="text-xs opacity-70">24h</span>
                    </motion.div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {[
                      { label: 'Market Cap', value: `$${(assetData.market_cap / 1e9).toFixed(2)}B` },
                      { label: '24h Volume', value: `$${(assetData.total_volume / 1e9).toFixed(2)}B` },
                      { label: 'Circulating', value: `${(assetData.circulating_supply / 1e6).toFixed(0)}M` },
                      { label: 'All Time High', value: `$${assetData.ath?.toLocaleString() || '--'}` }
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass p-4 rounded-xl"
                      >
                        <p className="text-xs text-textSecondary mb-1">{stat.label}</p>
                        <p className="font-mono font-medium">{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium">Price Chart</h3>
                    <TimeframeSelector 
                      timeframes={TIMEFRAMES}
                      selected={selectedTimeframe}
                      onSelect={setSelectedTimeframe}
                    />
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(21, 26, 33, 0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(12px)'
                          }}
                          labelStyle={{ color: '#9ca3af' }}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={isPositive ? '#10b981' : '#ef4444'}
                          strokeWidth={2}
                          fill="url(#colorPrice)"
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-textSecondary">Select an asset to view details</p>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav 
          watchlist={watchlist}
          selectedAsset={selectedAsset}
          onSelect={handleAssetSelect}
        />
      )}

      {/* Search Overlay */}
      <SearchOverlay 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={addToWatchlist}
      />
    </div>
  )
}

export default App
