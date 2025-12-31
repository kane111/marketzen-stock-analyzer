import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, RefreshCw, Wifi, WifiOff, Globe, Settings, Check } from 'lucide-react'

function MarketStatus({ marketStatus, lastUpdated, onRefresh }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshRate, setRefreshRate] = useState(60) // seconds
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const formatTimeAgo = (date) => {
    if (!date) return 'Never'
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusConfig = () => {
    switch (marketStatus) {
      case 'live':
        return {
          icon: Wifi,
          color: 'text-positive',
          bgColor: 'bg-positive/10',
          dotColor: 'bg-positive',
          label: 'Live',
          description: 'Market is open'
        }
      case 'post-market':
        return {
          icon: Wifi,
          color: 'text-amber-400',
          bgColor: 'bg-amber-400/10',
          dotColor: 'bg-amber-400',
          label: 'Post-Market',
          description: 'Extended hours trading'
        }
      case 'pre-market':
        return {
          icon: WifiOff,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          dotColor: 'bg-blue-400',
          label: 'Pre-Market',
          description: 'Before market open'
        }
      default:
        return {
          icon: Globe,
          color: 'text-textSecondary',
          bgColor: 'bg-surfaceLight',
          dotColor: 'bg-textSecondary',
          label: 'Closed',
          description: 'Market is closed'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Status Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          marketStatus === 'live' 
            ? 'bg-positive/10 hover:bg-positive/20' 
            : 'bg-surfaceLight hover:bg-surface'
        }`}
      >
        <div className="relative">
          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${statusConfig.dotColor} rounded-full ${
            marketStatus === 'live' ? 'animate-pulse' : ''
          }`} />
        </div>
        <span className={`text-sm font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        <Clock className="w-3.5 h-3.5 text-textSecondary" />
        <span className="text-xs text-textSecondary">
          {formatTimeAgo(lastUpdated)}
        </span>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            
            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-full mt-2 w-72 glass rounded-xl overflow-hidden shadow-xl z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center`}>
                    <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{statusConfig.label}</h4>
                    <p className="text-xs text-textSecondary">{statusConfig.description}</p>
                  </div>
                </div>
              </div>

              {/* Data Status */}
              <div className="p-4 border-b border-white/5">
                <h5 className="text-xs font-medium text-textSecondary uppercase tracking-wider mb-3">
                  Data Status
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-textSecondary">Last Updated</span>
                    <span className="text-sm font-mono">{formatTimeAgo(lastUpdated)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-textSecondary">Source</span>
                    <span className="text-sm font-mono">Yahoo Finance (NSE)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-textSecondary">Auto-refresh</span>
                    <span className="text-sm font-mono">
                      {marketStatus === 'live' ? `Every ${refreshRate}s` : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Market Hours Info */}
              <div className="p-4 border-b border-white/5">
                <h5 className="text-xs font-medium text-textSecondary uppercase tracking-wider mb-3">
                  Market Hours (IST)
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">Regular Session</span>
                    <span className="font-mono">09:15 - 15:30</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">Pre-Market</span>
                    <span className="font-mono">09:00 - 09:15</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">Post-Market</span>
                    <span className="font-mono">15:30 - 16:00</span>
                  </div>
                </div>
              </div>

              {/* Refresh Rate Settings */}
              <div className="p-4 border-b border-white/5">
                <h5 className="text-xs font-medium text-textSecondary uppercase tracking-wider mb-3">
                  Refresh Rate
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120].map((rate) => (
                    <motion.button
                      key={rate}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRefreshRate(rate)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        refreshRate === rate
                          ? 'bg-primary text-white'
                          : 'bg-surfaceLight text-textSecondary hover:bg-surface'
                      }`}
                    >
                      {rate}s
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary/10 text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
                </motion.button>
              </div>

              {/* Footer */}
              <div className="p-3 bg-surfaceLight/50 text-xs text-textSecondary text-center">
                {marketStatus === 'live' 
                  ? 'Data refreshes automatically during trading hours'
                  : 'Data will update when market reopens'}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MarketStatus
