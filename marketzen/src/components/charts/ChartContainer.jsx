import { motion } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'

// ==========================================
// CHART CONTAINER - Chart Layout Wrapper
// ==========================================
export function ChartContainer({
  children,
  title,
  subtitle,
  headerActions,
  className = '',
  loading = false,
  error = null,
  onRefresh
}) {
  return (
    <div className={`bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl ${className}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-terminal-border">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {title}
            {subtitle && <span className="text-terminal-dim text-sm font-normal">{subtitle}</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          {onRefresh && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
              title="Refresh data"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="relative">
        {loading ? (
          <ChartLoadingState />
        ) : error ? (
          <ChartErrorState message={error} onRetry={onRefresh} />
        ) : (
          children
        )}
      </div>
    </div>
  )
}

// ==========================================
// CHART LOADING STATE
// ==========================================
function ChartLoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-terminal-green border-t-transparent rounded-full"
      />
    </div>
  )
}

// ==========================================
// CHART ERROR STATE
// ==========================================
function ChartErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <svg className="w-12 h-12 text-terminal-red mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-terminal-text mb-3">{message || 'Error loading chart data'}</p>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-4 py-2 bg-terminal-green text-terminal-bg rounded-lg text-sm font-medium"
        >
          Retry
        </motion.button>
      )}
    </div>
  )
}

// ==========================================
// PRICE DISPLAY - Stock Price Header
// ==========================================
export function PriceDisplay({
  symbol,
  name,
  price,
  change,
  changePercent,
  sector,
  exchange
}) {
  const isPositive = change >= 0
  
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold">{symbol}</h2>
          <div className="flex items-center gap-2 text-xs text-terminal-dim">
            <span>{name}</span>
            {sector && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 bg-terminal-bg-light rounded-full">{sector}</span>
              </>
            )}
            {exchange && (
              <>
                <span>•</span>
                <span>{exchange}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-2xl font-bold font-mono">{price}</p>
          <p className={`text-sm font-medium ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {isPositive ? '+' : ''}{change} ({isPositive ? '+' : ''}{changePercent}%)
          </p>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// CHART TOOLTIP - Custom Chart Tooltip
// ==========================================
export function ChartTooltip({ 
  active, 
  payload, 
  label, 
  formatter = (value) => value 
}) {
  if (!active || !payload || !payload.length) return null
  
  return (
    <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-terminal-dim mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-terminal-dim">{entry.name}:</span>
          <span className="text-terminal-text font-mono">{formatter(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ==========================================
// CHART LEGEND - Multi-Line Legend
// ==========================================
export function ChartLegend({ items, activeItems, onToggle }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onToggle?.(item.key)}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all text-sm ${
            activeItems[item.key]
              ? 'bg-terminal-bg-light text-terminal-text'
              : 'text-terminal-dim opacity-60'
          }`}
        >
          <span 
            className="w-3 h-0.5 rounded-full" 
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
          {activeItems[item.key] && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}

export default ChartContainer
