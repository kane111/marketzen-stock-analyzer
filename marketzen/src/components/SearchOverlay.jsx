import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Plus, Clock, TrendingUp } from 'lucide-react'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

function SearchOverlay({ isOpen, onClose, onAdd }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('marketzen_recent')
    return saved ? JSON.parse(saved) : []
  })
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${COINGECKO_BASE}/search?query=${query}`)
        const data = await res.json()
        setResults(data.coins?.slice(0, 10) || [])
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleSelect = (coin) => {
    onAdd({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.large
    })
    
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.id !== coin.id)
      const updated = [coin, ...filtered].slice(0, 5)
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
            className="relative w-full max-w-xl glass rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <Search className="w-5 h-5 text-textSecondary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for assets..."
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-textSecondary"
              />
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-surface rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-textSecondary" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="p-4 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              )}

              {!loading && query.length < 2 && recentSearches.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-textSecondary mb-3">
                    <Clock className="w-4 h-4" />
                    <span>Recent Searches</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((coin) => (
                      <motion.button
                        key={coin.id}
                        onClick={() => handleSelect(coin)}
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors text-left"
                      >
                        <img src={coin.thumb} alt={coin.name} className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <p className="font-medium">{coin.name}</p>
                          <p className="text-sm text-textSecondary">{coin.symbol.toUpperCase()}</p>
                        </div>
                        <Plus className="w-5 h-5 text-textSecondary opacity-0 group-hover:opacity-100" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-textSecondary">
                    <TrendingUp className="w-4 h-4" />
                    <span>Results</span>
                  </div>
                  {results.map((coin, index) => (
                    <motion.button
                      key={coin.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelect(coin)}
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors text-left"
                    >
                      <img src={coin.large} alt={coin.name} className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <p className="font-medium">{coin.name}</p>
                        <p className="text-sm text-textSecondary">{coin.symbol.toUpperCase()}</p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="p-2 rounded-lg bg-primary/10"
                      >
                        <Plus className="w-4 h-4 text-primary" />
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
              )}

              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="p-8 text-center text-textSecondary">
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 text-xs text-textSecondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-surface rounded">ESC</kbd>
                <span>to close</span>
              </div>
              <span>Press ↵ to select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchOverlay
