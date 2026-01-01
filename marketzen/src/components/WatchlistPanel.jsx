import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Star, TrendingUp, TrendingDown, Eye, MoreVertical, X, Check, Edit2, FolderPlus, Folder, GripVertical } from 'lucide-react'
import { useWatchlist } from '../context/WatchlistContext'

// Common stocks for quick add
const QUICK_STOCKS = [
  { id: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries', price: 2850.50, change: 1.25 },
  { id: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy Services', price: 4120.75, change: -0.45 },
  { id: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1680.25, change: 0.85 },
  { id: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank', price: 985.40, change: 1.12 },
  { id: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India', price: 725.80, change: 2.30 },
  { id: 'INFY.NS', symbol: 'INFY', name: 'Infosys', price: 1520.60, change: -0.75 },
  { id: 'BAJFINANCE.NS', symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 6890.45, change: 1.55 },
  { id: 'BHARTIARTL.NS', symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1250.30, change: 0.95 },
]

function WatchlistPanel({ onStockSelect }) {
  const {
    watchlists,
    activeWatchlist,
    setActiveWatchlist,
    createWatchlist,
    deleteWatchlist,
    renameWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlistNames,
    isInWatchlist
  } = useWatchlist()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState(null)
  const [newWatchlistName, setNewWatchlistName] = useState('')
  const [renameMode, setRenameMode] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const watchlistNames = getWatchlistNames()
  const currentStocks = watchlists[activeWatchlist] || []

  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) {
      showNotification('Please enter a watchlist name', 'error')
      return
    }
    const result = createWatchlist(newWatchlistName.trim())
    if (result.success) {
      setActiveWatchlist(newWatchlistName.trim())
      showNotification(result.message, 'success')
      setNewWatchlistName('')
      setShowCreateModal(false)
    } else {
      showNotification(result.message, 'error')
    }
  }

  const handleDeleteWatchlist = (name) => {
    const result = deleteWatchlist(name)
    showNotification(result.message, result.success ? 'info' : 'error')
    setShowContextMenu(null)
  }

  const handleRenameWatchlist = (oldName) => {
    if (!renameValue.trim()) {
      setRenameMode(null)
      return
    }
    const result = renameWatchlist(oldName, renameValue.trim())
    if (result.success) {
      showNotification(result.message, 'success')
      setRenameMode(null)
      setRenameValue('')
    } else {
      showNotification(result.message, 'error')
    }
  }

  const handleAddStock = (stock) => {
    const result = addToWatchlist(stock)
    showNotification(result.message, result.success ? 'success' : 'error')
    setSearchQuery('')
  }

  const handleRemoveStock = (symbol) => {
    removeFromWatchlist(symbol)
    showNotification('Removed from watchlist', 'info')
  }

  const handleSelectStock = (stock) => {
    if (onStockSelect) {
      onStockSelect({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name
      })
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price)
  }

  const formatChange = (change) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/30' :
              notification.type === 'error' ? 'bg-terminal-red/20 text-terminal-red border border-terminal-red/30' :
              'bg-terminal-green/20 text-terminal-green border border-terminal-green/30'
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Watchlist</h2>
          <p className="text-terminal-dim text-sm">Track stocks you're watching</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-lg bg-terminal-green text-terminal-bg font-medium flex items-center gap-2 hover:bg-terminal-green/90 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            New List
          </motion.button>
        </div>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {watchlistNames.map((name) => (
          <div key={name} className="relative">
            {renameMode === name ? (
              <div className="flex items-center gap-1 px-3 py-2 bg-terminal-green/20 rounded-lg">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameWatchlist(name)
                    if (e.key === 'Escape') setRenameMode(null)
                  }}
                  className="bg-transparent outline-none text-sm w-24"
                  autoFocus
                />
                <button onClick={() => handleRenameWatchlist(name)}>
                  <Check className="w-4 h-4 text-terminal-green" />
                </button>
                <button onClick={() => setRenameMode(null)}>
                  <X className="w-4 h-4 text-terminal-red" />
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveWatchlist(name)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeWatchlist === name
                    ? 'bg-terminal-green text-terminal-bg'
                    : 'bg-terminal-bg-secondary text-terminal-dim hover:bg-terminal-bg-secondary/80'
                }`}
              >
                <Folder className={`w-4 h-4 ${activeWatchlist === name ? 'text-terminal-bg' : ''}`} />
                {name}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenameMode(name)
                    setRenameValue(name)
                  }}
                  className={`p-1 rounded hover:bg-terminal-dim/10 ${activeWatchlist === name ? 'text-terminal-bg/70' : 'text-terminal-dim'}`}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                {name !== 'Default' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteWatchlist(name)
                    }}
                    className={`p-1 rounded hover:bg-terminal-dim/10 ${activeWatchlist === name ? 'text-terminal-bg/70' : 'text-terminal-dim'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.button>
            )}
          </div>
        ))}
      </div>

      {/* Add Stock Section */}
      <div className="mb-6">
        <div className="relative">
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Add a stock to watchlist..."
            className="w-full pl-10 pr-4 py-3 bg-terminal-bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
          />
        </div>

        {searchQuery && (
          <div className="absolute z-10 w-full max-w-md mt-1 bg-terminal-bg-secondary/95 backdrop-blur-xl rounded-xl overflow-hidden max-h-48 overflow-y-auto border border-terminal-border">
            {QUICK_STOCKS.filter(s => 
              s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
            ).filter(s => !isInWatchlist(s.symbol)).map(stock => (
              <button
                key={stock.id}
                onClick={() => handleAddStock(stock)}
                className="w-full flex items-center justify-between p-3 hover:bg-terminal-bg-light transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-terminal-green/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-terminal-green">{stock.symbol.substring(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{stock.symbol}</p>
                    <p className="text-xs text-terminal-dim">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{formatPrice(stock.price)}</p>
                  <p className={`text-xs ${stock.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                    {formatChange(stock.change)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist Content */}
      <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-terminal-border">
        {currentStocks.length === 0 ? (
          <div className="p-8 text-center">
            <Eye className="w-12 h-12 text-terminal-dim mx-auto mb-4 opacity-50" />
            <p className="text-terminal-dim mb-4">No stocks in this watchlist</p>
            <p className="text-sm text-terminal-dim">Search above to add stocks to track</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {currentStocks.map((stock, index) => (
              <motion.div
                key={stock.id || stock.symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-terminal-bg-light/50 transition-colors group cursor-pointer"
                onClick={() => handleSelectStock(stock)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-terminal-green/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-terminal-green">{stock.symbol.substring(0, 2)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{stock.symbol}</h4>
                    <p className="text-sm text-terminal-dim">{stock.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Simulated price data */}
                  <div className="text-right hidden sm:block">
                    <p className="font-mono font-medium">
                      {formatPrice(stock.price || 1500 + Math.random() * 2000)}
                    </p>
                    <p className={`text-sm font-medium ${(stock.change || (Math.random() - 0.5) * 3) >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {formatChange(stock.change || (Math.random() - 0.5) * 3)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelectStock(stock)}
                      className="p-2 rounded-lg bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20"
                      title="View on chart"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveStock(stock.symbol)
                      }}
                      className="p-2 rounded-lg bg-terminal-red/10 text-terminal-red hover:bg-terminal-red/20"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Watchlist Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-terminal-bg-secondary/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-terminal-border"
            >
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Create New Watchlist</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-terminal-bg-light">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <label className="text-sm font-medium mb-2 block">Watchlist Name</label>
                <input
                  type="text"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateWatchlist()
                  }}
                  placeholder="e.g., Favourites, Tech Stocks"
                  className="w-full px-4 py-3 bg-terminal-bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
                  autoFocus
                />
              </div>

              <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-terminal-bg-secondary text-terminal-dim hover:bg-terminal-bg transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateWatchlist}
                  className="px-6 py-2 rounded-lg bg-terminal-green text-terminal-bg font-medium"
                >
                  Create Watchlist
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default WatchlistPanel
