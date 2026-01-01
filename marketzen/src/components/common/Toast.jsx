import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

/**
 * Toast/Notification component for displaying temporary messages
 * 
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', 'warning'
 * @param {number} duration - Auto-dismiss duration in ms (default: 3000)
 * @param {function} onDismiss - Callback when toast is dismissed
 */
export function Toast({ message, type = 'success', duration = 3000, onDismiss }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss])

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-terminal-green/20 text-terminal-green border-terminal-green/30'
      case 'error':
        return 'bg-terminal-red/20 text-terminal-red border-terminal-red/30'
      case 'warning':
        return 'bg-terminal-yellow/20 text-terminal-yellow border-terminal-yellow/30'
      default:
        return 'bg-terminal-blue/20 text-terminal-blue border-terminal-blue/30'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${getStyles()}`}
    >
      {getIcon()}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onDismiss}
        className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
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
