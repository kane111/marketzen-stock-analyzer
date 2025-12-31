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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] glass rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Indicator Parameters</h2>
                <p className="text-sm text-textSecondary">Customize technical indicator settings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="p-2 rounded-lg bg-surfaceLight hover:bg-surface transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-surfaceLight hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Preset Quick Select */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-textSecondary">Quick Presets:</span>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePresetApply(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  JSON.stringify(localParams) === JSON.stringify(preset.params)
                    ? 'bg-primary text-white'
                    : 'bg-surfaceLight text-textSecondary hover:bg-surface'
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
            <div className="w-48 border-r border-white/5 p-4">
              <div className="space-y-1">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-primary/20 text-primary'
                        : 'text-textSecondary hover:bg-surfaceLight'
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
                      <h3 className="text-lg font-medium mb-2">Relative Strength Index</h3>
                      <p className="text-sm text-textSecondary mb-4">
                        RSI measures the speed and change of price movements. Values above 70 typically indicate overbought conditions, while below 30 indicate oversold.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <ParameterSlider
                        label="Period"
                        value={localParams.rsi.period}
                        min={2}
                        max={50}
                        step={1}
                        onChange={(v) => handleParamChange('rsi', 'period', v)}
                      />
                      <ParameterSlider
                        label="Overbought Threshold"
                        value={localParams.rsi.overbought}
                        min={50}
                        max={95}
                        step={1}
                        onChange={(v) => handleParamChange('rsi', 'overbought', v)}
                      />
                      <ParameterSlider
                        label="Oversold Threshold"
                        value={localParams.rsi.oversold}
                        min={5}
                        max={50}
                        step={1}
                        onChange={(v) => handleParamChange('rsi', 'oversold', v)}
                      />
                    </div>

                    {/* Visual Preview */}
                    <div className="mt-6 p-4 bg-surfaceLight rounded-xl">
                      <h4 className="text-sm font-medium mb-3">Preview</h4>
                      <div className="h-24 flex items-end gap-1">
                        {Array.from({ length: 50 }).map((_, i) => {
                          const progress = i / 50
                          const value = 50 + Math.sin(i * 0.3) * 30
                          const isOverbought = value > localParams.rsi.overbought
                          const isOversold = value < localParams.rsi.oversold
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-t ${
                                isOverbought ? 'bg-negative' : isOversold ? 'bg-positive' : 'bg-surface'
                              }`}
                              style={{ height: `${Math.abs(value - 50) * 1.5}%` }}
                            />
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-textSecondary">
                        <span>Oversold ({localParams.rsi.oversold})</span>
                        <span>50</span>
                        <span>Overbought ({localParams.rsi.overbought})</span>
                      </div>
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
                      <h3 className="text-lg font-medium mb-2">MACD</h3>
                      <p className="text-sm text-textSecondary mb-4">
                        Moving Average Convergence Divergence shows the relationship between two moving averages of a security's price.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <ParameterSlider
                        label="Fast EMA Period"
                        value={localParams.macd.fastPeriod}
                        min={4}
                        max={30}
                        step={1}
                        onChange={(v) => handleParamChange('macd', 'fastPeriod', v)}
                      />
                      <ParameterSlider
                        label="Slow EMA Period"
                        value={localParams.macd.slowPeriod}
                        min={10}
                        max={50}
                        step={1}
                        onChange={(v) => handleParamChange('macd', 'slowPeriod', v)}
                      />
                      <ParameterSlider
                        label="Signal Line Period"
                        value={localParams.macd.signalPeriod}
                        min={3}
                        max={20}
                        step={1}
                        onChange={(v) => handleParamChange('macd', 'signalPeriod', v)}
                      />
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
                      <h3 className="text-lg font-medium mb-2">Simple Moving Averages</h3>
                      <p className="text-sm text-textSecondary mb-4">
                        SMA calculates the average of a selected range of prices, equally weighted.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <ParameterSlider
                        label="Short Period"
                        value={localParams.sma.shortPeriod}
                        min={5}
                        max={100}
                        step={1}
                        onChange={(v) => handleParamChange('sma', 'shortPeriod', v)}
                      />
                      <ParameterSlider
                        label="Long Period"
                        value={localParams.sma.longPeriod}
                        min={20}
                        max={200}
                        step={1}
                        onChange={(v) => handleParamChange('sma', 'longPeriod', v)}
                      />
                    </div>

                    <div className="border-t border-white/5 pt-4 mt-4">
                      <h4 className="text-md font-medium mb-2">Exponential Moving Average</h4>
                      <p className="text-sm text-textSecondary mb-4">
                        EMA gives more weight to recent prices, making it more responsive to new information.
                      </p>
                      <div className="grid gap-4">
                        <ParameterSlider
                          label="Short Period"
                          value={localParams.ema.shortPeriod}
                          min={5}
                          max={50}
                          step={1}
                          onChange={(v) => handleParamChange('ema', 'shortPeriod', v)}
                        />
                        <ParameterSlider
                          label="Long Period"
                          value={localParams.ema.longPeriod}
                          min={10}
                          max={100}
                          step={1}
                          onChange={(v) => handleParamChange('ema', 'longPeriod', v)}
                        />
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
                      <h3 className="text-lg font-medium mb-2">Bollinger Bands</h3>
                      <p className="text-sm text-textSecondary mb-4">
                        Bollinger Bands consist of a middle band (SMA) with two outer bands at standard deviations away.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <ParameterSlider
                        label="Period (SMA Length)"
                        value={localParams.bollinger.period}
                        min={5}
                        max={50}
                        step={1}
                        onChange={(v) => handleParamChange('bollinger', 'period', v)}
                      />
                      <ParameterSlider
                        label="Standard Deviation"
                        value={localParams.bollinger.stdDev}
                        min={1}
                        max={4}
                        step={0.1}
                        onChange={(v) => handleParamChange('bollinger', 'stdDev', v)}
                      />
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
                      <h3 className="text-lg font-medium mb-2">Volume Moving Average</h3>
                      <p className="text-sm text-textSecondary mb-4">
                        The volume MA helps identify unusual trading activity by comparing current volume to the average.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <ParameterSlider
                        label="Period"
                        value={localParams.volume.maPeriod}
                        min={5}
                        max={50}
                        step={1}
                        onChange={(v) => handleParamChange('volume', 'maPeriod', v)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <div className="text-sm text-textSecondary">
            {isDirty ? '• Unsaved changes' : '✓ All changes applied'}
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-surfaceLight text-textSecondary hover:bg-surface transition-colors"
            >
              Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApply}
              disabled={!isDirty}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                isDirty
                  ? 'bg-primary text-white'
                  : 'bg-surfaceLight text-textSecondary cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              Apply Changes
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Helper function for formatting values
const formatValue = (key, value) => {
  if (['overbought', 'oversold'].includes(key)) return `${value}`
  return value.toString()
}

// Parameter Slider Component
function ParameterSlider({ label, value, min, max, step, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-mono text-primary">{formatValue(label, value)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-textSecondary w-8">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-2 bg-surfaceLight rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span className="text-xs text-textSecondary w-8 text-right">{max}</span>
      </div>
    </div>
  )
}

export { IndicatorConfig, DEFAULT_PARAMS, PRESETS }
export default IndicatorConfig
