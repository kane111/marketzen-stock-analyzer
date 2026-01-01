import { useState } from 'react'
import { Info } from 'lucide-react'

/**
 * MetricCard - A reusable card for displaying financial metrics
 * 
 * @param {string} label - The metric label
 * @param {string|number} value - The metric value to display
 * @param {string} tooltip - Optional tooltip text
 * @param {boolean} isLarge - Whether this is a large metric (spans 2 columns)
 * @param {string} variant - 'default', 'positive', 'negative' for value coloring
 * @param {string} className - Additional CSS classes
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
        rounded-lg p-2 
        relative 
        ${isLarge ? 'col-span-2' : ''} 
        ${className}
      `}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <p className="text-xs text-terminal-dim flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="cursor-help text-terminal-dim">
            <Info className="w-3 h-3" />
          </span>
        )}
      </p>
      <p className={`font-mono font-medium ${isLarge ? 'text-lg' : 'text-base'} ${getValueColor()}`}>
        {value || 'N/A'}
      </p>
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-terminal-bg-light border border-terminal-border rounded-lg p-2 text-xs text-terminal-dim z-10">
          {tooltip}
        </div>
      )}
    </div>
  )
}

/**
 * DataCard - A general purpose card for displaying labeled data
 * 
 * @param {string} label - The data label
 * @param {string|number|React.ReactNode} value - The data value
 * @param {string} icon - Optional icon component
 * @param {string} iconColor - Color class for the icon
 * @param {string} className - Additional CSS classes
 */
export function DataCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = 'text-terminal-green',
  className = '' 
}) {
  return (
    <div className={`bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        <p className="text-xs text-terminal-dim">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}

export default MetricCard
