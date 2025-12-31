import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Clock, ChevronRight, Newspaper, TrendingUp, TrendingDown, X, Filter } from 'lucide-react'

// Mock news data for different stocks
const MOCK_NEWS = {
  default: [
    { id: 1, title: 'Nifty 50 closes at record high amid strong FII inflow', source: 'Economic Times', time: '2h ago', url: '#', sentiment: 'positive', tags: ['Market', 'FII'] },
    { id: 2, title: 'RBI keeps interest rates unchanged, maintains accommodative stance', source: 'Livemint', time: '4h ago', url: '#', sentiment: 'neutral', tags: ['RBI', 'Policy'] },
    { id: 3, title: 'Global markets rally as US Fed signals rate cuts in 2025', source: 'Bloomberg', time: '5h ago', url: '#', sentiment: 'positive', tags: ['Global', 'Fed'] },
    { id: 4, title: 'India GDP growth slows to 5.4% in Q3', source: 'The Hindu', time: '6h ago', url: '#', sentiment: 'negative', tags: ['Economy', 'GDP'] },
    { id: 5, title: 'Oil prices stabilize amid Middle East tensions', source: 'Reuters', time: '8h ago', url: '#', sentiment: 'neutral', tags: ['Commodity', 'Oil'] },
  ],
  'RELIANCE.NS': [
    { id: 101, title: 'Reliance Jio adds 5 million new subscribers in Q3', source: 'Economic Times', time: '1h ago', url: '#', sentiment: 'positive', tags: ['Telecom', ' subscriber growth'] },
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
  positive: { bg: 'bg-positive/10', text: 'text-positive', border: 'border-positive/30' },
  negative: { bg: 'bg-negative/10', text: 'text-negative', border: 'border-negative/30' },
  neutral: { bg: 'bg-surfaceLight', text: 'text-textSecondary', border: 'border-white/10' }
}

const SENTIMENT_ICONS = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Newspaper
}

function NewsFeed({ stockId = null, onClose, compact = false, showFilters = true }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'positive', 'negative'
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    // Simulate API fetch
    setLoading(true)
    const fetchTimeout = setTimeout(() => {
      const stockNews = MOCK_NEWS[stockId] || MOCK_NEWS.default
      setNews(stockNews)
      setLoading(false)
    }, 800)

    return () => clearTimeout(fetchTimeout)
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

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Latest News</h4>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface rounded transition-colors"
            >
              <X className="w-4 h-4 text-textSecondary" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-surfaceLight rounded w-3/4 mb-2" />
                <div className="h-3 bg-surfaceLight rounded w-1/2" />
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
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-surfaceLight/50 ${
                  SENTIMENT_COLORS[item.sentiment].border
                }`}
              >
                <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-textSecondary">
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Market News</h2>
          <p className="text-textSecondary text-sm">
            {stockId ? `Latest updates for ${stockId.replace('.NS', '')}` : 'Top market headlines'}
          </p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-textSecondary flex-shrink-0" />
          {['all', 'positive', 'negative'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-primary text-white' 
                  : 'bg-surfaceLight text-textSecondary hover:bg-surface'
              }`}
            >
              {f === 'all' ? 'All News' : f === 'positive' ? 'Positive' : 'Negative'}
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
              className="glass rounded-xl p-6"
            >
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-surfaceLight rounded w-3/4" />
                <div className="h-4 bg-surfaceLight rounded w-1/2" />
                <div className="flex gap-2 mt-4">
                  <div className="h-6 bg-surfaceLight rounded w-16" />
                  <div className="h-6 bg-surfaceLight rounded w-16" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
                  className={`glass rounded-xl overflow-hidden border transition-all ${
                    isExpanded ? 'border-primary/30' : 'border-white/5'
                  }`}
                >
                  {/* Main Content */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Sentiment Indicator */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                        <SentimentIcon className={`w-5 h-5 ${colors.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg font-medium leading-snug">
                            {item.title}
                          </h3>
                          <ChevronRight className={`w-5 h-5 text-textSecondary flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} />
                        </div>

                        <div className="flex items-center gap-3 mt-3 text-sm text-textSecondary">
                          <span className="font-medium text-text">{item.source}</span>
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
                              className="px-2 py-0.5 bg-surfaceLight rounded text-xs text-textSecondary"
                            >
                              {tag}
                            </span>
                          ))}
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                              </span>
                              <span className="text-sm text-textSecondary">
                                Sentiment Analysis
                              </span>
                            </div>
                            
                            {item.url && item.url !== '#' && (
                              <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Read Full Article
                                <ExternalLink className="w-4 h-4" />
                              </motion.a>
                            )}
                          </div>

                          {/* Key Points (simulated AI analysis) */}
                          <div className="mt-4 p-4 bg-surfaceLight rounded-lg">
                            <h4 className="text-sm font-medium mb-2">Key Takeaways</h4>
                            <ul className="space-y-2 text-sm text-textSecondary">
                              <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                News impacts {item.sentiment === 'positive' ? 'positively' : item.sentiment === 'negative' ? 'negatively' : 'neutrally'} on stock price
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                {item.tags.join(', ')} are key themes in this update
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                Market reaction expected in next trading session
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
          className="w-full mt-6 py-3 rounded-xl bg-surfaceLight text-textSecondary hover:bg-surface transition-colors"
        >
          Load More News
        </motion.button>
      )}
    </motion.div>
  )
}

export default NewsFeed
