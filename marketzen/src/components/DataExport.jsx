import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, FileSpreadsheet, Calendar, TrendingUp, TrendingDown, Check, X, FolderOpen, RefreshCw, Clock } from 'lucide-react'
import { usePortfolio } from '../context/PortfolioContext'
import { useWatchlist } from '../context/WatchlistContext'
import { useAlerts } from '../context/AlertsContext'

function DataExport() {
  const { holdings, transactions, exportData: exportPortfolio } = usePortfolio()
  const { watchlists, exportData: exportWatchlist } = useWatchlist()
  const { alerts, exportData: exportAlerts } = useAlerts()

  const [exporting, setExporting] = useState(null)
  const [notification, setNotification] = useState(null)
  const [exportFormat, setExportFormat] = useState('csv')
  const [dateRange, setDateRange] = useState('all')
  const [selectedWatchlist, setSelectedWatchlist] = useState('all')

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Generate CSV content
  const generateCSV = useCallback((data, headers) => {
    const headerRow = headers.join(',')
    const dataRows = data.map(row => 
      headers.map(h => {
        const value = row[h.toLowerCase().replace(/\s+/g, '')]
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value ?? ''
      }).join(',')
    ).join('\n')
    
    return `${headerRow}\n${dataRows}`
  }, [])

  // Generate JSON content
  const generateJSON = useCallback((data) => {
    return JSON.stringify(data, null, 2)
  }, [])

  // Export Portfolio
  const handleExportPortfolio = useCallback(async () => {
    setExporting('portfolio')
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const portfolioData = exportPortfolio()
      const now = new Date()
      const filename = `portfolio_${now.toISOString().split('T')[0]}`
      
      let content, mimeType, extension
      
      if (exportFormat === 'csv') {
        const headers = ['Symbol', 'Name', 'Quantity', 'AvgCost', 'CurrentPrice', 'CurrentValue', 'GainLoss', 'GainLossPercent']
        const csvData = portfolioData.holdings.map(h => ({
          symbol: h.symbol,
          name: h.name,
          quantity: h.quantity || h.shares,
          avgcost: h.avgCost,
          currentprice: h.currentPrice,
          currentvalue: h.currentValue,
          gainloss: h.gainLoss,
          gainlosspercent: h.gainLossPercent?.toFixed(2)
        }))
        content = generateCSV(csvData, headers)
        mimeType = 'text/csv'
        extension = 'csv'
      } else {
        content = generateJSON(portfolioData)
        mimeType = 'application/json'
        extension = 'json'
      }
      
      // Download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showNotification(`Portfolio exported as ${extension.toUpperCase()}`, 'success')
    } catch (error) {
      showNotification('Failed to export portfolio', 'error')
    } finally {
      setExporting(null)
    }
  }, [exportFormat, exportPortfolio, generateCSV, generateJSON])

  // Export Watchlist
  const handleExportWatchlist = useCallback(async () => {
    setExporting('watchlist')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const watchlistData = exportWatchlist()
      const now = new Date()
      const filename = `watchlist_${now.toISOString().split('T')[0]}`
      
      let content, mimeType, extension
      
      if (exportFormat === 'csv') {
        const headers = ['Watchlist', 'Symbol', 'Name', 'AddedAt']
        const csvData = []
        
        if (selectedWatchlist === 'all') {
          Object.entries(watchlistData.watchlists).forEach(([name, stocks]) => {
            stocks.forEach(stock => {
              csvData.push({
                watchlist: name,
                symbol: stock.symbol,
                name: stock.name,
                addedat: stock.addedAt
              })
            })
          })
        } else {
          const stocks = watchlistData.watchlists[selectedWatchlist] || []
          stocks.forEach(stock => {
            csvData.push({
              watchlist: selectedWatchlist,
              symbol: stock.symbol,
              name: stock.name,
              addedat: stock.addedAt
            })
          })
        }
        
        content = generateCSV(csvData, headers)
        mimeType = 'text/csv'
        extension = 'csv'
      } else {
        const exportData = selectedWatchlist === 'all' 
          ? watchlistData 
          : { watchlists: { [selectedWatchlist]: watchlistData.watchlists[selectedWatchlist] || [] } }
        content = generateJSON(exportData)
        mimeType = 'application/json'
        extension = 'json'
      }
      
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showNotification(`Watchlist exported as ${extension.toUpperCase()}`, 'success')
    } catch (error) {
      showNotification('Failed to export watchlist', 'error')
    } finally {
      setExporting(null)
    }
  }, [exportFormat, selectedWatchlist, exportWatchlist, generateCSV, generateJSON])

  // Export Alerts
  const handleExportAlerts = useCallback(async () => {
    setExporting('alerts')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const alertsData = exportAlerts()
      const now = new Date()
      const filename = `alerts_${now.toISOString().split('T')[0]}`
      
      let content, mimeType, extension
      
      if (exportFormat === 'csv') {
        const headers = ['Symbol', 'Type', 'TargetPrice', 'CurrentPrice', 'Status', 'CreatedAt']
        const csvData = alertsData.alerts.map(a => ({
          symbol: a.symbol,
          type: a.type,
          targetprice: a.targetPrice,
          currentprice: a.currentPrice || 'N/A',
          status: a.triggered ? 'Triggered' : 'Active',
          createdat: a.createdAt
        }))
        content = generateCSV(csvData, headers)
        mimeType = 'text/csv'
        extension = 'csv'
      } else {
        content = generateJSON(alertsData)
        mimeType = 'application/json'
        extension = 'json'
      }
      
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showNotification(`Alerts exported as ${extension.toUpperCase()}`, 'success')
    } catch (error) {
      showNotification('Failed to export alerts', 'error')
    } finally {
      setExporting(null)
    }
  }, [exportFormat, exportAlerts, generateCSV, generateJSON])

  // Export All Data
  const handleExportAll = useCallback(async () => {
    setExporting('all')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const portfolioData = exportPortfolio()
      const watchlistData = exportWatchlist()
      const alertsData = exportAlerts()
      
      const now = new Date()
      const filename = `marketzen_backup_${now.toISOString().split('T')[0]}`
      
      const fullData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        portfolio: portfolioData,
        watchlist: watchlistData,
        alerts: alertsData
      }
      
      let content, mimeType, extension
      
      if (exportFormat === 'csv') {
        // For CSV, export each section separately in a ZIP-like structure
        // Since we can't create ZIP files easily, we'll create a combined CSV
        showNotification('Full export available in JSON format for complete backup', 'info')
      }
      
      content = generateJSON(fullData)
      mimeType = 'application/json'
      extension = 'json'
      
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showNotification('Complete backup exported successfully', 'success')
    } catch (error) {
      showNotification('Failed to export all data', 'error')
    } finally {
      setExporting(null)
    }
  }, [exportFormat, exportPortfolio, exportWatchlist, exportAlerts, generateJSON])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-positive/20 text-positive border border-positive/30' :
              notification.type === 'error' ? 'bg-negative/20 text-negative border border-negative/30' :
              'bg-primary/20 text-primary border border-primary/30'
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Data Export</h2>
        <p className="text-textSecondary text-sm">Export your portfolio, watchlist, and alerts data</p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Format Selection */}
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
          <h3 className="text-lg font-medium mb-4">Export Format</h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setExportFormat('csv')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                exportFormat === 'csv'
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent bg-surfaceLight'
              }`}
            >
              <FileSpreadsheet className={`w-6 h-6 ${exportFormat === 'csv' ? 'text-primary' : 'text-textSecondary'}`} />
              <div className="text-left">
                <p className="font-medium">CSV</p>
                <p className="text-xs text-textSecondary">Spreadsheet compatible</p>
              </div>
              {exportFormat === 'csv' && <Check className="w-5 h-5 text-primary ml-auto" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setExportFormat('json')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                exportFormat === 'json'
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent bg-surfaceLight'
              }`}
            >
              <FileText className={`w-6 h-6 ${exportFormat === 'json' ? 'text-primary' : 'text-textSecondary'}`} />
              <div className="text-left">
                <p className="font-medium">JSON</p>
                <p className="text-xs text-textSecondary">Complete data backup</p>
              </div>
              {exportFormat === 'json' && <Check className="w-5 h-5 text-primary ml-auto" />}
            </motion.button>
          </div>
        </div>

        {/* Quick Export All */}
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-medium mb-4">Quick Export</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportAll}
              disabled={exporting === 'all'}
              className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl hover:from-primary/30 hover:to-primary/10 transition-all"
            >
              {exporting === 'all' ? (
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <FolderOpen className="w-8 h-8 text-primary" />
              )}
              <div className="text-left">
                <p className="font-medium">Complete Backup</p>
                <p className="text-xs text-textSecondary">All data in one file</p>
              </div>
            </motion.button>

            <div className="flex items-center justify-center p-4 bg-surfaceLight rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-bold">{holdings.length + Object.values(watchlists).flat().length + alerts.length}</p>
                <p className="text-xs text-textSecondary">Total items to export</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Portfolio Export */}
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-positive/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-positive" />
            </div>
            <div>
              <h3 className="font-medium">Portfolio</h3>
              <p className="text-xs text-textSecondary">{holdings.length} holdings</p>
            </div>
          </div>
          <p className="text-sm text-textSecondary mb-4">
            Export your portfolio holdings with current values and gains/losses.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportPortfolio}
            disabled={exporting === 'portfolio' || holdings.length === 0}
            className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === 'portfolio' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Portfolio
              </>
            )}
          </motion.button>
        </div>

        {/* Watchlist Export */}
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-medium">Watchlist</h3>
              <p className="text-xs text-textSecondary">{Object.values(watchlists).flat().length} stocks</p>
            </div>
          </div>
          <p className="text-sm text-textSecondary mb-4">
            Export your watchlist stocks with watchlist names and timestamps.
          </p>
          
          {Object.keys(watchlists).length > 1 && (
            <select
              value={selectedWatchlist}
              onChange={(e) => setSelectedWatchlist(e.target.value)}
              className="w-full px-3 py-2 bg-surfaceLight rounded-lg outline-none focus:ring-2 focus:ring-primary/50 mb-4"
            >
              <option value="all">All Watchlists</option>
              {Object.keys(watchlists).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportWatchlist}
            disabled={exporting === 'watchlist' || Object.values(watchlists).flat().length === 0}
            className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === 'watchlist' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Watchlist
              </>
            )}
          </motion.button>
        </div>

        {/* Alerts Export */}
        <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-negative/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-negative" />
            </div>
            <div>
              <h3 className="font-medium">Alerts</h3>
              <p className="text-xs text-textSecondary">{alerts.length} active alerts</p>
            </div>
          </div>
          <p className="text-sm text-textSecondary mb-4">
            Export your price alerts with target prices and trigger conditions.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportAlerts}
            disabled={exporting === 'alerts' || alerts.length === 0}
            className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === 'alerts' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Alerts
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Export History Info */}
      <div className="mt-6 bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
        <h3 className="text-lg font-medium mb-4">Export Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-surfaceLight rounded-xl">
            <h4 className="text-sm font-medium mb-2">CSV Format</h4>
            <ul className="text-xs text-textSecondary space-y-1">
              <li>• Compatible with Excel, Google Sheets</li>
              <li>• Easy to import into other applications</li>
              <li>• Limited to flat data structures</li>
            </ul>
          </div>
          <div className="p-4 bg-surfaceLight rounded-xl">
            <h4 className="text-sm font-medium mb-2">JSON Format</h4>
            <ul className="text-xs text-textSecondary space-y-1">
              <li>• Complete data backup</li>
              <li>• Can be restored later</li>
              <li>• Best for data portability</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default DataExport
