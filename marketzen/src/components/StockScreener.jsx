import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, ArrowUpDown, ChevronDown, X, Star, BarChart2 } from 'lucide-react'
import { useWatchlist } from '../context/WatchlistContext'
import { TerminalCheckbox } from './UI'
import { useToast } from '../components/common/Toast'
import { formatCurrency, formatChange, formatCompactNumber } from '../utils/formatters'

// Mock stock data for screening
const STOCK_DATABASE = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', price: 2850.50, change: 1.25, marketCap: 1900000, pe: 28.5, dividend: 0.8, volume: 8500000 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'Technology', price: 4120.75, change: -0.45, marketCap: 1500000, pe: 32.1, dividend: 1.2, volume: 3200000 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Finance', price: 1680.25, change: 0.85, marketCap: 1200000, pe: 24.8, dividend: 0.6, volume: 4500000 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Finance', price: 985.40, change: 1.12, marketCap: 680000, pe: 22.3, dividend: 0.4, volume: 28000000 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Finance', price: 725.80, change: 2.30, marketCap: 650000, pe: 18.5, dividend: 1.8, volume: 15000000 },
  { symbol: 'INFY', name: 'Infosys', sector: 'Technology', price: 1520.60, change: -0.75, marketCap: 630000, pe: 26.2, dividend: 1.5, volume: 5800000 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance', price: 6890.45, change: 1.55, marketCap: 420000, pe: 35.8, dividend: 0.2, volume: 1200000 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', price: 1250.30, change: 0.95, marketCap: 720000, pe: 42.1, dividend: 0.5, volume: 6500000 },
  { symbol: 'ITC', name: 'ITC Limited', sector: 'Consumer Goods', price: 450.25, change: -0.32, marketCap: 560000, pe: 21.4, dividend: 5.2, volume: 9800000 },
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Engineering', price: 3250.80, change: 0.68, marketCap: 450000, pe: 35.2, dividend: 1.1, volume: 2200000 },
  { symbol: 'WIPRO', name: 'Wipro Limited', sector: 'Technology', price: 520.45, change: -1.15, marketCap: 290000, pe: 24.5, dividend: 0.3, volume: 8500000 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'Technology', price: 1850.60, change: 0.42, marketCap: 250000, pe: 23.8, dividend: 1.8, volume: 3200000 },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Finance', price: 1120.35, change: 1.45, marketCap: 340000, pe: 20.1, dividend: 0.4, volume: 12500000 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Finance', price: 1920.75, change: 0.28, marketCap: 380000, pe: 26.5, dividend: 0.2, volume: 4200000 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Automobile', price: 10250.40, change: -0.85, marketCap: 320000, pe: 28.9, dividend: 1.5, volume: 850000 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Healthcare', price: 1680.25, change: 1.65, marketCap: 400000, pe: 35.2, dividend: 0.8, volume: 4800000 },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer Goods', price: 3520.80, change: 2.10, marketCap: 310000, pe: 85.5, dividend: 0.4, volume: 1800000 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Conglomerate', price: 4250.60, change: 3.25, marketCap: 480000, pe: 95.2, dividend: 0.1, volume: 4200000 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas', sector: 'Energy', price: 185.40, change: -0.55, marketCap: 230000, pe: 8.5, dividend: 6.8, volume: 22000000 },
  { symbol: 'COALINDIA', name: 'Coal India', sector: 'Energy', price: 520.30, change: 0.15, marketCap: 160000, pe: 10.2, dividend: 9.5, volume: 15000000 },
]

const SECTORS = ['All', 'Finance', 'Technology', 'Energy', 'Consumer Goods', 'Healthcare', 'Telecom', 'Engineering', 'Automobile', 'Conglomerate']

const SORT_OPTIONS = [
  { key: 'marketCap', label: 'Market Cap', direction: 'desc' },
  { key: 'price', label: 'Price', direction: 'desc' },
  { key: 'change', label: 'Day Change', direction: 'desc' },
  { key: 'pe', label: 'P/E Ratio', direction: 'asc' },
  { key: 'dividend', label: 'Dividend Yield', direction: 'desc' },
  { key: 'volume', label: 'Volume', direction: 'desc' },
]

