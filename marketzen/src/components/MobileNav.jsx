import { useState } from 'react'
import { motion } from 'framer-motion'
import { Home, TrendingUp, Star, Settings } from 'lucide-react'

function MobileNav({ watchlist, selectedStock, onSelect }) {
  const navItems = [
    { icon: Home, label: 'Home' },
    { icon: TrendingUp, label: 'Markets' },
    { icon: Star, label: 'Watchlist', badge: watchlist.length },
    { icon: Settings, label: 'Settings' }
  ]

  const [activeTab, setActiveTab] = useState('home')

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-40"
    >
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => (
          <motion.button
            key={item.label}
            onClick={() => {
              setActiveTab(item.label.toLowerCase())
              if (item.label === 'Watchlist') {
                // Show watchlist
              }
            }}
            whileTap={{ scale: 0.9 }}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
              activeTab === item.label.toLowerCase()
                ? 'text-primary'
                : 'text-textSecondary hover:text-text'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
            {item.badge && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
            {activeTab === item.label.toLowerCase() && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary/10 rounded-xl"
                transition={{ type: 'spring', damping: 25 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.nav>
  )
}

export default MobileNav
