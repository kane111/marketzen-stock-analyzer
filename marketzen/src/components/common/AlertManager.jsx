import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CheckCircle, AlertCircle, Info, AlertTriangle, 
  Bell, BellOff, TrendingUp, TrendingDown, Volume2, 
  Percent, DollarSign, RefreshCw, Clock
} from 'lucide-react'

// ==========================================
// UNIFIED ALERT MANAGER - Phase 3 Consolidation
// Consolidates: Toast, Banner, and Notification systems
// ==========================================

// Alert types configuration
export const ALERT_TYPES = {
  // Toast types
  success: { icon: CheckCircle, bg: 'bg-terminal-green/20', border: 'border-terminal-green/30', text: 'text-terminal-green' },
  error: { icon: AlertCircle, bg: 'bg-terminal-red/20', border: 'border-terminal-red/30', text: 'text-terminal-red' },
  warning: { icon: AlertTriangle, bg: 'bg-terminal-yellow/20', border: 'border-terminal-yellow/30', text: 'text-terminal-yellow' },
  info: { icon: Info, bg: 'bg-terminal-blue/20', border: 'border-terminal-blue/30', text: 'text-terminal-blue' },
  // Price alert types
  price_above: { icon: TrendingUp, bg: 'bg-terminal-green/20', border: 'border-terminal-green/30', text: 'text-terminal-green', prefix: '₹' },
  price_below: { icon: TrendingDown, bg: 'bg-terminal-red/20', border: 'border-terminal-red/30', text: 'text-terminal-red', prefix: '₹' },
  pct_change_up: { icon: Percent, bg: 'bg-terminal-green/20', border: 'border-terminal-green/30', text: 'text-terminal-green', prefix: '+', suffix: '%' },
  pct_change_down: { icon: Percent, bg: 'bg-terminal-red/20', border: 'border-terminal-red/30', text: 'text-terminal-red', suffix: '%' },
  volume_spike: { icon: Volume2, bg: 'bg-terminal-blue/20', border: 'border-terminal-blue/30', text: 'text-terminal-blue' }
}

// Position configurations
const POSITIONS = {
  'top-right': 'fixed top-20 right-4 z-50 flex flex-col gap-2 items-end',
  'top-left': 'fixed top-20 left-4 z-50 flex flex-col gap-2 items-start',
  'bottom-right': 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end',
  'bottom-left': 'fixed bottom-4 left-4 z-50 flex flex-col gap-2 items-start',
  'top-center': 'fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center',
  'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center'
}

// ==========================================
// TOAST COMPONENT
// ==========================================
export function UnifiedToast({ toast, onDismiss }) {
  const config = ALERT_TYPES[toast.type] || ALERT_TYPES.info
  const Icon = config.icon

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, toast.id, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${config.bg} ${config.border} max-w-sm`}
    >
      <Icon className={`w-5 h-5 ${config.text}`} />
      <div className="flex-1">
        {toast.title && <p className={`font-medium ${config.text}`}>{toast.title}</p>}
        <p className={`text-sm ${toast.title ? 'text-terminal-dim' : config.text}`}>{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-terminal-dim" />
      </button>
    </motion.div>
  )
}

// ==========================================
// BANNER COMPONENT
// ==========================================
export function UnifiedBanner({ banner, onDismiss }) {
  const config = ALERT_TYPES[banner.type] || ALERT_TYPES.info
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bg} ${config.border} ${banner.className || ''}`}
    >
      <Icon className={`w-5 h-5 ${config.text} flex-shrink-0`} />
      <div className="flex-1">
        {banner.title && <p className={`font-medium ${config.text}`}>{banner.title}</p>}
        <p className={`text-sm ${banner.title ? 'text-terminal-dim' : config.text}`}>{banner.message}</p>}
      </div>
      {banner.action && (
        <button
          onClick={banner.action.onClick}
          className={`px-3 py-1 rounded text-sm font-medium ${config.bg} ${config.text} hover:opacity-80 transition-opacity`}
        >
          {banner.action.label}
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-terminal-dim" />
        </button>
      )}
    </motion.div>
  )
}

// ==========================================
// INLINE ALERT COMPONENT
// ==========================================
export function InlineAlert({ message, type = 'info', icon = true, className = '' }) {
  const config = ALERT_TYPES[type] || ALERT_TYPES.info
  const Icon = config.icon

  return (
    <div className={`flex items-start gap-2 text-sm ${config.text} ${className}`}>
      {icon && <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />}
      <span>{message}</span>
    </div>
  )
}

// ==========================================
// NOTIFICATION CONTAINER
// ==========================================
export function NotificationContainer({ 
  toasts = [], 
  banners = [], 
  position = 'top-right',
  onDismissToast,
  onDismissBanner
}) {
  return (
    <>
      {/* Toast notifications */}
      <div className={POSITIONS[position] || POSITIONS['top-right']}>
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <UnifiedToast
              key={toast.id}
              toast={toast}
              onDismiss={onDismissToast}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Banner notifications */}
      <div className="fixed top-4 left-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {banners.map(banner => (
            <div key={banner.id} className="pointer-events-auto">
              <UnifiedBanner
                banner={banner}
                onDismiss={() => onDismissBanner?.(banner.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

// ==========================================
// HOOK FOR UNIFIED ALERTS
// ==========================================
export function useAlertManager() {
  const [toasts, setToasts] = useState([])
  const [banners, setBanners] = useState([])

  // Toast management
  const addToast = useCallback((message, type = 'success', options = {}) => {
    const id = Date.now() + Math.random()
    const toast = {
      id,
      message,
      type,
      title: options.title,
      duration: options.duration ?? 3000,
      position: options.position
    }
    setToasts(prev => [...prev, toast])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showSuccess = useCallback((message, options) => addToast(message, 'success', options), [addToast])
  const showError = useCallback((message, options) => addToast(message, 'error', options), [addToast])
  const showWarning = useCallback((message, options) => addToast(message, 'warning', options), [addToast])
  const showInfo = useCallback((message, options) => addToast(message, 'info', options), [addToast])

  // Banner management
  const addBanner = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random()
    const banner = {
      id,
      message,
      type,
      title: options.title,
      action: options.action,
      className: options.className
    }
    setBanners(prev => [...prev, banner])
    return id
  }, [])

  const removeBanner = useCallback((id) => {
    setBanners(prev => prev.filter(b => b.id !== id))
  }, [])

  const showBanner = useCallback((message, type, options) => addBanner(message, type, options), [addBanner])
  const dismissBanner = useCallback((id) => removeBanner(id), [removeBanner])

  // Clear all
  const clearAll = useCallback(() => {
    setToasts([])
    setBanners([])
  }, [])

  return {
    toasts,
    banners,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    addBanner,
    removeBanner,
    showBanner,
    dismissBanner,
    clearAll
  }
}

// ==========================================
// LEGACY WRAPPER FOR EXISTING useToast
// ==========================================
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

export default {
  UnifiedToast,
  UnifiedBanner,
  InlineAlert,
  NotificationContainer,
  useAlertManager,
  useToast,
  ALERT_TYPES
}
