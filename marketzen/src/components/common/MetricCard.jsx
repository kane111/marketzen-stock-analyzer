import { useState } from 'react'
import { Info } from 'lucide-react'

/**
 * MetricCard - A reusable card for displaying financial metrics
 * 
 * UX Improvements:
 * - Increased padding for better breathing room
 * - Better hover states and transitions
 * - Improved tooltip with better positioning
 * - Clearer visual hierarchy between label and value
 */
export function MetricCard({ 
  label, 
  value, 
  tooltip, 
  isLarge = false, 
  variant = 'default',
  className = '' 
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  const getValueColor = () => {
    if (variant === 'positive') return 'text-terminal-green'
    if (variant === 'negative') return 'text-terminal-red'
    return 'text-terminal-text'
  }

  return (
    <div 
      className={`
        bg-terminal-bg-secondary 
        border border-terminal-border 
        rounded-lg 
        p-3 
        relative 
        transition-all duration-200
        hover:border-terminal-dim
        ${isLarge ? 'col-span-2' : ''} 
        ${className}
      `}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <p className="text-xs text-terminal-dim flex items-center gap-1 mb-1.5">
        {label}
        {tooltip && (
          <span className="cursor-help text-terminal-dim hover:text-terminal-text transition-colors">
            <Info className="w-3 h-3" />
          </span>
        )}
      </p>
      <p className={`font-mono font-medium ${isLarge ? 'text-lg' : 'text-base'} ${getValueColor()}`}>
        {value || 'N/A'}
      </p>
      
      {/* Improved tooltip with arrow and better visibility */}
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-terminal-bg-light border border-terminal-border rounded-lg p-3 text-xs text-terminal-text z-50 shadow-lg">
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-terminal-border" />
          {tooltip}
        </div>
      )}
    </div>
  )
}

/**
 * DataCard - A general purpose card for displaying labeled data
 * 
 * UX Improvements:
 * - Increased padding for better readability
 * - Consistent spacing and alignment
 */
export function DataCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = 'text-terminal-green',
  className = '' 
}) {
  return (
    <div className={`
      bg-terminal-bg-secondary 
      border border-terminal-border 
      rounded-lg 
      p-4 
      transition-all duration-200
      hover:border-terminal-dim
      ${className}
    `}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        <p className="text-xs text-terminal-dim uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-xl font-bold font-mono">{value}</p>
    </div>
  )
}

/**
 * StatCard - Compact stat display for headers and summaries
 */
export function StatCard({ 
  label, 
  value, 
  className = '' 
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-xs text-terminal-dim uppercase tracking-wide">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  )
}

/**
 * LabelValue - Simple label-value pair for inline display
 */
export function LabelValue({ 
  label, 
  value, 
  labelColor = 'text-terminal-dim',
  valueColor = 'text-terminal-text',
  className = '' 
}) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className={`text-xs uppercase tracking-wide ${labelColor}`}>{label}</span>
      <span className={`font-mono ${valueColor}`}>{value}</span>
    </div>
  )
}

export default MetricCard
