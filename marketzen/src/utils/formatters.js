// ============================================================================
// FORMATTING UTILITIES
// Common formatting functions used across the application
// ============================================================================

/**
 * Format a number as currency
 * @param {number} value - The value to format
 * @param {string} currency - Currency code (default: 'INR')
 * @param {boolean} showSymbol - Whether to show currency symbol (default: true)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'INR', showSymbol = true) {
  if (!value && value !== 0) return 'N/A'
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return formatter.format(value)
}

/**
 * Format a number with locale-appropriate separators
 * @param {number} value - The value to format
 * @param {boolean} useGrouping - Whether to use grouping separators (default: true)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, useGrouping = true) {
  if (!value && value !== 0) return 'N/A'
  return new Intl.NumberFormat('en-IN', {
    useGrouping,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Format a number with compact notation (K, M, B, T)
 * @param {number} value - The value to format
 * @returns {string} Compact formatted string
 */
export function formatCompactNumber(value) {
  if (!value && value !== 0) return 'N/A'
  
  if (value >= 1e15) return `${(value / 1e15).toFixed(2)}Q`
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  return value.toLocaleString('en-US')
}

/**
 * Format a percentage value
 * @param {number} value - The decimal value (e.g., 0.125 for 12.5%)
 * @param {boolean} showSign - Whether to show + sign for positive values
 * @param {boolean} multiplyBy100 - Whether to multiply by 100 (default: true)
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, showSign = false, multiplyBy100 = true) {
  if (!value && value !== 0) return 'N/A'
  
  const factor = multiplyBy100 ? 100 : 1
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${(value * factor).toFixed(2)}%`
}

/**
 * Format a ratio value (like P/E, P/B)
 * @param {number} value - The ratio value
 * @returns {string} Formatted ratio string
 */
export function formatRatio(value) {
  if (!value && value !== 0) return 'N/A'
  return value.toFixed(2)
}

/**
 * Format a change value with sign
 * @param {number} value - The change value
 * @param {boolean} asPercent - Whether to format as percentage (default: true)
 * @returns {string} Formatted change string with sign
 */
export function formatChange(value, asPercent = true) {
  if (!value && value !== 0) return 'N/A'
  
  const sign = value >= 0 ? '+' : ''
  if (asPercent) {
    return `${sign}${value.toFixed(2)}%`
  }
  return `${sign}${value.toFixed(2)}`
}

/**
 * Format market cap with compact notation
 * @param {number} value - Market cap value
 * @returns {string} Formatted market cap
 */
export function formatMarketCap(value) {
  if (!value && value !== 0) return 'N/A'
  return formatCompactNumber(value)
}

/**
 * Format volume with K/M suffix
 * @param {number} value - Volume value
 * @returns {string} Formatted volume
 */
export function formatVolume(value) {
  if (!value && value !== 0) return 'N/A'
  return formatCompactNumber(value)
}

/**
 * Format a date string to locale format
 * @param {string|Date} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return 'N/A'
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  return new Date(date).toLocaleDateString('en-IN', defaultOptions)
}

/**
 * Format a time string
 * @param {string|Date} date - The date/time to format
 * @returns {string} Formatted time string
 */
export function formatTime(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - The date to compare
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return 'N/A'
  
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return formatDate(date)
}

export default {
  formatCurrency,
  formatNumber,
  formatCompactNumber,
  formatPercent,
  formatRatio,
  formatChange,
  formatMarketCap,
  formatVolume,
  formatDate,
  formatTime,
  formatRelativeTime
}
