import { motion } from 'framer-motion'

// ==========================================
// INDICATOR TOGGLE - Chart Indicator Switch
// ==========================================
export function IndicatorToggle({
  label,
  isActive,
  onToggle,
  color,
  disabled = false,
  className = ''
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
        isActive
          ? 'bg-terminal-green/20 border-terminal-green text-terminal-green shadow-lg shadow-terminal-green/10'
          : 'bg-terminal-bg-secondary/80 border-terminal-border text-terminal-dim hover:bg-terminal-bg-light hover:text-terminal-text hover:border-terminal-border/80'
      } ${className}`}
    >
      <span 
        className={`w-3 h-3 rounded-full shadow-sm transition-colors ${
          isActive ? 'ring-1 ring-terminal-green/50' : ''
        }`}
        style={{ backgroundColor: isActive ? color : '#4a4f52' }}
      />
      <span className="text-sm font-mono">{label}</span>
      {isActive && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="ml-auto w-5 h-5 rounded-full bg-terminal-green text-terminal-bg flex items-center justify-center text-xs font-bold"
        >
          ✓
        </motion.span>
      )}
    </button>
  )
}

// ==========================================
// INDICATOR TOGGLE LIST - Group of Indicators
// ==========================================
export function IndicatorToggleList({
  indicators,
  activeIndicators,
  onToggle,
  className = ''
}) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-2 flex-wrap ${className}`}>
      {indicators.map((indicator) => (
        <IndicatorToggle
          key={indicator.id}
          label={indicator.label}
          color={indicator.color}
          isActive={activeIndicators[indicator.id]}
          onToggle={() => onToggle?.(indicator.id)}
        />
      ))}
    </div>
  )
}

// Common indicator presets
export const DEFAULT_INDICATORS = [
  { id: 'smaShort', label: 'SMA 20', color: '#f59e0b' },
  { id: 'smaLong', label: 'SMA 50', color: '#8b5cf6' },
  { id: 'emaShort', label: 'EMA 12', color: '#10b981' },
  { id: 'emaLong', label: 'EMA 26', color: '#06b6d4' },
  { id: 'bollinger', label: 'Bollinger', color: '#ec4899' },
  { id: 'vwap', label: 'VWAP', color: '#f97316' },
  { id: 'atr', label: 'ATR', color: '#84cc16' },
  { id: 'stoch', label: 'Stochastic', color: '#6366f1' }
]

export default IndicatorToggle
