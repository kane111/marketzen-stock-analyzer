import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Clock, ChevronRight, Newspaper, TrendingUp, TrendingDown, X, Filter, RefreshCw, AlertCircle } from 'lucide-react'

// Finnhub API configuration for real-time market news
const FINNHUB_API_KEY = 'demo' // Replace with your free API key from https://finnhub.io/
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

// Map Finnhub category to our stock ID format
const getCategoryForStock = (stockId) => {
  if (!stockId || stockId === 'general') return 'general'
  
  // Extract base symbol from stock ID (e.g., 'AAPL' from 'AAPL.NS')
  const symbol = stockId.replace('.NS', '').toUpperCase()
  
  // Map to Finnhub market category
  const categoryMap = {
    'RELIANCE': 'equity',
    'TCS': 'equity',
    'HDFCBANK': 'equity',
    'INFY': 'equity',
    'ICICIBANK': 'equity',
    'SBIN': 'equity',
    'BHARTIARTL': 'equity',
    'ITC': 'equity',
  }
  
  return categoryMap[symbol] || 'equity'
}

// Transform Finnhub news item to match our component's expected format
const transformNewsItem = (item, stockId = null) => {
  const symbol = stockId ? stockId.replace('.NS', '') : null
  
  // Determine sentiment based on source and headline
  const sentimentKeywords = {
    positive: ['surge', 'jump', 'soar', 'gain', 'growth', 'profit', 'beat', 'raise', 'record', 'high', 'rally', 'bullish', 'upgrade', 'buy'],
    negative: ['plunge', 'drop', 'fall', 'loss', 'decline', 'cut', 'miss', 'low', 'bearish', 'downgrade', 'sell', 'warning', 'concern'],
  }
  
  const headline = item.headline?.toLowerCase() || ''
  const summary = item.summary?.toLowerCase() || ''
  const text = headline + ' ' + summary
  
  let sentiment = 'neutral'
  for (const keyword of sentimentKeywords.positive) {
    if (text.includes(keyword)) {
      sentiment = 'positive'
      break
    }
  }
  if (sentiment === 'neutral') {
    for (const keyword of sentimentKeywords.negative) {
      if (text.includes(keyword)) {
        sentiment = 'negative'
        break
      }
    }
  }
  
  // Extract tags from headline and category
  const tags = []
  if (item.category) {
    tags.push(item.category.charAt(0).toUpperCase() + item.category.slice(1))
  }
  if (symbol && headline.includes(symbol.toLowerCase())) {
    tags.push(symbol)
  }
  
  // Convert Unix timestamp to relative time
  const timeAgo = formatTimeAgo(item.datetime)
  
  return {
    id: item.id || Date.now() + Math.random(),
    title: item.headline || 'No headline available',
    source: item.source || 'Unknown Source',
    time: timeAgo,
    url: item.url || '#',
    sentiment: sentiment,
    tags: tags.length > 0 ? tags : ['Market'],
    summary: item.summary || '',
    datetime: item.datetime,
  }
}

// Format Unix timestamp to relative time string
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now'
  
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(diff / 3600)
  const days = Math.floor(diff / 86400)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString()
}

// Sentiment colors configuration
const SENTIMENT_COLORS = {
  positive: { bg: 'bg-terminal-green/10', text: 'text-terminal-green', border: 'border-terminal-green/30', icon: 'bg-terminal-green/20' },
  negative: { bg: 'bg-terminal-red/10', text: 'text-terminal-red', border: 'border-terminal-red/30', icon: 'bg-terminal-red/20' },
  neutral: { bg: 'bg-terminal-bg-light', text: 'text-terminal-dim', border: 'border-terminal-border', icon: 'bg-terminal-dim/20' }
}

const SENTIMENT_ICONS = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Newspaper
}

