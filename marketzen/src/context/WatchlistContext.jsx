import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Watchlist Context - manages watchlist functionality
const WatchlistContext = createContext(null)

export const useWatchlist = () => {
  const context = useContext(WatchlistContext)
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider')
  }
  return context
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const WatchlistProvider = ({ children }) => {
  const [watchlists, setWatchlists] = useState(() => {
    const saved = localStorage.getItem('marketzen_watchlists')
    return saved ? JSON.parse(saved) : { 'Default': [] }
  })

  const [activeWatchlist, setActiveWatchlist] = useState(() => {
    const saved = localStorage.getItem('marketzen_active_watchlist')
    return saved || 'Default'
  })

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('marketzen_watchlists', JSON.stringify(watchlists))
  }, [watchlists])

  useEffect(() => {
    localStorage.setItem('marketzen_active_watchlist', activeWatchlist)
  }, [activeWatchlist])

  // Create a new watchlist
  const createWatchlist = useCallback((name) => {
    if (watchlists[name]) {
      return { success: false, message: 'Watchlist already exists' }
    }
    setWatchlists(prev => ({
      ...prev,
      [name]: []
    }))
    return { success: true, message: 'Watchlist created' }
  }, [watchlists])

  // Delete a watchlist
  const deleteWatchlist = useCallback((name) => {
    if (name === 'Default') {
      return { success: false, message: 'Cannot delete default watchlist' }
    }
    if (!watchlists[name]) {
      return { success: false, message: 'Watchlist not found' }
    }
    setWatchlists(prev => {
      const newWatchlists = { ...prev }
      delete newWatchlists[name]
      return newWatchlists
    })
    if (activeWatchlist === name) {
      setActiveWatchlist('Default')
    }
    return { success: true, message: 'Watchlist deleted' }
  }, [watchlists, activeWatchlist])

  // Rename a watchlist
  const renameWatchlist = useCallback((oldName, newName) => {
    if (oldName === 'Default') {
      return { success: false, message: 'Cannot rename default watchlist' }
    }
    if (!watchlists[oldName]) {
      return { success: false, message: 'Watchlist not found' }
    }
    if (watchlists[newName]) {
      return { success: false, message: 'A watchlist with this name already exists' }
    }
    setWatchlists(prev => {
      const newWatchlists = { ...prev }
      newWatchlists[newName] = newWatchlists[oldName]
      delete newWatchlists[oldName]
      return newWatchlists
    })
    if (activeWatchlist === oldName) {
      setActiveWatchlist(newName)
    }
    return { success: true, message: 'Watchlist renamed' }
  }, [watchlists, activeWatchlist])

  // Add a stock to watchlist
  const addToWatchlist = useCallback((stock, watchlistName = activeWatchlist) => {
    const watchlist = watchlists[watchlistName]
    if (!watchlist) {
      return { success: false, message: 'Watchlist not found' }
    }
    if (watchlist.some(s => s.symbol === stock.symbol)) {
      return { success: false, message: 'Stock already in watchlist' }
    }
    const newStock = {
      id: stock.id || generateId(),
      symbol: stock.symbol,
      name: stock.name,
      addedAt: new Date().toISOString()
    }
    setWatchlists(prev => ({
      ...prev,
      [watchlistName]: [...prev[watchlistName], newStock]
    }))
    return { success: true, message: 'Added to watchlist' }
  }, [watchlists, activeWatchlist])

  // Remove a stock from watchlist
  const removeFromWatchlist = useCallback((symbol, watchlistName = activeWatchlist) => {
    const watchlist = watchlists[watchlistName]
    if (!watchlist) {
      return { success: false, message: 'Watchlist not found' }
    }
    setWatchlists(prev => ({
      ...prev,
      [watchlistName]: prev[watchlistName].filter(s => s.symbol !== symbol)
    }))
    return { success: true, message: 'Removed from watchlist' }
  }, [watchlists, activeWatchlist])

  // Get stocks in active watchlist
  const getActiveWatchlistStocks = useCallback(() => {
    return watchlists[activeWatchlist] || []
  }, [watchlists, activeWatchlist])

  // Get all watchlist names
  const getWatchlistNames = useCallback(() => {
    return Object.keys(watchlists)
  }, [watchlists])

  // Check if stock is in any watchlist
  const isInWatchlist = useCallback((symbol) => {
    return Object.values(watchlists).some(watchlist =>
      watchlist.some(s => s.symbol === symbol)
    )
  }, [watchlists])

  // Move stock between watchlists
  const moveStock = useCallback((symbol, fromWatchlist, toWatchlist) => {
    if (!watchlists[fromWatchlist] || !watchlists[toWatchlist]) {
      return { success: false, message: 'Watchlist not found' }
    }
    const stock = watchlists[fromWatchlist].find(s => s.symbol === symbol)
    if (!stock) {
      return { success: false, message: 'Stock not found' }
    }
    if (watchlists[toWatchlist].some(s => s.symbol === symbol)) {
      return { success: false, message: 'Stock already in target watchlist' }
    }
    setWatchlists(prev => ({
      ...prev,
      [fromWatchlist]: prev[fromWatchlist].filter(s => s.symbol !== symbol),
      [toWatchlist]: [...prev[toWatchlist], stock]
    }))
    return { success: true, message: 'Stock moved' }
  }, [watchlists])

  const value = {
    watchlists,
    activeWatchlist,
    setActiveWatchlist,
    createWatchlist,
    deleteWatchlist,
    renameWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    getActiveWatchlistStocks,
    getWatchlistNames,
    isInWatchlist,
    moveStock
  }

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  )
}

export default WatchlistContext
