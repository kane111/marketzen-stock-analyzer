import { motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, XCircle, Info, X } from 'lucide-react'

// ==========================================
// ERROR DISPLAY - Unified Error Component
// Used across: App, TechnicalAnalysis, StockComparison, FundamentalsPanel
// ==========================================

// Error severity levels
const SEVERITY_CONFIG = {
  error: {
    icon: XCircle,
    bgColor: 'bg-negative/10',
    borderColor: 'border-negative/30',
    textColor: 'text-negative',
    iconBg: 'bg-negative/20'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-500',
    iconBg: 'bg-amber-500/20'
  },
  info: {
    icon: Info,
    bgColor: 'bg-terminal-green/10',
    borderColor: 'border-terminal-green/30',
    textColor: 'text-terminal-green',
    iconBg: 'bg-terminal-green/20'
  }
}

// Simple error banner
export function ErrorBanner({ 
  message, 
  severity = 'error',
  onDismiss,
  className = '' 
}) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <div className={`p-2 rounded-full ${config.iconBg}`}>
        <Icon className={`w-5 h-5 ${config.textColor}`} />
      </div>
      <p className={`flex-1 font-medium ${config.textColor}`}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`p-1 rounded hover:bg-terminal-bg-light transition-colors ${config.textColor}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}

// Error with retry button
export function ErrorWithRetry({
  message = 'Something went wrong',
  onRetry,
  severity = 'error',
  className = ''
}) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center p-8 rounded-xl border ${config.bgColor} ${config.borderColor} ${className}`}
    >
      <div className={`p-4 rounded-full ${config.iconBg} mb-4`}>
        <Icon className={`w-8 h-8 ${config.textColor}`} />
      </div>
      <p className={`text-lg font-medium mb-4 ${config.textColor}`}>{message}</p>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 border ${config.borderColor} ${config.textColor} hover:bg-terminal-bg-light transition-colors`}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </motion.button>
      )}
    </motion.div>
  )
}

// Inline error message
export function InlineError({ 
  message, 
  severity = 'error',
  className = '' 
}) {
  const config = SEVERITY_CONFIG[severity]

  return (
    <div className={`flex items-center gap-2 text-sm ${config.textColor} ${className}`}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Error state for empty data
export function EmptyState({
  title = 'No data available',
  message = 'There is no data to display at the moment.',
  icon: Icon = Info,
  action,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-terminal-bg-light flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-terminal-dim" />
      </div>
      <h3 className="text-lg font-medium text-terminal-text mb-2">{title}</h3>
      <p className="text-sm text-terminal-dim max-w-sm mb-4">{message}</p>
      {action}
    </motion.div>
  )
}

// Toast notification error
export function ToastError({ message, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-negative/20 text-negative border border-negative/30 font-mono text-sm"
    >
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4" />
        <span className="font-medium">{message}</span>
        {onClose && (
          <button onClick={onClose} className="ml-2 hover:text-negative/80">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// Error page layout
export function ErrorPage({
  title = 'Error',
  message = 'An unexpected error occurred.',
  errorCode,
  onRetry,
  onGoHome
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      {errorCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold text-terminal-bg-light mb-4 font-mono"
        >
          {errorCode}
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-terminal-text mb-2">{title}</h1>
        <p className="text-terminal-dim mb-6 max-w-md">{message}</p>
        <div className="flex items-center justify-center gap-4">
          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-terminal-green text-terminal-bg font-medium flex items-center gap-2 hover:bg-terminal-green/90"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </motion.button>
          )}
          {onGoHome && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGoHome}
              className="px-4 py-2 rounded-lg bg-terminal-bg border border-terminal-border text-terminal-text hover:bg-terminal-bg-light"
            >
              Go Home
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// API error with fallback
export function APIError({
  error,
  fallbackData,
  onRetry,
  severity = 'warning'
}) {
  const message = error?.message || 'Failed to fetch data'
  const config = SEVERITY_CONFIG[severity]

  return (
    <div className="space-y-4">
      <ErrorBanner
        message={`${message}. ${fallbackData ? 'Showing cached data.' : ''}`}
        severity={severity}
      />
      {onRetry && (
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="px-4 py-2 rounded-lg flex items-center gap-2 bg-terminal-bg border border-terminal-border hover:border-terminal-green transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </motion.button>
        </div>
      )}
    </div>
  )
}

export default {
  ErrorBanner,
  ErrorWithRetry,
  InlineError,
  EmptyState,
  ToastError,
  ErrorPage,
  APIError
}
