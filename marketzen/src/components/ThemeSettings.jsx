import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Sun, Moon, Monitor, Save, RotateCcw, Check, X, ChevronDown, Layout, BarChart2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function ThemeSettings() {
  const { 
    themeName, 
    currentTheme, 
    chartStyle, 
    compactMode,
    colorPresets, 
    setTheme, 
    setCustomTheme, 
    resetTheme, 
    toggleChartStyle,
    toggleCompactMode 
  } = useTheme()

  const [activeSection, setActiveSection] = useState('presets')
  const [showCustomColors, setShowCustomColors] = useState(false)
  const [customColors, setCustomColors] = useState({
    primary: currentTheme().primary,
    positive: currentTheme().positive,
    negative: currentTheme().negative,
    background: currentTheme().background,
    surface: currentTheme().surface,
    text: currentTheme().text
  })
  const [notification, setNotification] = useState(null)

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSaveCustomTheme = () => {
    setCustomTheme(customColors)
    showNotification('Custom theme saved', 'success')
  }

  const sections = [
    { id: 'presets', label: 'Color Presets', icon: Palette },
    { id: 'display', label: 'Display Options', icon: Layout },
    { id: 'chart', label: 'Chart Style', icon: BarChart2 }
  ]

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
              'bg-negative/20 text-negative border border-negative/30'
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Theme Settings</h2>
        <p className="text-textSecondary text-sm">Customize the look and feel of MarketZen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Navigation */}
        <div className="space-y-2">
          {sections.map((section) => (
            <motion.button
              key={section.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeSection === section.id
                  ? 'bg-primary text-white'
                  : 'bg-surfaceLight hover:bg-surfaceLight/80 text-textSecondary'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <span className="font-medium">{section.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
            {/* Color Presets Section */}
            {activeSection === 'presets' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-medium mb-4">Color Presets</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {Object.entries(colorPresets).map(([key, preset]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme(key)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        themeName === key
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-surfaceLight hover:bg-surfaceLight/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex gap-1">
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ background: preset.primary }}
                          />
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ background: preset.positive }}
                          />
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ background: preset.negative }}
                          />
                        </div>
                        {themeName === key && (
                          <Check className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="font-medium text-sm">{preset.name}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Custom Colors Toggle */}
                <div className="border-t border-white/10 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCustomColors(!showCustomColors)}
                    className="w-full flex items-center justify-between p-4 bg-surfaceLight rounded-xl"
                  >
                    <span className="font-medium">Custom Colors</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showCustomColors ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {showCustomColors && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-4 bg-surfaceLight/50 rounded-b-xl mt-1">
                          {[
                            { key: 'primary', label: 'Primary Color' },
                            { key: 'positive', label: 'Positive Color' },
                            { key: 'negative', label: 'Negative Color' },
                            { key: 'background', label: 'Background' },
                            { key: 'surface', label: 'Surface' },
                            { key: 'text', label: 'Text' }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-4">
                              <label className="w-32 text-sm text-textSecondary">{label}</label>
                              <input
                                type="color"
                                value={customColors[key]}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-10 h-10 rounded-lg cursor-pointer"
                              />
                              <input
                                type="text"
                                value={customColors[key]}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                                className="flex-1 px-3 py-2 bg-surface rounded-lg text-sm font-mono"
                              />
                            </div>
                          ))}

                          <div className="flex gap-3 pt-4">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleSaveCustomTheme}
                              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save Theme
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={resetTheme}
                              className="px-4 py-2 bg-surfaceLight rounded-lg font-medium flex items-center gap-2"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Reset
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Display Options Section */}
            {activeSection === 'display' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-medium mb-4">Display Options</h3>
                
                <div className="space-y-4">
                  {/* Compact Mode */}
                  <div className="flex items-center justify-between p-4 bg-surfaceLight rounded-xl">
                    <div className="flex items-center gap-3">
                      <Layout className="w-5 h-5 text-textSecondary" />
                      <div>
                        <p className="font-medium">Compact Mode</p>
                        <p className="text-sm text-textSecondary">Reduce spacing for more content</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleCompactMode}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        compactMode ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <motion.div
                        animate={{ x: compactMode ? 26 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  {/* Preview Card */}
                  <div className="p-4 bg-surfaceLight rounded-xl">
                    <p className="text-sm font-medium mb-3">Preview</p>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 rounded-lg bg-surface border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 mb-2" />
                        <div className="h-2 bg-primary/30 rounded w-3/4 mb-1" />
                        <div className="h-2 bg-positive/30 rounded w-1/2" />
                      </div>
                      <div className="flex-1 p-3 rounded-lg bg-surface border border-white/5 opacity-50">
                        <div className="w-8 h-8 rounded-full bg-primary/20 mb-2" />
                        <div className="h-2 bg-primary/30 rounded w-3/4 mb-1" />
                        <div className="h-2 bg-positive/30 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chart Style Section */}
            {activeSection === 'chart' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-medium mb-4">Chart Style</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setChartStyle('area')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      chartStyle === 'area'
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-surfaceLight hover:bg-surfaceLight/80'
                    }`}
                  >
                    <div className="h-20 bg-surface rounded-lg mb-3 overflow-hidden relative">
                      <svg className="w-full h-full" viewBox="0 0 100 50">
                        <path
                          d="M0,50 Q25,30 50,35 T100,20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-primary"
                        />
                        <path
                          d="M0,50 Q25,30 50,35 T100,20 L100,50 L0,50"
                          fill="currentColor"
                          className="text-primary"
                          opacity="0.3"
                        />
                      </svg>
                    </div>
                    <p className="font-medium text-sm">Area Chart</p>
                    {chartStyle === 'area' && (
                      <Check className="w-4 h-4 text-primary mt-2" />
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setChartStyle('candlestick')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      chartStyle === 'candlestick'
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-surfaceLight hover:bg-surfaceLight/80'
                    }`}
                  >
                    <div className="h-20 bg-surface rounded-lg mb-3 overflow-hidden relative">
                      <svg className="w-full h-full" viewBox="0 0 100 50">
                        {/* Candlestick patterns */}
                        <rect x="20" y="15" width="6" height="20" fill="currentColor" className="text-positive" />
                        <line x1="23" y1="10" x2="23" y2="15" stroke="currentColor" className="text-positive" strokeWidth="2" />
                        <line x1="23" y1="35" x2="23" y2="40" stroke="currentColor" className="text-positive" strokeWidth="2" />
                        
                        <rect x="45" y="10" width="6" height="25" fill="currentColor" className="text-negative" />
                        <line x1="48" y1="5" x2="48" y2="10" stroke="currentColor" className="text-negative" strokeWidth="2" />
                        <line x1="48" y1="35" x2="48" y2="45" stroke="currentColor" className="text-negative" strokeWidth="2" />
                        
                        <rect x="70" y="20" width="6" height="15" fill="currentColor" className="text-positive" />
                        <line x1="73" y1="15" x2="73" y2="20" stroke="currentColor" className="text-positive" strokeWidth="2" />
                        <line x1="73" y1="35" x2="73" y2="40" stroke="currentColor" className="text-positive" strokeWidth="2" />
                      </svg>
                    </div>
                    <p className="font-medium text-sm">Candlestick</p>
                    {chartStyle === 'candlestick' && (
                      <Check className="w-4 h-4 text-primary mt-2" />
                    )}
                  </motion.button>
                </div>

                <div className="p-4 bg-surfaceLight rounded-xl">
                  <p className="text-sm text-textSecondary">
                    {chartStyle === 'area' 
                      ? 'Area charts show the total value over time with a filled region.' 
                      : 'Candlestick charts show open, high, low, and close prices for each period.'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ThemeSettings
