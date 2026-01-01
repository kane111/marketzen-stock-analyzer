import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Alerts Context - manages all price alert functionality
const AlertsContext = createContext(null)

export const useAlerts = () => {
  const context = useContext(AlertsContext)
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider')
  }
  return context
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Alert types and their configurations
const ALERT_TYPES = {
  price_above: {
    label: 'Price Above',
    icon: '↑',
    color: 'positive',
    description: 'Alert when price goes above target'
  },
  price_below: {
    label: 'Price Below',
    icon: '↓',
    color: 'negative',
    description: 'Alert when price goes below target'
  },
  pct_change_up: {
    label: 'Change % Up',
    icon: '↗',
    color: 'positive',
    description: 'Alert when price increases by %'
  },
  pct_change_down: {
    label: 'Change % Down',
    icon: '↘',
    color: 'negative',
    description: 'Alert when price decreases by %'
  },
  volume_spike: {
    label: 'Volume Spike',
    icon: '⚡',
    color: 'warning',
    description: 'Alert when volume exceeds threshold'
  }
}

export const AlertsProvider = ({ children, stockData: currentStockData, marketStatus }) => {
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('marketzen_alerts')
    return saved ? JSON.parse(saved) : []
  })
  
  const [toasts, setToasts] = useState([])
  const [triggeredAlerts, setTriggeredAlerts] = useState([])
  const [notificationPermission, setNotificationPermission] = useState('default')

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [])

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('marketzen_alerts', JSON.stringify(alerts))
  }, [alerts])

  // Check alerts against current stock data
  useEffect(() => {
    if (!currentStockData || marketStatus === 'closed') return

    const currentPrice = currentStockData.current_price
    const currentVolume = currentStockData.volume
    const previousClose = currentStockData.previous_close
    const changePercent = previousClose > 0 
      ? ((currentPrice - previousClose) / previousClose) * 100 
      : 0

    alerts.forEach(alert => {
      if (!alert.enabled || alert.triggered) return

      let shouldTrigger = false

      switch (alert.type) {
        case 'price_above':
          shouldTrigger = currentPrice >= alert.targetValue
          break
        case 'price_below':
          shouldTrigger = currentPrice <= alert.targetValue
          break
        case 'pct_change_up':
          shouldTrigger = changePercent >= alert.targetValue
          break
        case 'pct_change_down':
          shouldTrigger = changePercent <= -alert.targetValue
          break
        case 'volume_spike':
          shouldTrigger = currentVolume >= alert.targetValue
          break
        default:
          break
      }

      if (shouldTrigger) {
        triggerAlert(alert, currentStockData)
      }
    })
  }, [currentStockData, marketStatus, alerts])

  const triggerAlert = useCallback((alert, stockData) => {
    // Mark as triggered
    setAlerts(prev => prev.map(a => 
      a.id === alert.id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
    ))

    // Add to triggered list
    const triggeredAlert = {
      ...alert,
      triggeredAt: new Date().toISOString(),
      triggeredPrice: stockData.current_price
    }
    setTriggeredAlerts(prev => [triggeredAlert, ...prev].slice(0, 50))

    // Show toast
    const message = `${alert.stockName} (${alert.stockSymbol}): ${getAlertMessage(alert, stockData)}`
    addToast(message, 'alert', alert.id)

    // Send browser notification
    if (notificationPermission === 'granted') {
      new Notification('Price Alert', {
        body: message,
        icon: '/icon-192.png',
        tag: alert.id
      })
    }
  }, [notificationPermission])

  const addToast = useCallback((message, type = 'success', alertId = null) => {
    const id = generateId()
    setToasts(prev => [...prev, { id, message, type, alertId }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const createAlert = useCallback((alertData) => {
    const newAlert = {
      id: generateId(),
      ...alertData,
      enabled: true,
      triggered: false,
      triggeredAt: null,
      createdAt: new Date().toISOString()
    }
    setAlerts(prev => [...prev, newAlert])
    return newAlert
  }, [])

  const updateAlert = useCallback((id, updates) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    ))
  }, [])

  const deleteAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
    setTriggeredAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  const toggleAlert = useCallback((id) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ))
  }, [])

  const resetTriggeredAlert = useCallback((id) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, triggered: false, triggeredAt: null } : alert
    ))
    setTriggeredAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  const clearAllTriggered = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({
      ...alert,
      triggered: false,
      triggeredAt: null
    })))
    setTriggeredAlerts([])
  }, [])

  const getAlertProximity = useCallback((alert, currentPrice, previousClose) => {
    if (!currentPrice) return null
    
    const changePercent = previousClose > 0 
      ? ((currentPrice - previousClose) / previousClose) * 100 
      : 0

    switch (alert.type) {
      case 'price_above':
        const diffAbove = currentPrice - alert.targetValue
        const pctAbove = (diffAbove / alert.targetValue) * 100
        if (diffAbove >= 0) return { text: 'Above target', reached: true }
        return { text: `₹${Math.abs(diffAbove).toFixed(2)} (${pctAbove.toFixed(2)}%) away`, reached: false }
      case 'price_below':
        const diffBelow = alert.targetValue - currentPrice
        const pctBelow = (diffBelow / alert.targetValue) * 100
        if (diffBelow >= 0) return { text: 'Below target', reached: true }
        return { text: `₹${Math.abs(diffBelow).toFixed(2)} (${pctBelow.toFixed(2)}%) away`, reached: false }
      case 'pct_change_up':
        if (changePercent >= alert.targetValue) return { text: 'Target reached', reached: true }
        return { text: `${(alert.targetValue - changePercent).toFixed(2)}% more needed`, reached: false }
      case 'pct_change_down':
        if (changePercent <= -alert.targetValue) return { text: 'Target reached', reached: true }
        return { text: `${(alert.targetValue + changePercent).toFixed(2)}% more drop needed`, reached: false }
      case 'volume_spike':
        return { text: `Vol: ${currentPrice.toLocaleString()}`, reached: false }
      default:
        return null
    }
  }, [])

  const value = {
    alerts,
    toasts,
    triggeredAlerts,
    notificationPermission,
    alertTypes: ALERT_TYPES,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    resetTriggeredAlert,
    clearAllTriggered,
    getAlertProximity,
    addToast,
    dismissToast,
    triggerAlert
  }

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  )
}

// Helper function to get alert message
const getAlertMessage = (alert, stockData) => {
  const price = stockData.current_price
  switch (alert.type) {
    case 'price_above':
      return `Price is now ₹${price.toFixed(2)} (target: ₹${alert.targetValue})`
    case 'price_below':
      return `Price is now ₹${price.toFixed(2)} (target: ₹${alert.targetValue})`
    case 'pct_change_up':
      return `Up ${((price - stockData.previous_close) / stockData.previous_close * 100).toFixed(2)}% (target: +${alert.targetValue}%)`
    case 'pct_change_down':
      return `Down ${((stockData.previous_close - price) / stockData.previous_close * 100).toFixed(2)}% (target: -${alert.targetValue}%)`
    case 'volume_spike':
      return `Volume: ${stockData.volume.toLocaleString()} (threshold: ${alert.targetValue.toLocaleString()})`
    default:
      return 'Alert triggered'
  }
}

export default AlertsContext
