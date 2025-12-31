import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, PieChart, Wallet, ArrowUpRight, ArrowDownRight, X, Search, Calendar, Tag } from 'lucide-react'
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

// Load portfolio from localStorage
const loadPortfolio = () => {
  const saved = localStorage.getItem('marketzen_portfolio')
  return saved ? JSON.parse(saved) : []
}

// Save portfolio to localStorage
const savePortfolio = (portfolio) => {
  localStorage.setItem('marketzen_portfolio', JSON.stringify(portfolio))
}

// Common stocks for quick add
const QUICK_STOCKS = [
  { id: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries' },
  { id: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy Services' },
  { id: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { id: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { id: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India' },
  { id: 'INFY.NS', symbol: 'INFY', name: 'Infosys' },
  { id: 'BAJFINANCE.NS', symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { id: 'BHARTIARTL.NS', symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function Portfolio({ onStockSelect }) {
  const [holdings, setHoldings] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHolding, setEditingHolding] = useState(null)
  const [allocationView, setAllocationView] = useState('value') // 'value' or 'count'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Add/Edit form state
  const [formData, setFormData] = useState({
    stockId: '',
    symbol: '',
    name: '',
    shares: 0,
    avgCost: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    tags: []
  })

  // Load portfolio on mount
  useEffect(() => {
    const portfolio = loadPortfolio()
    setHoldings(portfolio)
    setLoading(false)
  }, [])

  // Calculate portfolio metrics
  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || h.shares * h.avgCost), 0)
  const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  // Calculate sector allocation (simplified based on stock symbols)
  const getSector = (symbol) => {
    const finance = ['HDFCBANK', 'ICICIBANK', 'SBIN', 'BAJFINANCE', 'KOTAKBANK']
    const tech = ['TCS', 'INFY', 'WIPRO', 'TECHM']
    const energy = ['RELIANCE', 'ONGC', 'IOC', 'NTPC']
    const telecom = ['BHARTIARTL']
    
    if (finance.some(s => symbol.includes(s))) return 'Finance'
    if (tech.some(s => symbol.includes(s))) return 'Technology'
    if (energy.some(s => symbol.includes(s))) return 'Energy'
    if (telecom.some(s => symbol.includes(s))) return 'Telecom'
    return 'Other'
  }

  const sectorAllocation = holdings.reduce((acc, h) => {
    const sector = getSector(h.symbol)
    const value = h.currentValue || (h.shares * h.avgCost)
    acc[sector] = (acc[sector] || 0) + value
    return acc
  }, {})

  const allocationData = Object.entries(sectorAllocation).map(([name, value]) => ({
    name,
    value,
    percentage: totalValue > 0 ? (value / totalValue * 100).toFixed(1) : 0
  }))

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const handleAddHolding = () => {
    if (!formData.stockId || formData.shares <= 0 || formData.avgCost <= 0) return
    
    const newHolding = {
      id: formData.stockId,
      symbol: formData.symbol,
      name: formData.name,
      shares: parseFloat(formData.shares),
      avgCost: parseFloat(formData.avgCost),
      purchaseDate: formData.purchaseDate,
      currentPrice: parseFloat(formData.avgCost), // Will update with real data
      currentValue: parseFloat(formData.shares) * parseFloat(formData.avgCost),
      gain: 0,
      gainPercent: 0,
      tags: formData.tags
    }
    
    const updated = [...holdings, newHolding]
    setHoldings(updated)
    savePortfolio(updated)
    closeModal()
  }

  const handleUpdatePrice = (stockId, currentPrice) => {
    setHoldings(prev => prev.map(h => {
      if (h.id === stockId) {
        const currentValue = h.shares * currentPrice
        const costBasis = h.shares * h.avgCost
        return {
          ...h,
          currentPrice,
          currentValue,
          gain: currentValue - costBasis,
          gainPercent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0
        }
      }
      return h
    }))
  }

  const handleDeleteHolding = (id) => {
    const updated = holdings.filter(h => h.id !== id)
    setHoldings(updated)
    savePortfolio(updated)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingHolding(null)
    setFormData({
      stockId: '',
      symbol: '',
      name: '',
      shares: 0,
      avgCost: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      tags: []
    })
    setSearchQuery('')
  }

  const handleSelectStock = (stock) => {
    setFormData(prev => ({
      ...prev,
      stockId: stock.id,
      symbol: stock.symbol,
      name: stock.name
    }))
    setSearchQuery(stock.name)
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-textSecondary">Loading portfolio...</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">My Portfolio</h2>
          <p className="text-textSecondary text-sm">Track your investments</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-lg bg-primary text-white font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Holding
        </motion.button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-textSecondary">Total Value</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
          <p className="text-sm text-textSecondary mt-1">
            {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg ${totalGain >= 0 ? 'bg-positive/20' : 'bg-negative/20'} flex items-center justify-center`}>
              {totalGain >= 0 ? (
                <TrendingUp className="w-5 h-5 text-positive" />
              ) : (
                <TrendingDown className="w-5 h-5 text-negative" />
              )}
            </div>
            <span className="text-sm text-textSecondary">Total Gain/Loss</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${totalGain >= 0 ? 'text-positive' : 'text-negative'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
            </p>
            <span className={`text-sm font-medium ${totalGainPercent >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatPercent(totalGainPercent)}
            </span>
          </div>
          <p className="text-sm text-textSecondary mt-1">Cost basis: {formatCurrency(totalCost)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-textSecondary">Diversification</span>
          </div>
          <p className="text-3xl font-bold">{allocationData.length}</p>
          <p className="text-sm text-textSecondary mt-1">Sectors represented</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Holdings</h3>
            <span className="text-sm text-textSecondary">{holdings.length} positions</span>
          </div>

          {holdings.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Wallet className="w-12 h-12 text-textSecondary mx-auto mb-4 opacity-50" />
              <p className="text-textSecondary mb-4">No holdings yet</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Holding
              </motion.button>
            </div>
          ) : (
            holdings.map((holding, index) => (
              <motion.div
                key={holding.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-4 hover:bg-surfaceLight/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{holding.symbol.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{holding.symbol}</h4>
                      <p className="text-sm text-textSecondary">{holding.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-textSecondary">{holding.shares} shares</span>
                        <span className="text-xs text-textSecondary">•</span>
                        <span className="text-xs text-textSecondary">Avg: {formatCurrency(holding.avgCost)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-mono font-medium">{formatCurrency(holding.currentValue || (holding.shares * holding.avgCost))}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      (holding.gain || 0) >= 0 ? 'text-positive' : 'text-negative'
                    }`}>
                      {(holding.gain || 0) >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span className="text-sm font-medium">
                        {formatCurrency(holding.gain || 0)} ({formatPercent(holding.gainPercent || 0)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-textSecondary">
                    <span>Current: {formatCurrency(holding.currentPrice || holding.avgCost)}</span>
                    <span>Cost: {formatCurrency(holding.shares * holding.avgCost)}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onStockSelect({ id: holding.id, symbol: holding.symbol, name: holding.name })}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteHolding(holding.id)}
                      className="p-1.5 rounded-lg bg-negative/10 text-negative hover:bg-negative/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Allocation Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Allocation</h3>
            <div className="flex items-center gap-1 bg-surfaceLight rounded-lg p-1">
              <button
                onClick={() => setAllocationView('value')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  allocationView === 'value' ? 'bg-primary text-white' : 'text-textSecondary'
                }`}
              >
                Value
              </button>
              <button
                onClick={() => setAllocationView('count')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  allocationView === 'count' ? 'bg-primary text-white' : 'text-textSecondary'
                }`}
              >
                Count
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            {allocationData.length > 0 ? (
              <>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey={allocationView === 'value' ? 'value' : 'name'}
                        nameKey="name"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(21, 26, 33, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [
                          allocationView === 'value' ? formatCurrency(value) : value,
                          name
                        ]}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {allocationData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-textSecondary">
                Add holdings to see allocation
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="glass rounded-2xl p-6">
            <h4 className="text-sm font-medium mb-4">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-textSecondary">Avg Cost/Share</span>
                <span className="text-sm font-mono">{formatCurrency(totalCost / holdings.reduce((s, h) => s + h.shares, 0) || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-textSecondary">Best Performer</span>
                <span className="text-sm font-mono text-positive">
                  {holdings.length > 0 ? holdings.reduce((best, h) => (h.gainPercent > (best?.gainPercent || 0) ? h : best), null)?.symbol || 'N/A' : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-textSecondary">Worst Performer</span>
                <span className="text-sm font-mono text-negative">
                  {holdings.length > 0 ? holdings.reduce((worst, h) => (h.gainPercent < (worst?.gainPercent || Infinity) ? h : worst), null)?.symbol || 'N/A' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Holding Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Add Holding</h3>
                  <button onClick={closeModal} className="p-2 rounded-lg hover:bg-surfaceLight">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Stock Search */}
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">Select Stock</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a stock..."
                      className="w-full pl-10 pr-4 py-3 bg-surfaceLight rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  
                  {searchQuery && !formData.stockId && (
                    <div className="absolute z-10 w-full mt-1 glass rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {QUICK_STOCKS.filter(s => 
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(stock => (
                        <button
                          key={stock.id}
                          onClick={() => handleSelectStock(stock)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-surfaceLight transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{stock.symbol.substring(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stock.symbol}</p>
                            <p className="text-xs text-textSecondary">{stock.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.stockId && (
                    <div className="mt-2 p-3 bg-surfaceLight rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{formData.symbol.substring(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{formData.symbol}</p>
                          <p className="text-xs text-textSecondary">{formData.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, stockId: '', symbol: '', name: '' }))
                          setSearchQuery('')
                        }}
                        className="p-1 hover:bg-surface rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Quantity and Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Number of Shares</label>
                    <input
                      type="number"
                      value={formData.shares || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, shares: e.target.value }))}
                      placeholder="e.g., 100"
                      className="w-full px-4 py-3 bg-surfaceLight rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Average Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.avgCost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, avgCost: e.target.value }))}
                      placeholder="e.g., 2500.00"
                      className="w-full px-4 py-3 bg-surfaceLight rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Purchase Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-surfaceLight rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Preview */}
                {formData.shares > 0 && formData.avgCost > 0 && (
                  <div className="p-4 bg-surfaceLight rounded-xl">
                    <p className="text-sm text-textSecondary mb-2">Investment Summary</p>
                    <div className="flex items-center justify-between">
                      <span className="text-textSecondary">Total Invested</span>
                      <span className="font-mono font-medium">{formatCurrency(formData.shares * formData.avgCost)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-surfaceLight text-textSecondary hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddHolding}
                  disabled={!formData.stockId || !formData.shares || !formData.avgCost}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    formData.stockId && formData.shares && formData.avgCost
                      ? 'bg-primary text-white'
                      : 'bg-surfaceLight text-textSecondary cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add to Portfolio
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Portfolio
