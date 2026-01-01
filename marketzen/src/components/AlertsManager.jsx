import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus, Trash2, Edit2, ChevronRight, X, TrendingUp, TrendingDown, Volume2, Percent, DollarSign, Check, BellOff, RefreshCw } from 'lucide-react'
import { useAlerts } from '../context/AlertsContext'

// Yahoo Finance quote summary endpoint
const YAHOO_QUOTE_SUMMARY = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary'
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://justfetch.itsvg.in/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.pages.dev/?',
  'https://proxy.cors.sh/'
]

const FUNDAMENTAL_MODULES = 'summaryDetail,defaultKeyStatistics,financialData'

function AlertsManager({ stock, currentStockData, onClose }) {
  const { 
    alerts, 
    alertTypes, 
    createAlert, 
    updateAlert, 
    deleteAlert, 
    toggleAlert,
    resetTriggeredAlert,
    clearAllTriggered,
    getAlertProximity,
    triggeredAlerts
  } = useAlerts()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAlert, setEditingAlert] = useState(null)
  const [stockAlerts, setStockAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [fundamentals, setFundamentals] = useState(null)

  // Filter alerts for current stock
  useEffect(() => {
    if (stock) {
      const filtered = alerts.filter(a => a.stockId === stock.id)
      setStockAlerts(filtered)
    }
  }, [alerts, stock])

  // Fetch fundamentals for the stock
  useEffect(() => {
    if (stock) {
      fetchFundamentals(stock.id)
    }
  }, [stock])

  const fetchFundamentals = async (symbol) => {
    setLoading(true)
    const url = `${YAHOO_QUOTE_SUMMARY}/${symbol}?modules=${FUNDAMENTAL_MODULES}`
    
    const tryFetchWithProxy = async (proxyIndex = 0) => {
      if (proxyIndex >= CORS_PROXIES.length) {
        throw new Error('All proxies failed')
      }
      
      const proxy = CORS_PROXIES[proxyIndex]
      
      try {
        const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) throw new Error(`Proxy ${proxyIndex + 1} failed`)
        return await response.json()
      } catch (err) {
        return tryFetchWithProxy(proxyIndex + 1)
      }
    }

    try {
      const data = await tryFetchWithProxy()
      if (data.quoteSummary?.result?.[0]) {
        setFundamentals(data.quoteSummary.result[0])
      }
    } catch (error) {
      console.error('Error fetching fundamentals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = (alertData) => {
    createAlert({
      stockId: stock.id,
      stockSymbol: stock.symbol,
      stockName: stock.name,
      ...alertData
    })
    setShowCreateModal(false)
  }

  const handleUpdateAlert = (id, updates) => {
    updateAlert(id, updates)
    setEditingAlert(null)
  }

  const formatCurrency = (value) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatNumber = (value) => {
    if (!value) return 'N/A'
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toLocaleString()
  }

  const getMetric = (path) => {
    if (!fundamentals) return null
    const keys = path.split('.')
    let value = fundamentals
    for (const key of keys) {
      value = value?.[key]
    }
    return value?.raw || value
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg bg-surfaceLight hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-2xl font-semibold">Price Alerts</h2>
            <p className="text-textSecondary text-sm">
              {stock ? `${stock.symbol} - ${stock.name}` : 'Manage all alerts'}
            </p>
          </div>
        </div>

        {stock && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Alert
          </motion.button>
        )}
      </div>

      {/* Quick Stats from Fundamentals */}
      {stock && fundamentals && (
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-textSecondary mb-3">Quick Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-textSecondary">Current Price</p>
              <p className="text-lg font-semibold">{formatCurrency(getMetric('financialData.currentPrice'))}</p>
            </div>
            <div>
              <p className="text-xs text-textSecondary">52W High</p>
              <p className="text-lg font-semibold">{formatCurrency(getMetric('summaryDetail.fiftyTwoWeekHighRaw'))}</p>
            </div>
            <div>
              <p className="text-xs text-textSecondary">52W Low</p>
              <p className="text-lg font-semibold">{formatCurrency(getMetric('summaryDetail.fiftyTwoWeekLowRaw'))}</p>
            </div>
            <div>
              <p className="text-xs text-textSecondary">Volume</p>
              <p className="text-lg font-semibold">{formatNumber(getMetric('summaryDetail.volume.raw'))}</p>
            </div>
          </div>
        </div>
      )}

      {/* Triggered Alerts Section */}
      {triggeredAlerts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-textSecondary uppercase tracking-wider">
              Recently Triggered ({triggeredAlerts.length})
            </h3>
            <button
              onClick={clearAllTriggered}
              className="text-xs text-textSecondary hover:text-text"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {triggeredAlerts.slice(0, 5).map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-lg p-3 flex items-center justify-between border border-positive/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-positive/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-positive" />
                  </div>
                  <div>
                    <p className="font-medium">{alert.stockSymbol}</p>
                    <p className="text-xs text-textSecondary">{alertTypes[alert.type]?.label} - {alert.targetValue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => resetTriggeredAlert(alert.id)}
                    className="text-xs px-2 py-1 bg-surfaceLight rounded hover:bg-surface"
                  >
                    Reset
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Active Alerts List */}
      <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-textSecondary uppercase tracking-wider">
            {stock ? `Alerts for ${stock.symbol}` : 'All Alerts'} ({stockAlerts.length})
          </h3>
        </div>

        {stockAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-textSecondary mx-auto mb-4 opacity-50" />
            <p className="text-textSecondary mb-4">No alerts set for this stock</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Create First Alert
            </motion.button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {stockAlerts.map((alert, index) => {
              const typeConfig = alertTypes[alert.type]
              const proximity = currentStockData && alert.stockId === currentStockData.symbol
                ? getAlertProximity(alert, currentStockData.current_price, currentStockData.previous_close)
                : null

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 flex items-center justify-between ${
                    alert.triggered ? 'bg-positive/5' : 'hover:bg-surfaceLight/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      typeConfig?.color === 'positive' ? 'bg-positive/20' :
                      typeConfig?.color === 'negative' ? 'bg-negative/20' :
                      'bg-amber-500/20'
                    }`}>
                      <span className={`text-lg ${
                        typeConfig?.color === 'positive' ? 'text-positive' :
                        typeConfig?.color === 'negative' ? 'text-negative' :
                        'text-amber-500'
                      }`}>
                        {typeConfig?.icon || '🔔'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{alert.stockSymbol}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          alert.enabled 
                            ? 'bg-positive/20 text-positive' 
                            : 'bg-surfaceLight text-textSecondary'
                        }`}>
                          {alert.enabled ? 'Active' : 'Disabled'}
                        </span>
                        {alert.triggered && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-positive/20 text-positive">
                            Triggered
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-textSecondary">
                        {typeConfig?.label} {alert.targetValue}
                        {alert.type.includes('pct') ? '%' : alert.type === 'volume_spike' ? '' : '₹'}
                      </p>
                      {proximity && (
                        <p className={`text-xs ${
                          proximity.reached ? 'text-positive' : 'text-textSecondary'
                        }`}>
                          {proximity.text}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        alert.enabled 
                          ? 'bg-positive/10 text-positive hover:bg-positive/20' 
                          : 'bg-surfaceLight text-textSecondary hover:bg-surface'
                      }`}
                      title={alert.enabled ? 'Disable' : 'Enable'}
                    >
                      {alert.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingAlert(alert)}
                      className="p-2 rounded-lg bg-surfaceLight text-textSecondary hover:bg-surface transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 rounded-lg bg-negative/10 text-negative hover:bg-negative/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateAlertModal
            stock={stock}
            currentPrice={currentStockData?.current_price}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateAlert}
          />
        )}
      </AnimatePresence>

      {/* Edit Alert Modal */}
      <AnimatePresence>
        {editingAlert && (
          <EditAlertModal
            alert={editingAlert}
            onClose={() => setEditingAlert(null)}
            onSubmit={(updates) => handleUpdateAlert(editingAlert.id, updates)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CreateAlertModal({ stock, currentPrice, onClose, onSubmit }) {
  const [alertType, setAlertType] = useState('price_above')
  const [targetValue, setTargetValue] = useState('')

  const alertTypes = [
    { id: 'price_above', label: 'Price Above', icon: TrendingUp, prefix: '₹' },
    { id: 'price_below', label: 'Price Below', icon: TrendingDown, prefix: '₹' },
    { id: 'pct_change_up', label: 'Change % Up', icon: Percent, prefix: '+', suffix: '%' },
    { id: 'pct_change_down', label: 'Change % Down', icon: Percent, prefix: '-', suffix: '%' },
    { id: 'volume_spike', label: 'Volume Above', icon: Volume2, suffix: '' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!targetValue) return

    onSubmit({
      type: alertType,
      targetValue: parseFloat(targetValue)
    })
  }

  const selectedType = alertTypes.find(t => t.id === alertType)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Create Alert for {stock?.symbol}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface rounded-lg">
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Type Selection */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-3">
              Alert Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {alertTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAlertType(type.id)}
                    className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${
                      alertType === type.id
                        ? 'bg-primary text-white'
                        : 'bg-surfaceLight text-textSecondary hover:bg-surface'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">
              Target Value
            </label>
            <div className="relative">
              {selectedType?.prefix && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">
                  {selectedType.prefix}
                </span>
              )}
              <input
                type="number"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={currentPrice ? `Current: ${currentPrice.toFixed(2)}` : 'Enter value'}
                className={`w-full ${selectedType?.prefix ? 'pl-8' : ''} ${selectedType?.suffix ? 'pr-8' : ''} bg-surfaceLight rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50`}
                required
              />
              {selectedType?.suffix && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary">
                  {selectedType.suffix}
                </span>
              )}
            </div>
            {currentPrice && alertType.startsWith('price') && (
              <p className="text-xs text-textSecondary mt-2">
                Current price: ₹{currentPrice.toFixed(2)}
                {alertType === 'price_above' && targetValue && (
                  <span className="text-positive ml-2">
                    ({(targetValue > currentPrice ? '+' : '') + ((targetValue - currentPrice) / currentPrice * 100).toFixed(2)}% from current)
                  </span>
                )}
                {alertType === 'price_below' && targetValue && (
                  <span className="text-negative ml-2">
                    ({((currentPrice - targetValue) / currentPrice * 100).toFixed(2)}% from current)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surfaceLight text-textSecondary rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg"
            >
              Create Alert
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function EditAlertModal({ alert, onClose, onSubmit }) {
  const [targetValue, setTargetValue] = useState(alert.targetValue.toString())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!targetValue) return

    onSubmit({
      targetValue: parseFloat(targetValue)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Edit Alert</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface rounded-lg">
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-lg p-4">
            <p className="text-sm text-textSecondary">Alert Type</p>
            <p className="font-medium">{alert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">
              Target Value
            </label>
            <input
              type="number"
              step="any"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-surfaceLight rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surfaceLight text-textSecondary rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg"
            >
              Save Changes
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AlertsManager
