import { motion } from 'framer-motion'

// ==========================================
// TIMEFRAME SELECTOR - Unified Time Range Picker
// Used across: ChartWrapper, TechnicalAnalysis, StockComparison
// ==========================================
export function TimeframeSelector({ 
  timeframes, 
  selected, 
  onSelect,
  className = '',
  variant = 'default' // 'default' | 'comparison' | 'compact'
}) {
  const variants = {
    default: {
      container: 'flex items-center gap-1 p-1 bg-terminal-bg-secondary rounded-lg border border-terminal-border',
      active: 'bg-terminal-green text-terminal-bg shadow-lg',
      inactive: 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg-light'
    },
    comparison: {
      container: 'flex items-center gap-2 flex-wrap',
      active: 'bg-primary text-white',
      inactive: 'bg-surfaceLight text-textSecondary hover:bg-surface'
    },
    compact: {
      container: 'flex items-center gap-1',
      active: 'bg-terminal-green text-terminal-bg',
      inactive: 'bg-terminal-bg border border-terminal-border text-terminal-dim hover:text-terminal-text'
    }
  }
  
  const currentVariant = variants[variant] || variants.default
  
  return (
    <div className={`${currentVariant.container} ${className}`}>
      {timeframes.map((tf) => (
        <motion.button
          key={tf.label}
          onClick={() => onSelect(tf)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            selected.label === tf.label
              ? currentVariant.active
              : currentVariant.inactive
          }`}
        >
          {tf.label}
        </motion.button>
      ))}
    </div>
  )
}

// Main chart timeframes
export const CHART_TIMEFRAMES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '1W', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1h' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' }
]

// Technical Analysis timeframes
export const TA_TIMEFRAMES = [
  { label: '1M', range: '1mo', interval: '1h' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' }
]

// Stock Comparison timeframes
export const COMPARE_TIMEFRAMES = [
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' }
]

// Multi-chart timeframes
export const MULTI_CHART_TIMEFRAMES = [
  { label: '1H', range: '1d', interval: '15m', type: 'intraday' },
  { label: '4H', range: '5d', interval: '1h', type: 'intraday' },
  { label: '1D', range: '1mo', interval: '1d', type: 'daily' },
  { label: '1W', range: '3mo', interval: '1wk', type: 'weekly' }
]

export default TimeframeSelector
