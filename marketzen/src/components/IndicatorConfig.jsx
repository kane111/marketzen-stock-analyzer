import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Sliders, Save, RotateCcw, Check, X, ChevronDown, ChevronUp } from 'lucide-react'

// Default indicator parameters
const DEFAULT_PARAMS = {
  rsi: {
    period: 14,
    overbought: 70,
    oversold: 30
  },
  macd: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9
  },
  sma: {
    shortPeriod: 20,
    longPeriod: 50
  },
  ema: {
    shortPeriod: 12,
    longPeriod: 26
  },
  bollinger: {
    period: 20,
    stdDev: 2
  },
  volume: {
    maPeriod: 20
  }
}

// Preset configurations
const PRESETS = {
  aggressive: {
    name: 'Aggressive',
    description: 'Shorter periods for more sensitive signals',
    params: {
      rsi: { period: 7, overbought: 80, oversold: 20 },
      macd: { fastPeriod: 8, slowPeriod: 17, signalPeriod: 6 },
      sma: { shortPeriod: 10, longPeriod: 30 },
      ema: { shortPeriod: 8, longPeriod: 17 },
      bollinger: { period: 14, stdDev: 2 },
      volume: { maPeriod: 14 }
    }
  },
  classic: {
    name: 'Classic',
    description: 'Standard settings for most trading styles',
    params: DEFAULT_PARAMS
  },
  conservative: {
    name: 'Conservative',
    description: 'Longer periods for fewer false signals',
    params: {
      rsi: { period: 21, overbought: 65, oversold: 35 },
      macd: { fastPeriod: 17, slowPeriod: 34, signalPeriod: 12 },
      sma: { shortPeriod: 30, longPeriod: 100 },
      ema: { shortPeriod: 17, longPeriod: 34 },
      bollinger: { period: 30, stdDev: 2.5 },
      volume: { maPeriod: 30 }
    }
  }
}

