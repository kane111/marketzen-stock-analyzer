import { motion } from 'framer-motion'
import { BarChart2, Activity, Copy, Check } from 'lucide-react'

// ==========================================
// STOCK HEADER - Unified Header Component
// Used across: Dashboard, TechnicalAnalysis, AdvancedCharting
// ==========================================
export function StockHeader({
  stock,
  stockData,
  onOpenAnalysis,
  onCopyData,
  copiedData,
  multiChartMode,
  onToggleMultiChart,
  priceChange,
  isPositive,
  onBack,
  showBackButton = false,
  className = ''
}) {
  if (!stockData) return null

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
    if (value >= 1e15) return `${(value / 1e15).toFixed(2)}Q`
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toLocaleString('en-US')
  }

  return (
    <div className={`flex-shrink-0 px-6 py-4 border-b border-terminal-border bg-terminal-panel ${className}`}>
      <div className="flex items-center gap-4">
        {/* Back Button (optional) */}
        {showBackButton && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-border transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </motion.button>
        )}

        {/* Stock Icon */}
        <div className="w-12 h-12 rounded bg-terminal-green/20 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold font-mono text-terminal-green">
            {stockData.symbol.substring(0, 2)}
          </span>
        </div>

        {/* Stock Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold truncate">{stockData.name}</h2>
            <span className="px-2 py-0.5 rounded text-xs bg-terminal-bg text-terminal-dim border border-terminal-border">
              NSE
            </span>
            <span className="text-sm text-terminal-dim font-mono">{stockData.symbol}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Multi Chart Toggle */}
            {onToggleMultiChart && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleMultiChart}
                className={`px-3 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                  multiChartMode 
                    ? 'bg-terminal-green text-terminal-bg border border-terminal-green' 
                    : 'bg-terminal-bg border border-terminal-border hover:border-terminal-dim'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                Multi
              </motion.button>
            )}

            {/* Analysis Button */}
            {onOpenAnalysis && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAnalysis}
                className="px-3 py-1 rounded text-xs bg-terminal-green/20 text-terminal-green border border-terminal-green/50 flex items-center gap-2 hover:bg-terminal-green/30 transition-colors"
              >
                <Activity className="w-3 h-3" />
                Analysis
              </motion.button>
            )}

            {/* Copy Data Button */}
            {onCopyData && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCopyData}
                className="p-1.5 rounded bg-terminal-bg border border-terminal-border hover:border-terminal-dim transition-colors"
                title="Copy Data"
              >
                {copiedData ? (
                  <Check className="w-3 h-3 text-terminal-green" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Price Display */}
        <div className="flex items-baseline gap-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-right"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono">
                {formatCurrency(stockData.current_price)}
              </span>
              <motion.div 
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono text-sm ${
                  isPositive ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
                }`}
              >
                {isPositive ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span className="font-bold">
                  {isPositive ? '+' : ''}{priceChange?.toFixed(2)}%
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        {[
          { label: 'OPEN', value: formatCurrency(stockData.open) },
          { label: 'HIGH', value: formatCurrency(stockData.day_high) },
          { label: 'LOW', value: formatCurrency(stockData.day_low) },
          { label: 'VOL', value: formatNumber(stockData.volume) }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-terminal-bg border border-terminal-border rounded p-3"
          >
            <p className="text-xs text-terminal-dim mb-1">{stat.label}</p>
            <p className="font-mono font-medium">{stat.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default StockHeader
