import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Portfolio Context - manages all portfolio and transaction functionality
const PortfolioContext = createContext(null)

export const usePortfolio = () => {
  const context = useContext(PortfolioContext)
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const PortfolioProvider = ({ children, watchlist = [] }) => {
  const [holdings, setHoldings] = useState(() => {
    const saved = localStorage.getItem('marketzen_portfolio')
    return saved ? JSON.parse(saved) : []
  })

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('marketzen_transactions')
    return saved ? JSON.parse(saved) : []
  })

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('marketzen_portfolio', JSON.stringify(holdings))
  }, [holdings])

  useEffect(() => {
    localStorage.setItem('marketzen_transactions', JSON.stringify(transactions))
  }, [transactions])

  // Calculate FIFO cost basis for a holding
  const calculateCostBasis = useCallback((holdingId) => {
    const holdingTransactions = transactions
      .filter(t => t.holdingId === holdingId && t.type === 'buy')
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    let totalShares = 0
    let totalCost = 0
    const lots = []

    holdingTransactions.forEach(t => {
      const cost = t.quantity * t.price
      if (t.type === 'buy') {
        totalShares += t.quantity
        totalCost += cost
        lots.push({
          date: t.date,
          quantity: t.quantity,
          price: t.price,
          cost: cost
        })
      }
    })

    return {
      totalShares,
      totalCost,
      averageCost: totalShares > 0 ? totalCost / totalShares : 0,
      lots
    }
  }, [transactions])

  // Calculate current value and gains/losses for a holding
  const calculateHoldingValue = useCallback((holding, currentPrices = {}) => {
    const currentPrice = currentPrices[holding.symbol] || holding.avgCost || 0
    const { totalShares, averageCost } = calculateCostBasis(holding.id)
    const currentValue = totalShares * currentPrice
    const totalCost = totalShares * averageCost
    const gainLoss = currentValue - totalCost
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0

    return {
      quantity: totalShares,
      avgCost: averageCost,
      currentPrice,
      currentValue,
      totalCost,
      gainLoss,
      gainLossPercent
    }
  }, [calculateCostBasis])

  // Calculate overall portfolio metrics
  const calculatePortfolioMetrics = useCallback((currentPrices = {}) => {
    let totalInvested = 0
    let totalCurrentValue = 0
    let totalGainLoss = 0
    const holdingDetails = []

    holdings.forEach(holding => {
      const details = calculateHoldingValue(holding, currentPrices)
      holdingDetails.push({
        ...holding,
        ...details
      })
      totalInvested += details.totalCost
      totalCurrentValue += details.currentValue
      totalGainLoss += details.gainLoss
    })

    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

    return {
      totalInvested,
      totalCurrentValue,
      totalGainLoss,
      totalGainLossPercent,
      holdings: holdingDetails,
      holdingCount: holdings.length
    }
  }, [holdings, calculateHoldingValue])

  // Add a new holding
  const addHolding = useCallback((stock) => {
    const exists = holdings.find(h => h.symbol === stock.symbol)
    if (exists) {
      return { success: false, message: 'Stock already in portfolio' }
    }

    const newHolding = {
      id: generateId(),
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector || 'Other',
      addedAt: new Date().toISOString()
    }

    setHoldings(prev => [...prev, newHolding])
    return { success: true, message: 'Added to portfolio' }
  }, [holdings])

  // Remove a holding
  const removeHolding = useCallback((holdingId) => {
    setHoldings(prev => prev.filter(h => h.id !== holdingId))
    setTransactions(prev => prev.filter(t => t.holdingId !== holdingId))
  }, [])

  // Add a transaction
  const addTransaction = useCallback((holdingId, transactionData) => {
    const holding = holdings.find(h => h.id === holdingId)
    if (!holding) {
      return { success: false, message: 'Holding not found' }
    }

    const newTransaction = {
      id: generateId(),
      holdingId,
      symbol: holding.symbol,
      ...transactionData,
      createdAt: new Date().toISOString()
    }

    // Validate transaction
    if (transactionData.type === 'sell') {
      const { totalShares } = calculateCostBasis(holdingId)
      const totalSold = transactions
        .filter(t => t.holdingId === holdingId && t.type === 'sell')
        .reduce((sum, t) => sum + t.quantity, 0)
      
      if (transactionData.quantity > totalSold + totalShares) {
        return { success: false, message: 'Insufficient shares to sell' }
      }
    }

    setTransactions(prev => [...prev, newTransaction])
    return { success: true, message: 'Transaction added' }
  }, [holdings, transactions, calculateCostBasis])

  // Delete a transaction
  const deleteTransaction = useCallback((transactionId) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId))
  }, [])

  // Get transactions for a holding
  const getHoldingTransactions = useCallback((holdingId) => {
    return transactions
      .filter(t => t.holdingId === holdingId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions])

  // Get all transactions sorted by date
  const getAllTransactions = useCallback(() => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions])

  // Import portfolio data
  const importData = useCallback((data) => {
    if (data.holdings) setHoldings(data.holdings)
    if (data.transactions) setTransactions(data.transactions)
    return { success: true, message: 'Data imported successfully' }
  }, [])

  // Export portfolio data
  const exportData = useCallback(() => {
    return {
      holdings,
      transactions,
      exportedAt: new Date().toISOString()
    }
  }, [holdings, transactions])

  // Clear all portfolio data
  const clearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all portfolio data? This cannot be undone.')) {
      setHoldings([])
      setTransactions([])
      return { success: true, message: 'Portfolio cleared' }
    }
    return { success: false, message: 'Cancelled' }
  }, [])

  const value = {
    holdings,
    transactions,
    addHolding,
    removeHolding,
    addTransaction,
    deleteTransaction,
    getHoldingTransactions,
    getAllTransactions,
    calculateCostBasis,
    calculateHoldingValue,
    calculatePortfolioMetrics,
    importData,
    exportData,
    clearAll
  }

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  )
}

export default PortfolioContext