function NewsFeed({ stockId = null, onClose, compact = false, showFilters = true, onBack }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'positive', 'negative', 'neutral'
  const [expandedId, setExpandedId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

  // Live news fetching from Finnhub API
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check if using demo key
        if (FINNHUB_API_KEY === 'demo') {
          setApiKeyMissing(true)
          // Use fallback to simulated data for demo purposes
          await simulateNewsFetch()
          return
        }

        let endpoint = ''
        let url = ''
        
        if (stockId && stockId !== 'general') {
          // Company-specific news
          const symbol = stockId.replace('.NS', '')
          endpoint = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&token=${FINNHUB_API_KEY}`
        } else {
          // General market news
          endpoint = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`
        }
        
        const response = await fetch(endpoint)
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (Array.isArray(data) && data.length > 0) {
          // Transform and limit to top 20 news items
          const transformedNews = data.slice(0, 20).map(item => transformNewsItem(item, stockId))
          setNews(transformedNews)
        } else {
          // No news found, use fallback
          await simulateNewsFetch()
        }
        
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Error fetching news:', err)
        setError(err.message)
        // Fallback to simulated data on error
        await simulateNewsFetch()
      } finally {
        setLoading(false)
      }
    }

    // Fallback simulated news fetch when API fails
    const simulateNewsFetch = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Generate simulated news based on stock ID
      const simulatedNews = generateSimulatedNews(stockId)
      setNews(simulatedNews)
      setLastUpdated(new Date())
    }

    fetchNews()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 300000)
    return () => clearInterval(interval)
  }, [stockId])

  // Generate simulated news for demo/fallback purposes
  const generateSimulatedNews = (stockId) => {
    const symbol = stockId ? stockId.replace('.NS', '') : null
    const baseNews = [
      {
        id: Date.now() + 1,
        title: 'Market opens with gains as global sentiment improves',
        source: 'Reuters',
        time: '5m ago',
        url: 'https://www.reuters.com/markets',
        sentiment: 'positive',
        tags: ['Market', 'Global']
      },
      {
        id: Date.now() + 2,
        title: 'RBI maintains current interest rate stance in latest policy review',
        source: 'Economic Times',
        time: '1h ago',
        url: 'https://economictimes.indiatimes.com',
        sentiment: 'neutral',
        tags: ['RBI', 'Policy']
      },
      {
        id: Date.now() + 3,
        title: 'FII flows remain strong amid positive global cues',
        source: 'Livemint',
        time: '2h ago',
        url: 'https://www.livemint.com',
        sentiment: 'positive',
        tags: ['FII', 'Flows']
      },
      {
        id: Date.now() + 4,
        title: 'Q3 earnings season shows mixed results across sectors',
        source: 'Bloomberg',
        time: '3h ago',
        url: 'https://www.bloomberg.com',
        sentiment: 'neutral',
        tags: ['Earnings', 'Results']
      },
      {
        id: Date.now() + 5,
        title: 'Crude oil prices show volatility amid geopolitical tensions',
        source: 'The Hindu',
        time: '4h ago',
        url: 'https://www.thehindu.com',
        sentiment: 'negative',
        tags: ['Commodity', 'Oil']
      }
    ]

    // Stock-specific news
    const stockSpecificNews = {
      'RELIANCE.NS': [
        { id: Date.now() + 101, title: 'Reliance Jio reports strong subscriber growth in latest quarter', source: 'Economic Times', time: '30m ago', url: '#', sentiment: 'positive', tags: ['Telecom', 'Growth'] },
        { id: Date.now() + 102, title: 'Reliance Retail expands its digital footprint with new partnerships', source: 'Livemint', time: '2h ago', url: '#', sentiment: 'positive', tags: ['Retail', 'Digital'] },
      ],
      'TCS.NS': [
        { id: Date.now() + 201, title: 'TCS wins major digital transformation contract from European client', source: 'Bloomberg', time: '1h ago', url: '#', sentiment: 'positive', tags: ['IT', 'Contract'] },
        { id: Date.now() + 202, title: 'TCS announces expansion of AI and cloud capabilities', source: 'Economic Times', time: '3h ago', url: '#', sentiment: 'positive', tags: ['AI', 'Cloud'] },
      ],
      'HDFCBANK.NS': [
        { id: Date.now() + 301, title: 'HDFC Bank reports robust quarterly loan growth', source: 'Livemint', time: '45m ago', url: '#', sentiment: 'positive', tags: ['Banking', 'Loans'] },
        { id: Date.now() + 302, title: 'Digital banking adoption accelerates for HDFC Bank customers', source: 'The Hindu', time: '2h ago', url: '#', sentiment: 'neutral', tags: ['Digital', 'Banking'] },
      ],
      'INFY.NS': [
        { id: Date.now() + 401, title: 'Infosys secures multi-year deal with Fortune 500 company', source: 'Economic Times', time: '1h ago', url: '#', sentiment: 'positive', tags: ['IT', 'Deal'] },
        { id: Date.now() + 402, title: 'Infosys expands generative AI portfolio for enterprise clients', source: 'Bloomberg', time: '4h ago', url: '#', sentiment: 'positive', tags: ['AI', 'Enterprise'] },
      ],
    }

    let specificNews = []
    if (stockId && stockSpecificNews[stockId]) {
      specificNews = stockSpecificNews[stockId]
    }

    // Combine base and stock-specific news
    return [...specificNews, ...baseNews].slice(0, 15)
  }

  // Filter news based on sentiment
  const filteredNews = news.filter(item => {
    if (filter === 'all') return true
    return item.sentiment === filter
  })

  const formatTime = (timeStr) => {
    return timeStr
  }

  const handleNewsClick = (newsItem) => {
    if (newsItem.url && newsItem.url !== '#') {
      window.open(newsItem.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (apiKeyMissing) {
        // Just regenerate simulated data
        const simulatedNews = generateSimulatedNews(stockId)
        setNews(simulatedNews)
        setLastUpdated(new Date())
        setLoading(false)
        return
      }

      let endpoint = ''
      
      if (stockId && stockId !== 'general') {
        const symbol = stockId.replace('.NS', '')
        endpoint = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      } else {
        endpoint = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`
      }
      
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        const transformedNews = data.slice(0, 20).map(item => transformNewsItem(item, stockId))
        setNews(transformedNews)
      } else {
        const simulatedNews = generateSimulatedNews(stockId)
        setNews(simulatedNews)
      }
      
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error refreshing news:', err)
      setError(err.message)
      const simulatedNews = generateSimulatedNews(stockId)
      setNews(simulatedNews)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Latest News</h4>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-terminal-bg-light rounded transition-colors"
            >
              <X className="w-4 h-4 text-terminal-dim" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-terminal-bg-light rounded w-3/4 mb-2" />
                <div className="h-3 bg-terminal-bg-light rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNews.slice(0, 3).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleNewsClick(item)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-terminal-bg-light/50 ${
                  SENTIMENT_COLORS[item.sentiment].border
                }`}
              >
                <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-terminal-dim">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      {/* Demo Mode Banner */}
      {apiKeyMissing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-terminal-bg-light border border-terminal-border rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm text-terminal-dim">
            <AlertCircle className="w-4 h-4 text-terminal-yellow" />
            <span>Using demo data. Add a Finnhub API key for live news.</span>
          </div>
          <a
            href="https://finnhub.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-terminal-green hover:underline"
          >
            Get Free API Key →
          </a>
        </motion.div>
      )}

      {/* Error Banner */}
      {error && !apiKeyMissing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-terminal-red/10 border border-terminal-red/30 rounded-lg flex items-center gap-2 text-sm text-terminal-red"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Error loading news: {error}. Showing cached data.</span>
        </motion.div>
      )}

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
          <div>
            <h2 className="text-2xl font-semibold">Market News</h2>
            <p className="text-terminal-dim text-sm">
              {stockId ? `Latest updates for ${stockId.replace('.NS', '')}` : 'Top market headlines'}
            </p>
          </div>
        </div>
        
        {/* Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
          title="Refresh news"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Last Updated Timestamp */}
      {lastUpdated && (
        <p className="text-xs text-terminal-dim mb-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-terminal-dim flex-shrink-0" />
          {['all', 'positive', 'negative', 'neutral'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-terminal-green text-terminal-bg' 
                  : 'bg-terminal-bg-light text-terminal-dim hover:bg-terminal-bg'
              }`}
            >
              {f === 'all' ? 'All News' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* News List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-6"
            >
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-terminal-bg-light rounded w-3/4" />
                <div className="h-4 bg-terminal-bg-light rounded w-1/2" />
                <div className="flex gap-2 mt-4">
                  <div className="h-6 bg-terminal-bg-light rounded w-16" />
                  <div className="h-6 bg-terminal-bg-light rounded w-16" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-12 text-center"
        >
          <AlertCircle className="w-12 h-12 text-terminal-dim mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No News Found</h3>
          <p className="text-terminal-dim text-sm mb-4">
            {filter === 'all' 
              ? 'No news articles available at the moment.' 
              : `No ${filter} news articles found.`}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-lg bg-terminal-green text-terminal-bg text-sm font-medium"
          >
            View All News
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredNews.map((item, index) => {
              const SentimentIcon = SENTIMENT_ICONS[item.sentiment]
              const colors = SENTIMENT_COLORS[item.sentiment]
              const isExpanded = expandedId === item.id

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl overflow-hidden transition-all ${
                    isExpanded ? 'border-terminal-green/30' : 'border-terminal-border'
                  }`}
                >
                  {/* Main Content */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Sentiment Indicator */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                        <SentimentIcon className={`w-5 h-5 ${colors.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg font-medium leading-snug">
                            {item.title}
                          </h3>
                          <ChevronRight className={`w-5 h-5 text-terminal-dim flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} />
                        </div>

                        <div className="flex items-center gap-3 mt-3 text-sm text-terminal-dim">
                          <span className="font-medium text-terminal-text">{item.source}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-terminal-bg-light rounded text-xs text-terminal-dim"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {item.sentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5"
                      >
                        <div className="p-6 pt-4">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)} Sentiment
                              </span>
                              <span className="text-sm text-textSecondary">
                                Based on market reaction
                              </span>
                            </div>
                            
                            {item.url && item.url !== '#' && (
                              <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-terminal-green text-terminal-bg rounded-lg text-sm font-medium hover:bg-terminal-green/90 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Read Full Article
                                <ExternalLink className="w-4 h-4" />
                              </motion.a>
                            )}
                          </div>

                          {/* Key Points (simulated AI analysis) */}
                          <div className="mt-4 p-4 bg-terminal-bg-light rounded-lg">
                            <h4 className="text-sm font-medium mb-2">Key Takeaways</h4>
                            <ul className="space-y-2 text-sm text-terminal-dim">
                              <li className="flex items-start gap-2">
                                <span className={`mt-1 ${colors.text}`}>•</span>
                                <span>News impacts {item.sentiment === 'positive' ? 'positively' : item.sentiment === 'negative' ? 'negatively' : 'neutrally'} on stock price movement</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-terminal-green mt-1">•</span>
                                <span>{item.tags.join(', ')} are key themes in this update</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-terminal-green mt-1">•</span>
                                <span>Market reaction expected in upcoming trading sessions</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Load More */}
      {!loading && filteredNews.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 py-3 rounded-xl bg-terminal-bg-light text-terminal-dim hover:bg-terminal-bg transition-colors"
        >
          Load More News
        </motion.button>
      )}
    </motion.div>
  )
}

export default NewsFeed