function StockScreener({ onStockSelect }) {
  const { addToWatchlist, isInWatchlist } = useWatchlist()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('All')
  const [sortBy, setSortBy] = useState('marketCap')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'cards'

  // Filter criteria
  const [filters, setFilters] = useState({
    minMarketCap: 0,
    maxPe: 100,
    minDividend: 0,
    showGainersOnly: false,
    showLosersOnly: false,
  })

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    let result = STOCK_DATABASE.filter(stock => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!stock.symbol.toLowerCase().includes(query) &&
            !stock.name.toLowerCase().includes(query)) {
          return false
        }
      }

      // Sector filter
      if (selectedSector !== 'All' && stock.sector !== selectedSector) {
        return false
      }

      // Market cap filter
      if (stock.marketCap < filters.minMarketCap * 1000000) {
        return false
      }

      // P/E filter
      if (stock.pe > filters.maxPe) {
        return false
      }

      // Dividend filter
      if (stock.dividend < filters.minDividend) {
        return false
      }

      // Gainers/Losers filter
      if (filters.showGainersOnly && stock.change < 0) {
        return false
      }
      if (filters.showLosersOnly && stock.change > 0) {
        return false
      }

      return true
    })

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return result
  }, [searchQuery, selectedSector, sortBy, sortDirection, filters])

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDirection(SORT_OPTIONS.find(o => o.key === key)?.direction || 'desc')
    }
  }

  const handleAddToWatchlist = (stock) => {
    const result = addToWatchlist(stock)
    if (result.success) {
      showSuccess(result.message)
    } else {
      showError(result.message)
    }
  }

  const handleSelectStock = (stock) => {
    if (onStockSelect) {
      onStockSelect({
        id: `${stock.symbol}.NS`,
        symbol: stock.symbol,
        name: stock.name
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto"
    >
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className={`px-4 py-3 rounded-lg shadow-lg border flex items-center gap-2 ${
                  toast.type === 'success' ? 'bg-terminal-green/20 text-terminal-green border-terminal-green/30' :
                  toast.type === 'error' ? 'bg-terminal-red/20 text-terminal-red border-terminal-red/30' :
                  'bg-terminal-blue/20 text-terminal-blue border-terminal-blue/30'
                }`}
              >
                <span className="text-sm font-medium">{toast.message}</span>
                <button onClick={() => removeToast(toast.id)} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Stock Screener</h2>
          <p className="text-terminal-dim text-sm">Find stocks that match your criteria</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table' ? 'bg-terminal-green text-terminal-bg' : 'bg-terminal-bg-light text-terminal-dim'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'cards' ? 'bg-terminal-green text-terminal-bg' : 'bg-terminal-bg-light text-terminal-dim'
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stocks..."
            className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
          />
        </div>

        <div className="relative">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-10 bg-terminal-bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50 cursor-pointer"
          >
            {SECTORS.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-dim pointer-events-none" />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            showFilters ? 'bg-terminal-green text-terminal-bg' : 'bg-terminal-bg-light text-terminal-dim'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </motion.button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6 mb-6 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Min Market Cap (₹B)</label>
                <input
                  type="number"
                  value={filters.minMarketCap}
                  onChange={(e) => setFilters(prev => ({ ...prev, minMarketCap: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max P/E Ratio</label>
                <input
                  type="number"
                  value={filters.maxPe}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPe: parseFloat(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Min Dividend Yield (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={filters.minDividend}
                  onChange={(e) => setFilters(prev => ({ ...prev, minDividend: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-terminal-bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <TerminalCheckbox
                  label="Gainers Only"
                  checked={filters.showGainersOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, showGainersOnly: e.target.checked, showLosersOnly: false }))}
                />
                <TerminalCheckbox
                  label="Losers Only"
                  checked={filters.showLosersOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, showLosersOnly: e.target.checked, showGainersOnly: false }))}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-terminal-dim">
          Showing <span className="font-medium text-terminal-text">{filteredStocks.length}</span> stocks
        </p>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('symbol')}
                      className="flex items-center gap-1 text-sm font-medium text-terminal-dim hover:text-terminal-text"
                    >
                      Stock
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('price')}
                      className="flex items-center justify-end gap-1 text-sm font-medium text-terminal-dim hover:text-terminal-text"
                    >
                      Price
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('change')}
                      className="flex items-center justify-end gap-1 text-sm font-medium text-terminal-dim hover:text-terminal-text"
                    >
                      Change
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('marketCap')}
                      className="flex items-center justify-end gap-1 text-sm font-medium text-terminal-dim hover:text-terminal-text"
                    >
                      Market Cap
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('pe')}
                      className="flex items-center justify-end gap-1 text-sm font-medium text-terminal-dim hover:text-terminal-text"
                    >
                      P/E
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('dividend')}
                      className="flex items-center justify-end gap-1 text-sm font-medium text-terminal-dim hover:text-terminal-text"
                    >
                      Dividend
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock, index) => (
                  <motion.tr
                    key={stock.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 hover:bg-terminal-bg-light/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-terminal-green/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-terminal-green">{stock.symbol.substring(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-medium cursor-pointer hover:text-terminal-green"
                             onClick={() => handleSelectStock(stock)}>
                            {stock.symbol}
                          </p>
                          <p className="text-xs text-terminal-dim">{stock.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(stock.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${stock.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                        {formatChange(stock.change)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatCompactNumber(stock.marketCap)}</td>
                    <td className="px-4 py-3 text-right font-mono">{stock.pe.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right font-mono">{stock.dividend.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSelectStock(stock)}
                          className="p-1.5 rounded-lg bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20"
                          title="View"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAddToWatchlist(stock)}
                          disabled={isInWatchlist(stock.symbol)}
                          className={`p-1.5 rounded-lg ${
                            isInWatchlist(stock.symbol)
                              ? 'bg-terminal-bg-light text-terminal-dim cursor-not-allowed'
                              : 'bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20'
                          }`}
                          title="Add to watchlist"
                        >
                          <Star className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock, index) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4 hover:bg-terminal-bg-light/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-terminal-green/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-terminal-green">{stock.symbol.substring(0, 2)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium cursor-pointer hover:text-terminal-green"
                        onClick={() => handleSelectStock(stock)}>
                      {stock.symbol}
                    </h4>
                    <p className="text-xs text-terminal-dim">{stock.sector}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${stock.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {formatChange(stock.change)}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-xl font-bold">{formatCurrency(stock.price)}</p>
                <p className="text-sm text-terminal-dim">{formatCompactNumber(stock.marketCap)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="bg-terminal-bg-light rounded-lg p-2">
                  <p className="text-xs text-terminal-dim">P/E</p>
                  <p className="font-mono">{stock.pe.toFixed(1)}</p>
                </div>
                <div className="bg-terminal-bg-light rounded-lg p-2">
                  <p className="text-xs text-terminal-dim">Dividend</p>
                  <p className="font-mono">{stock.dividend.toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectStock(stock)}
                  className="flex-1 px-3 py-2 rounded-lg bg-terminal-green text-terminal-bg text-sm font-medium"
                >
                  View Chart
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddToWatchlist(stock)}
                  disabled={isInWatchlist(stock.symbol)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    isInWatchlist(stock.symbol)
                      ? 'bg-terminal-bg-light text-terminal-dim'
                      : 'bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20'
                  }`}
                >
                  <Star className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredStocks.length === 0 && (
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-8 text-center">
          <Search className="w-12 h-12 text-terminal-dim mx-auto mb-4 opacity-50" />
          <p className="text-terminal-dim mb-2">No stocks match your criteria</p>
          <p className="text-sm text-terminal-dim">Try adjusting your filters or search query</p>
        </div>
      )}
    </motion.div>
  )
}

export default StockScreener
