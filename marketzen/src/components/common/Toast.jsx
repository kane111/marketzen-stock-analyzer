import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

/**
 * Toast/Notification component for displaying temporary messages
 * 
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', 'warning'
 * @param {number} duration - Auto-dismiss duration in ms (default: 3000)
 * @param {function} onDismiss - Callback when toast is dismissed
 */
export function Toast({ message, type = 'success', duration = 3000, onDismiss }) {
  const progressRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (duration > 0 && !isPaused) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss, isPaused])

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-terminal-green/15 text-terminal-green border-terminal-green/30'
      case 'error':
        return 'bg-terminal-red/15 text-terminal-red border-terminal-red/30'
      case 'warning':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30'
      default:
        return 'bg-terminal-blue/15 text-terminal-blue border-terminal-blue/30'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-terminal-green'
      case 'error':
        return 'bg-terminal-red'
      case 'warning':
        return 'bg-amber-500'
      default:
        return 'bg-terminal-blue'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${getStyles()}`}
    >
      {/* Progress Bar */}
      {duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-0.5 ${getProgressColor()} rounded-b-lg`}
        />
      )}
      
      {/* Icon */}
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      {/* Message */}
      <p className="text-sm font-medium flex-1">{message}</p>
      
      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  )
}

/**
 * ToastContainer - Manages multiple toasts
 * 
 * @param {Array} toasts - Array of toast objects { id, message, type, duration }
 * @param {function} removeToast - Function to remove a toast by id
 * @param {string} position - 'top-right', 'top-left', 'bottom-right', 'bottom-left'
 */
export function ToastContainer({ toasts, removeToast, position = 'top-right' }) {
  const positionStyles = {
    'top-right': 'fixed top-20 right-4 z-50 flex flex-col gap-2',
    'top-left': 'fixed top-20 left-4 z-50 flex flex-col gap-2',
    'bottom-right': 'fixed bottom-4 right-4 z-50 flex flex-col gap-2',
    'bottom-left': 'fixed bottom-4 left-4 z-50 flex flex-col gap-2'
  }

  return (
    <div className={positionStyles[position]}>
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for managing toast state
export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration }])
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (message) => addToast(message, 'success')
  const showError = (message) => addToast(message, 'error')
  const showWarning = (message) => addToast(message, 'warning')
  const showInfo = (message) => addToast(message, 'info')

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

export default Toast
