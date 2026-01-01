import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, TrendingUp, TrendingDown, PieChart as PieChartIcon, Wallet, ArrowUpRight, ArrowDownRight, X, Search, Calendar, ExternalLink } from 'lucide-react'
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { usePortfolio } from '../context/PortfolioContext'
import { useToast } from '../components/common/Toast'
import { formatCurrency, formatChange } from '../utils/formatters'
import { Spinner } from './common/LoadingSkeleton'

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
  const { 
    holdings: contextHoldings, 
    addHolding, 
    removeHolding, 
    calculatePortfolioMetrics 
  } = usePortfolio()

  const { toasts, removeToast, showSuccess, showInfo, showError } = useToast()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [allocationView, setAllocationView] = useState('value')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Form state for adding a holding with initial transaction
  const [formData, setFormData] = useState({
    stockId: '',
    symbol: '',
    name: '',
    shares: 0,
    avgCost: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    tags: []
  })

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  // Calculate portfolio metrics with current prices
  const portfolioMetrics = useMemo(() => {
    return calculatePortfolioMetrics({})
  }, [calculatePortfolioMetrics])

  const { totalCurrentValue, totalGainLoss, totalGainLossPercent } = portfolioMetrics

  // Calculate sector allocation
  const getSector = (symbol) => {
    const finance = ['HDFCBANK', 'ICICIBANK', 'SBIN', 'BAJFINANCE', 'KOTAKBANK', 'AXISBANK']
    const tech = ['TCS', 'INFY', 'WIPRO', 'TECHM', 'HCLTECH']
    const energy = ['RELIANCE', 'ONGC', 'IOC', 'NTPC']
    const telecom = ['BHARTIARTL']
    
    if (finance.some(s => symbol.includes(s))) return 'Finance'
    if (tech.some(s => symbol.includes(s))) return 'Technology'
    if (energy.some(s => symbol.includes(s))) return 'Energy'
    if (telecom.some(s => symbol.includes(s))) return 'Telecom'
    return 'Other'
  }

  const allocationData = useMemo(() => {
    const sectorAllocation = contextHoldings.reduce((acc, h) => {
      const sector = getSector(h.symbol)
      const value = h.currentValue || h.totalCost || 0
      acc[sector] = (acc[sector] || 0) + value
      return acc
    }, {})

    return Object.entries(sectorAllocation).map(([name, value]) => ({
      name,
      value,
      percentage: totalCurrentValue > 0 ? (value / totalCurrentValue * 100).toFixed(1) : 0
    }))
  }, [contextHoldings, totalCurrentValue])

  const formatPercent = (value) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const handleAddHolding = () => {
    if (!formData.stockId || formData.shares <= 0 || formData.avgCost <= 0) return

    const stockInfo = {
      symbol: formData.symbol,
      name: formData.name,
      sector: getSector(formData.symbol)
    }

    const result = addHolding(stockInfo)
    
    if (result.success) {
      showSuccess(`${formData.symbol} added to portfolio`)
      closeModal()
    } else {
      showError(result.message)
    }
  }

  const handleDeleteHolding = (id) => {
    const holding = contextHoldings.find(h => h.id === id)
    removeHolding(id)
    showInfo(`${holding?.symbol || 'Stock'} removed from portfolio`)
  }

  const closeModal = () => {
    setShowAddModal(false)
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

  // Handle stock click to navigate to dashboard
  const handleViewStock = (stock) => {
    if (onStockSelect) {
      onStockSelect({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name
      })
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64"
      >
        <Spinner size="2.5rem" />
        <p className="text-terminal-dim mt-4 font-mono">Loading portfolio...</p>
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
          <h2 className="text-2xl font-semibold">My Portfolio</h2>
          <p className="text-terminal-dim text-sm">Track your investments</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-lg bg-terminal-green text-terminal-bg font-medium flex items-center gap-2 hover:bg-terminal-green/90 transition-colors"
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
          className="bg-terminal-bg-secondary border border-terminal-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-terminal-green/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-terminal-green" />
            </div>
            <span className="text-sm text-terminal-dim">Total Value</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalCurrentValue)}</p>
          <p className="text-sm text-terminal-dim mt-1">
            {contextHoldings.length} holding{contextHoldings.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-terminal-bg-secondary border border-terminal-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg ${totalGainLoss >= 0 ? 'bg-terminal-green/20' : 'bg-terminal-red/20'} flex items-center justify-center`}>
              {totalGainLoss >= 0 ? (
                <TrendingUp className="w-5 h-5 text-terminal-green" />
              ) : (
                <TrendingDown className="w-5 h-5 text-terminal-red" />
              )}
            </div>
            <span className="text-sm text-terminal-dim">Total Gain/Loss</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </p>
            <span className={`text-sm font-medium ${totalGainLossPercent >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {formatPercent(totalGainLossPercent)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-terminal-bg-secondary border border-terminal-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-terminal-dim">Diversification</span>
          </div>
          <p className="text-3xl font-bold">{allocationData.length}</p>
          <p className="text-sm text-terminal-dim mt-1">Sectors represented</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Holdings</h3>
            <span className="text-sm text-terminal-dim">{contextHoldings.length} positions</span>
          </div>

          {contextHoldings.length === 0 ? (
            <div className="bg-terminal-bg-secondary border border-terminal-border rounded-2xl p-8 text-center">
              <Wallet className="w-12 h-12 text-terminal-dim mx-auto mb-4 opacity-50" />
              <p className="text-terminal-dim mb-4">No holdings yet</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-lg bg-terminal-green text-terminal-bg font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Holding
              </motion.button>
            </div>
          ) : (
            portfolioMetrics.holdings.map((holding, index) => (
              <motion.div
                key={holding.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-terminal-bg-secondary border border-terminal-border rounded-xl p-4 hover:bg-terminal-bg-light/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terminal-green/20 to-terminal-green/5 flex items-center justify-center cursor-pointer"
                         onClick={() => handleViewStock(holding)}>
                      <span className="text-sm font-bold text-terminal-green">{holding.symbol.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium cursor-pointer hover:text-terminal-green transition-colors"
                          onClick={() => handleViewStock(holding)}>
                        {holding.symbol}
                      </h4>
                      <p className="text-sm text-terminal-dim">{holding.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-terminal-dim">{holding.quantity} shares</span>
                        <span className="text-xs text-terminal-dim">•</span>
                        <span className="text-xs text-terminal-dim">Avg: {formatCurrency(holding.avgCost)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-mono font-medium">{formatCurrency(holding.currentValue)}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      holding.gainLoss >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                    }`}>
                      {holding.gainLoss >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span className="text-sm font-medium">
                        {formatCurrency(holding.gainLoss)} ({formatPercent(holding.gainLossPercent)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-terminal-dim">
                    <span>Current: {formatCurrency(holding.currentPrice)}</span>
                    <span>Cost: {formatCurrency(holding.totalCost)}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleViewStock(holding)}
                      className="p-1.5 rounded-lg bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20"
                      title="View on chart"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteHolding(holding.id)}
                      className="p-1.5 rounded-lg bg-terminal-red/10 text-terminal-red hover:bg-terminal-red/20"
                      title="Remove"
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
            <div className="flex items-center gap-1 bg-terminal-bg-light rounded-lg p-1">
              <button
                onClick={() => setAllocationView('value')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  allocationView === 'value' ? 'bg-terminal-green text-terminal-bg' : 'text-terminal-dim'
                }`}
              >
                Value
              </button>
              <button
                onClick={() => setAllocationView('count')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  allocationView === 'count' ? 'bg-terminal-green text-terminal-bg' : 'text-terminal-dim'
                }`}
              >
                Count
              </button>
            </div>
          </div>

          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-2xl p-6">
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
              <div className="h-48 flex items-center justify-center text-terminal-dim">
                Add holdings to see allocation
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-2xl p-6">
            <h4 className="text-sm font-medium mb-4">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-terminal-dim">Avg Cost/Share</span>
                <span className="text-sm font-mono">
                  {formatCurrency(portfolioMetrics.totalInvested / portfolioMetrics.holdings.reduce((s, h) => s + h.quantity, 0) || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-terminal-dim">Best Performer</span>
                <span className="text-sm font-mono text-terminal-green">
                  {portfolioMetrics.holdings.length > 0 
                    ? portfolioMetrics.holdings.reduce((best, h) => (h.gainLossPercent > (best?.gainLossPercent || 0) ? h : best), null)?.symbol || 'N/A'
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-terminal-dim">Worst Performer</span>
                <span className="text-sm font-mono text-terminal-red">
                  {portfolioMetrics.holdings.length > 0 
                    ? portfolioMetrics.holdings.reduce((worst, h) => (h.gainLossPercent < (worst?.gainLossPercent || Infinity) ? h : worst), null)?.symbol || 'N/A'
                    : 'N/A'}
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
              className="w-full max-w-lg bg-terminal-bg-secondary border border-terminal-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Add Holding</h3>
                  <button onClick={closeModal} className="p-2 rounded-lg hover:bg-terminal-bg-light">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Stock Search */}
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">Select Stock</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-dim" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a stock..."
                      className="w-full pl-10 pr-4 py-3 bg-terminal-bg-light rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
                    />
                  </div>
                  
                  {searchQuery && !formData.stockId && (
                    <div className="absolute z-10 w-full mt-1 bg-terminal-bg-secondary border border-terminal-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {QUICK_STOCKS.filter(s => 
                        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(stock => (
                        <button
                          key={stock.id}
                          onClick={() => handleSelectStock(stock)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-terminal-bg-light transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-terminal-green/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-terminal-green">{stock.symbol.substring(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stock.symbol}</p>
                            <p className="text-xs text-terminal-dim">{stock.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.stockId && (
                    <div className="mt-2 p-3 bg-terminal-bg-light rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-terminal-green/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-terminal-green">{formData.symbol.substring(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{formData.symbol}</p>
                          <p className="text-xs text-terminal-dim">{formData.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, stockId: '', symbol: '', name: '' }))
                          setSearchQuery('')
                        }}
                        className="p-1 hover:bg-terminal-bg rounded"
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
                      className="w-full px-4 py-3 bg-terminal-bg-light rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Average Cost (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.avgCost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, avgCost: e.target.value }))}
                      placeholder="e.g., 2500.00"
                      className="w-full px-4 py-3 bg-terminal-bg-light rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Purchase Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-dim" />
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-terminal-bg-light rounded-lg outline-none focus:ring-2 focus:ring-terminal-green/50"
                    />
                  </div>
                </div>

                {/* Preview */}
                {formData.shares > 0 && formData.avgCost > 0 && (
                  <div className="p-4 bg-terminal-bg-light rounded-xl">
                    <p className="text-sm text-terminal-dim mb-2">Investment Summary</p>
                    <div className="flex items-center justify-between">
                      <span className="text-terminal-dim">Total Invested</span>
                      <span className="font-mono font-medium">{formatCurrency(formData.shares * formData.avgCost)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-terminal-bg-light text-terminal-dim hover:bg-terminal-bg transition-colors"
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
                      ? 'bg-terminal-green text-terminal-bg'
                      : 'bg-terminal-bg-light text-terminal-dim cursor-not-allowed'
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
