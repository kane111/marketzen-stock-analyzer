import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Clock, ChevronRight, Newspaper, TrendingUp, TrendingDown, X, Filter, RefreshCw, AlertCircle } from 'lucide-react'

// Enhanced mock news data with correct tags
const MOCK_NEWS = {
  default: [
    { id: 1, title: 'Nifty 50 closes at record high amid strong FII inflow', source: 'Economic Times', time: '2h ago', url: '#', sentiment: 'positive', tags: ['Market', 'FII'] },
    { id: 2, title: 'RBI keeps interest rates unchanged, maintains accommodative stance', source: 'Livemint', time: '4h ago', url: '#', sentiment: 'neutral', tags: ['RBI', 'Policy'] },
    { id: 3, title: 'Global markets rally as US Fed signals rate cuts in 2025', source: 'Bloomberg', time: '5h ago', url: '#', sentiment: 'positive', tags: ['Global', 'Fed'] },
    { id: 4, title: 'India GDP growth slows to 5.4% in Q3', source: 'The Hindu', time: '6h ago', url: '#', sentiment: 'negative', tags: ['Economy', 'GDP'] },
    { id: 5, title: 'Oil prices stabilize amid Middle East tensions', source: 'Reuters', time: '8h ago', url: '#', sentiment: 'neutral', tags: ['Commodity', 'Oil'] },
  ],
  'RELIANCE.NS': [
    { id: 101, title: 'Reliance Jio adds 5 million new subscribers in Q3', source: 'Economic Times', time: '1h ago', url: '#', sentiment: 'positive', tags: ['Telecom', 'Subscriber Growth'] },
    { id: 102, title: 'Reliance Retail reports 25% revenue growth in FY24', source: 'Livemint', time: '3h ago', url: '#', sentiment: 'positive', tags: ['Retail', 'Revenue'] },
    { id: 103, title: 'Oil refining margins remain strong for Reliance', source: 'Bloomberg', time: '5h ago', url: '#', sentiment: 'positive', tags: ['Oil', 'Refining'] },
    { id: 104, title: 'Reliance Energy secures new solar project contract', source: 'The Hindu', time: '7h ago', url: '#', sentiment: 'positive', tags: ['Energy', 'Solar'] },
  ],
  'TCS.NS': [
    { id: 201, title: 'TCS wins multi-year contract from European bank', source: 'Economic Times', time: '2h ago', url: '#', sentiment: 'positive', tags: ['IT', 'Contract'] },
    { id: 202, title: 'TCS announces new AI platform for enterprises', source: 'Livemint', time: '4h ago', url: '#', sentiment: 'positive', tags: ['AI', 'Innovation'] },
    { id: 203, title: 'Quarterly results beat analyst expectations', source: 'Bloomberg', time: '6h ago', url: '#', sentiment: 'positive', tags: ['Results', 'Earnings'] },
  ],
  'HDFCBANK.NS': [
    { id: 301, title: 'HDFC Bank reports 20% profit growth in Q3', source: 'Economic Times', time: '1h ago', url: '#', sentiment: 'positive', tags: ['Banking', 'Profit'] },
    { id: 302, title: 'Loan growth accelerates for HDFC Bank', source: 'Livemint', time: '3h ago', url: '#', sentiment: 'positive', tags: ['Banking', 'Loans'] },
    { id: 303, title: 'HDFC Bank launches new digital banking features', source: 'The Hindu', time: '5h ago', url: '#', sentiment: 'neutral', tags: ['Digital', 'Innovation'] },
  ],
  'INFY.NS': [
    { id: 401, title: 'Infosys wins $200 million deal from US client', source: 'Economic Times', time: '2h ago', url: '#', sentiment: 'positive', tags: ['IT', 'Deal'] },
    { id: 402, title: 'Infosys expands AI partnership with Microsoft', source: 'Livemint', time: '4h ago', url: '#', sentiment: 'positive', tags: ['AI', 'Partnership'] },
    { id: 403, title: 'Quarterly guidance raised by Infosys', source: 'Bloomberg', time: '6h ago', url: '#', sentiment: 'positive', tags: ['Guidance', 'Results'] },
  ],
}

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
  const [filter, setFilter] = useState('all') // 'all', 'positive', 'negative', 'neutral'
  const [expandedId, setExpandedId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Simulate live news updates
  useEffect(() => {
    const fetchNews = () => {
      setLoading(true)
      const fetchTimeout = setTimeout(() => {
        const stockNews = MOCK_NEWS[stockId] || MOCK_NEWS.default
        setNews(stockNews)
        setLoading(false)
        setLastUpdated(new Date())
      }, 600)

      return () => clearTimeout(fetchTimeout)
    }

    fetchNews()
    
    // Simulate periodic updates (every 60 seconds during market hours)
    const interval = setInterval(fetchNews, 60000)
    return () => clearInterval(interval)
  }, [stockId])

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

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      const stockNews = MOCK_NEWS[stockId] || MOCK_NEWS.default
      setNews(stockNews)
      setLoading(false)
      setLastUpdated(new Date())
    }, 800)
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