function IndicatorConfig({ params, onChange, onClose }) {
  const [activeCategory, setActiveCategory] = useState('rsi')
  const [localParams, setLocalParams] = useState(params)
  const [isDirty, setIsDirty] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    rsi: true,
    macd: true,
    ma: false,
    bollinger: false,
    volume: false
  })

  const categories = [
    { id: 'rsi', label: 'RSI', icon: '📊' },
    { id: 'macd', label: 'MACD', icon: '📈' },
    { id: 'ma', label: 'Moving Averages', icon: '〰️' },
    { id: 'bollinger', label: 'Bollinger Bands', icon: '🎯' },
    { id: 'volume', label: 'Volume', icon: '📊' }
  ]

  const handleParamChange = (category, key, value) => {
    setLocalParams(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: parseFloat(value) || value
      }
    }))
    setIsDirty(true)
  }

  const handleApply = () => {
    onChange(localParams)
    setIsDirty(false)
  }

  const handleReset = () => {
    setLocalParams(DEFAULT_PARAMS)
    setIsDirty(true)
  }

  const handlePresetApply = (presetKey) => {
    setLocalParams(PRESETS[presetKey].params)
    setIsDirty(true)
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] bg-terminal-panel border border-terminal-border rounded-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-terminal-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-terminal-green/20 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-terminal-green" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-terminal-text">Indicator Parameters</h2>
                <p className="text-sm text-terminal-dim font-mono">Customize technical indicator settings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="p-2 rounded-lg bg-terminal-bg border border-terminal-border hover:border-terminal-dim transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw className="w-4 h-4 text-terminal-dim" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-terminal-bg border border-terminal-border hover:border-terminal-dim transition-colors"
              >
                <X className="w-4 h-4 text-terminal-dim" />
              </motion.button>
            </div>
          </div>

          {/* Preset Quick Select */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-terminal-dim font-mono">Quick Presets:</span>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePresetApply(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors font-mono ${
                  JSON.stringify(localParams) === JSON.stringify(preset.params)
                    ? 'bg-terminal-green text-terminal-bg'
                    : 'bg-terminal-bg border border-terminal-border text-terminal-dim hover:border-terminal-dim'
                }`}
              >
                {preset.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Category Sidebar */}
            <div className="w-48 border-r border-terminal-border p-4">
              <div className="space-y-1">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors font-mono ${
                      activeCategory === cat.id
                        ? 'bg-terminal-green/20 text-terminal-green'
                        : 'text-terminal-dim hover:bg-terminal-bg'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Parameter Editor */}
            <div className="flex-1 p-6">
              <AnimatePresence mode="wait">
                {/* RSI Configuration */}
                {activeCategory === 'rsi' && (
                  <motion.div
                    key="rsi"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-terminal-text">Relative Strength Index</h3>
                      <p className="text-sm text-terminal-dim font-mono mb-4">
                        RSI measures the speed and change of price movements. Values above 70 typically indicate overbought conditions, while below 30 indicate oversold.
                      </p>
                    </div>
                    
                    <div className="grid gap-4">
                      {[
                        { key: 'period', label: 'Period', min: 2, max: 50, step: 1 },
                        { key: 'overbought', label: 'Overbought Level', min: 50, max: 95, step: 1 },
                        { key: 'oversold', label: 'Oversold Level', min: 5, max: 50, step: 1 }
                      ].map((param) => (
                        <div key={param.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-terminal-dim font-mono">{param.label}</label>
                            <span className="text-sm text-terminal-green font-mono">{localParams.rsi[param.key]}</span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={localParams.rsi[param.key]}
                            onChange={(e) => handleParamChange('rsi', param.key, e.target.value)}
                            className="w-full h-2 bg-terminal-bg rounded-lg appearance-none cursor-pointer accent-terminal-green"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* MACD Configuration */}
                {activeCategory === 'macd' && (
                  <motion.div
                    key="macd"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-terminal-text">Moving Average Convergence Divergence</h3>
                      <p className="text-sm text-terminal-dim font-mono mb-4">
                        MACD is a trend-following momentum indicator showing the relationship between two moving averages of a security's price.
                      </p>
                    </div>
                    
                    <div className="grid gap-4">
                      {[
                        { key: 'fastPeriod', label: 'Fast Period', min: 2, max: 50, step: 1 },
                        { key: 'slowPeriod', label: 'Slow Period', min: 10, max: 100, step: 1 },
                        { key: 'signalPeriod', label: 'Signal Period', min: 2, max: 50, step: 1 }
                      ].map((param) => (
                        <div key={param.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-terminal-dim font-mono">{param.label}</label>
                            <span className="text-sm text-terminal-green font-mono">{localParams.macd[param.key]}</span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={localParams.macd[param.key]}
                            onChange={(e) => handleParamChange('macd', param.key, e.target.value)}
                            className="w-full h-2 bg-terminal-bg rounded-lg appearance-none cursor-pointer accent-terminal-green"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Moving Averages Configuration */}
                {activeCategory === 'ma' && (
                  <motion.div
                    key="ma"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-terminal-text">Moving Averages</h3>
                      <p className="text-sm text-terminal-dim font-mono mb-4">
                        Simple (SMA) and Exponential (EMA) moving averages help identify trend direction and support/resistance levels.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <h4 className="text-sm font-medium text-terminal-green font-mono">Simple Moving Average (SMA)</h4>
                      <div className="grid gap-4 pl-4 border-l border-terminal-border">
                        {[
                          { key: 'shortPeriod', label: 'Short Period', min: 5, max: 200, step: 1 },
                          { key: 'longPeriod', label: 'Long Period', min: 20, max: 500, step: 1 }
                        ].map((param) => (
                          <div key={param.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-terminal-dim font-mono">{param.label}</label>
                              <span className="text-sm text-terminal-green font-mono">{localParams.sma[param.key]}</span>
                            </div>
                            <input
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={localParams.sma[param.key]}
                              onChange={(e) => handleParamChange('sma', param.key, e.target.value)}
                              className="w-full h-2 bg-terminal-bg rounded-lg appearance-none cursor-pointer accent-terminal-green"
                            />
                          </div>
                        ))}
                      </div>
                      
                      <h4 className="text-sm font-medium text-terminal-green font-mono">Exponential Moving Average (EMA)</h4>
                      <div className="grid gap-4 pl-4 border-l border-terminal-border">
                        {[
                          { key: 'shortPeriod', label: 'Short Period', min: 5, max: 200, step: 1 },
                          { key: 'longPeriod', label: 'Long Period', min: 20, max: 500, step: 1 }
                        ].map((param) => (
                          <div key={param.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-terminal-dim font-mono">{param.label}</label>
                              <span className="text-sm text-terminal-green font-mono">{localParams.ema[param.key]}</span>
                            </div>
                            <input
                              type="range"
                              min={param.min}
                              max={param.max}
                              step={param.step}
                              value={localParams.ema[param.key]}
                              onChange={(e) => handleParamChange('ema', param.key, e.target.value)}
                              className="w-full h-2 bg-terminal-bg rounded-lg appearance-none cursor-pointer accent-terminal-green"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Bollinger Bands Configuration */}
                {activeCategory === 'bollinger' && (
                  <motion.div
                    key="bollinger"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-terminal-text">Bollinger Bands</h3>
                      <p className="text-sm text-terminal-dim font-mono mb-4">
                        Bollinger Bands consist of a middle band (SMA) and two outer bands that represent standard deviations from the middle band.
                      </p>
                    </div>
                    
                    <div className="grid gap-4">
                      {[
                        { key: 'period', label: 'Period', min: 5, max: 100, step: 1 },
                        { key: 'stdDev', label: 'Standard Deviations', min: 1, max: 5, step: 0.1 }
                      ].map((param) => (
                        <div key={param.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-terminal-dim font-mono">{param.label}</label>
                            <span className="text-sm text-terminal-green font-mono">{localParams.bollinger[param.key]}</span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={localParams.bollinger[param.key]}
                            onChange={(e) => handleParamChange('bollinger', param.key, e.target.value)}
                            className="w-full h-2 bg-terminal-bg rounded-lg appearance-none cursor-pointer accent-terminal-green"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Volume Configuration */}
                {activeCategory === 'volume' && (
                  <motion.div
                    key="volume"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-terminal-text">Volume</h3>
                      <p className="text-sm text-terminal-dim font-mono mb-4">
                        Volume-based indicators help confirm price trends and identify potential reversals through trading volume analysis.
                      </p>
                    </div>
                    
                    <div className="grid gap-4">
                      {[
                        { key: 'maPeriod', label: 'Moving Average Period', min: 5, max: 100, step: 1 }
                      ].map((param) => (
                        <div key={param.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-terminal-dim font-mono">{param.label}</label>
                            <span className="text-sm text-terminal-green font-mono">{localParams.volume[param.key]}</span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={localParams.volume[param.key]}
                            onChange={(e) => handleParamChange('volume', param.key, e.target.value)}
                            className="w-full h-2 bg-terminal-bg rounded-lg appearance-none cursor-pointer accent-terminal-green"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-terminal-border flex items-center justify-between bg-terminal-header">
          <div className="text-xs text-terminal-dim font-mono">
            {isDirty ? '● Unsaved changes' : '✓ All changes saved'}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg transition-colors font-mono"
            >
              Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApply}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-terminal-green text-terminal-bg hover:bg-terminal-green/90 transition-colors font-mono"
            >
              Apply Changes
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export { IndicatorConfig, DEFAULT_PARAMS }
