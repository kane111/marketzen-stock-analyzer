import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Plus, Clock, TrendingUp, Building2 } from 'lucide-react'
import { Spinner } from './common/LoadingSkeleton'

// Yahoo Finance search API for Indian stocks
const YAHOO_SEARCH = 'https://query1.finance.yahoo.com/v1/finance/search'
const CORS_PROXY = 'https://corsproxy.io/?'

function SearchOverlay({ isOpen, onClose, onAdd }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('marketzen_recent')
    return saved ? JSON.parse(saved) : []
  })
  const inputRef = useRef(null)

  // Get all items combined (recent + results) for keyboard navigation
  const getAllItems = () => {
    if (query.length < 2) return recentSearches
    return results
  }

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    const items = getAllItems()
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.min(prev + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && items[highlightedIndex]) {
        handleSelect(items[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // Reset highlighted index when query changes
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [query, results, recentSearches])

  // Focus handling
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      const timeouts = [
        setTimeout(() => inputRef.current?.focus(), 50),
        setTimeout(() => inputRef.current?.focus(), 150),
        setTimeout(() => inputRef.current?.focus(), 300),
      ]
      return () => timeouts.forEach(clearTimeout)
    }
  }, [isOpen])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${CORS_PROXY}${encodeURIComponent(YAHOO_SEARCH + '?q=' + encodeURIComponent(query) + '&quotes_count=15)')}`, {
          headers: {
            'Accept': 'application/json'
          }
        })
        const data = await res.json()
        
        if (data.quotes) {
          // Filter for Indian stocks (NSE suffix) and format them
          const formatted = data.quotes
            .filter(q => q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')))
            .map(q => ({
              id: q.symbol,
              symbol: q.symbol.replace('.NS', '').replace('.BO', ''),
              name: q.shortname || q.longname || q.symbol,
              exchange: q.symbol.endsWith('.NS') ? 'NSE' : 'BSE'
            }))
          setResults(formatted)
        } else {
          setResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        // Fallback: create suggestions based on query
        setResults(createFallbackResults(query))
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  // Fallback results when API fails
  const createFallbackResults = (q) => {
    const commonStocks = [
      { id: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE' },
      { id: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE' },
      { id: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE' },
      { id: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE' },
      { id: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE' },
      { id: 'INFY.NS', symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE' },
      { id: 'BAJFINANCE.NS', symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', exchange: 'NSE' },
      { id: 'BHARTIARTL.NS', symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE' },
      { id: 'ASIANPAINT.NS', symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', exchange: 'NSE' },
      { id: 'MARUTI.NS', symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', exchange: 'NSE' },
    ]
    
    const lowerQ = q.toLowerCase()
    return commonStocks.filter(s => 
      s.symbol.toLowerCase().includes(lowerQ) || 
      s.name.toLowerCase().includes(lowerQ)
    ).slice(0, 8)
  }

  const handleSelect = (stock) => {
    onAdd({
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange || 'NSE'
    })
    
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.id !== stock.id)
      const updated = [stock, ...filtered].slice(0, 5)
      localStorage.setItem('marketzen_recent', JSON.stringify(updated))
      return updated
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const overlayVariants = {
    hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
    visible: { opacity: 1, backdropFilter: 'blur(8px)' }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
        >
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-terminal-panel border border-terminal-border rounded-xl overflow-hidden shadow-2xl"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-terminal-border">
              <Search className="w-5 h-5 text-terminal-dim" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search NSE/BSE stocks..."
                autoFocus
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-terminal-dim font-mono"
              />
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-terminal-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-terminal-dim" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="p-8 flex flex-col items-center justify-center">
                  <Spinner size="1.5rem" />
                  <p className="text-sm text-terminal-dim mt-3 font-mono">Searching stocks...</p>
                </div>
              )}

              {!loading && query.length < 2 && recentSearches.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-terminal-dim mb-3 font-mono">
                    <Clock className="w-4 h-4" />
                    <span>Recent Searches</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((stock, index) => (
                      <motion.button
                        key={stock.id}
                        onClick={() => handleSelect(stock)}
                        whileHover={{ x: 4 }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          index === highlightedIndex 
                            ? 'bg-terminal-green/20 border border-terminal-green/30' 
                            : 'hover:bg-terminal-bg'
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-terminal-green/20 flex items-center justify-center">
                          <span className="text-xs font-bold font-mono text-terminal-green">{stock.symbol.substring(0, 2)}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{stock.name}</p>
                          <p className="text-sm text-terminal-dim font-mono">{stock.symbol}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-terminal-bg rounded text-terminal-dim font-mono">
                          {stock.exchange || 'NSE'}
                        </span>
                        {index === highlightedIndex && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-terminal-green"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-terminal-dim font-mono">
                    <Building2 className="w-4 h-4" />
                    <span>Indian Stocks</span>
                    <span className="text-xs text-terminal-dim/50">({results.length} found)</span>
                  </div>
                  {results.map((stock, index) => (
                    <motion.button
                      key={stock.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelect(stock)}
                      whileHover={{ x: 4 }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        index === highlightedIndex 
                          ? 'bg-terminal-green/20 border border-terminal-green/30' 
                          : 'hover:bg-terminal-bg'
                      }`}
                    >
                      <div className="w-10 h-10 rounded bg-terminal-green/20 flex items-center justify-center">
                        <span className="text-sm font-bold font-mono text-terminal-green">{stock.symbol.substring(0, 2)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{stock.name}</p>
                        <p className="text-sm text-terminal-dim font-mono">{stock.symbol}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-terminal-bg rounded text-terminal-dim font-mono">
                          {stock.exchange || 'NSE'}
                        </span>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`p-2 rounded-lg ${
                            index === highlightedIndex 
                              ? 'bg-terminal-green text-terminal-bg' 
                              : 'bg-terminal-green/20'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="p-8 text-center text-terminal-dim">
                  <p className="font-mono">No stocks found for "{query}"</p>
                  <p className="text-sm mt-2 font-mono">Try searching with stock symbol or company name</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-terminal-border text-xs text-terminal-dim flex items-center justify-between font-mono bg-terminal-bg/50">
              <div className="flex items-center gap-3">
                <kbd className="px-2 py-1 bg-terminal-panel border border-terminal-border rounded">↑↓</kbd>
                <span>to navigate</span>
                <kbd className="px-2 py-1 bg-terminal-panel border border-terminal-border rounded">↵</kbd>
                <span>to select</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-terminal-panel border border-terminal-border rounded">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchOverlay
