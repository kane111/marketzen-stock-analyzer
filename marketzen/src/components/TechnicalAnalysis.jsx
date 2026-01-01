import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Activity, TrendingUp, TrendingDown, Target, Zap, AlertTriangle, Info, 
  RefreshCw, LineChart, BarChart2, Sliders,
  PenTool, Eye, Settings, X, ChevronDown, Minus,
  Grid3X3
} from 'lucide-react'
import { 
  ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line as RechartsLine, 
  Bar, Cell 
} from 'recharts'
import TimeframeSelector from './charts/TimeframeSelector'
import { TerminalTab, TerminalIndicatorToggle } from './UI'
import { 
  useIndicators, 
  useIndicatorParams,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
  calculateVWAP
} from '../hooks'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function TechnicalAnalysis({ stock, stockData, onBack, taTimeframes, fetchStockData, loading: propLoading, indicatorParams = {}, onOpenConfig }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(taTimeframes[1])
  const [analysisData, setAnalysisData] = useState(null)
  const [signal, setSignal] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [localLoading, setLocalLoading] = useState(true)
  const [error, setError] = useState(null)

  // Handle timeframe change - update state and fetch new data
  const handleTimeframeChange = useCallback((timeframe) => {
    setSelectedTimeframe(timeframe)
    if (fetchStockData && stock) {
      fetchStockData(stock, timeframe, true)
    }
  }, [fetchStockData, stock])
  
  // Use the useIndicators hook for cleaner state management
  const { 
    indicators, 
    toggleIndicator: _toggleIndicator,
    resetIndicators 
  } = useIndicators({
    smaShort: true,
    smaLong: true,
    emaShort: true,
    bollinger: true,
    vwap: false,
    volume: true,
    atr: false,
    stoch: false
  })
  
  // Parameters
  const params = useMemo(() => ({
    rsi: { period: 14, overbought: 70, oversold: 30, ...indicatorParams.rsi },
    macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, ...indicatorParams.macd },
    sma: { shortPeriod: 20, longPeriod: 50, ...indicatorParams.sma },
    ema: { shortPeriod: 12, longPeriod: 26, ...indicatorParams.ema },
    bollinger: { period: 20, stdDev: 2, ...indicatorParams.bollinger },
    volume: { maPeriod: 20, ...indicatorParams.volume },
    stoch: { kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20, ...indicatorParams.stoch },
    atr: { period: 14, ...indicatorParams.atr }
  }), [indicatorParams])
  
  const analysisRef = useRef(null)
  
  const performAnalysis = useCallback(() => {
    if (!stockData?.ohlc || stockData.ohlc.length === 0) {
      return
    }
    
    try {
      const ohlc = stockData.ohlc
      const closes = ohlc.map(d => d.close)
      const highs = ohlc.map(d => d.high)
      const lows = ohlc.map(d => d.low)
      const opens = ohlc.map(d => d.open)
      const volumes = ohlc.map(d => d.volume)
      
      // Calculate indicators
      const smaShort = calculateSMA(closes, params.sma.shortPeriod)
      const smaLong = calculateSMA(closes, params.sma.longPeriod)
      const emaShort = calculateEMA(closes, params.ema.shortPeriod)
      const rsi = calculateRSI(closes, params.rsi.period)
      const { macdLine, signalLine, histogram } = calculateMACD(closes, params.macd.fastPeriod, params.macd.slowPeriod, params.macd.signalPeriod)
      const { sma: bbSma, upperBand, lowerBand } = calculateBollingerBands(closes, params.bollinger.period, params.bollinger.stdDev)
      const atr = calculateATR(highs, lows, closes, params.atr.period)
      const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes, params.stoch.kPeriod, params.stoch.dPeriod)
      const vwap = calculateVWAP(ohlc)
      
      // Current values
      const currentPrice = closes[closes.length - 1]
      const currentRSI = rsi[rsi.length - 1]
      const currentMACD = macdLine[macdLine.length - 1]
      const currentSignal = signalLine[signalLine.length - 1]
      const currentSMAShort = smaShort[smaShort.length - 1]
      const currentSMALong = smaLong[smaLong.length - 1]
      const currentEMAShort = emaShort[emaShort.length - 1]
      const currentBBUpper = upperBand[upperBand.length - 1]
      const currentBBLower = lowerBand[lowerBand.length - 1]
      const currentATR = atr[atr.length - 1]
      const currentStochK = stochK[stochK.length - 1]
      const currentStochD = stochD[stochD.length - 1]
      
      // Generate signals
      const signals = []
      
      // RSI Analysis
      if (currentRSI < params.rsi.oversold) {
        signals.push({ indicator: 'RSI', signal: 'BUY', strength: 'STRONG', description: `RSI at ${currentRSI?.toFixed(2)} - Oversold`, color: 'positive' })
      } else if (currentRSI > params.rsi.overbought) {
        signals.push({ indicator: 'RSI', signal: 'SELL', strength: 'STRONG', description: `RSI at ${currentRSI?.toFixed(2)} - Overbought`, color: 'negative' })
      } else {
        signals.push({ indicator: 'RSI', signal: 'NEUTRAL', strength: 'WEAK', description: `RSI at ${currentRSI?.toFixed(2)} - Neutral`, color: 'neutral' })
      }
      
      // MACD Analysis
      if (currentMACD > currentSignal) {
        signals.push({ indicator: 'MACD', signal: 'BUY', strength: 'MODERATE', description: 'MACD above signal - Bullish', color: 'positive' })
      } else if (currentMACD < currentSignal) {
        signals.push({ indicator: 'MACD', signal: 'SELL', strength: 'MODERATE', description: 'MACD below signal - Bearish', color: 'negative' })
      } else {
        signals.push({ indicator: 'MACD', signal: 'NEUTRAL', strength: 'WEAK', description: 'MACD converging', color: 'neutral' })
      }
      
      // Stochastic Analysis
      if (currentStochK < params.stoch.oversold && currentStochD < params.stoch.oversold) {
        signals.push({ indicator: 'Stochastic', signal: 'BUY', strength: 'MODERATE', description: 'Oversold - Potential bounce', color: 'positive' })
      } else if (currentStochK > params.stoch.overbought && currentStochD > params.stoch.overbought) {
        signals.push({ indicator: 'Stochastic', signal: 'SELL', strength: 'MODERATE', description: 'Overbought - Risk of reversal', color: 'negative' })
      }
      
      // Bollinger Analysis
      if (currentPrice > currentBBUpper) {
        signals.push({ indicator: 'Bollinger', signal: 'SELL', strength: 'MODERATE', description: 'Price above upper band', color: 'negative' })
      } else if (currentPrice < currentBBLower) {
        signals.push({ indicator: 'Bollinger', signal: 'BUY', strength: 'MODERATE', description: 'Price below lower band', color: 'positive' })
      }
      
      // Overall signal
      const buySignals = signals.filter(s => s.signal === 'BUY').length
      const sellSignals = signals.filter(s => s.signal === 'SELL').length
      const totalSignals = signals.filter(s => s.signal !== 'NEUTRAL').length
      
      let overallSignal = 'NEUTRAL'
      let overallStrength = 'No clear trend'
      if (totalSignals > 0) {
        if (buySignals > sellSignals) {
          overallSignal = buySignals / totalSignals > 0.7 ? 'STRONG BUY' : 'BUY'
          overallStrength = `${buySignals} bullish vs ${sellSignals} bearish`
        } else if (sellSignals > buySignals) {
          overallSignal = sellSignals / totalSignals > 0.7 ? 'STRONG SELL' : 'SELL'
          overallStrength = `${sellSignals} bearish vs ${buySignals} bullish`
        }
      }
      
      // Build chart data
      const chartData = ohlc.map((d, i) => ({
        date: d.date,
        close: d.close,
        open: d.open,
        high: d.high,
        low: d.low,
        volume: d.volume,
        isGreen: d.close >= d.open,
        smaShort: smaShort[i],
        smaLong: smaLong[i],
        emaShort: emaShort[i],
        rsi: rsi[i],
        macd: macdLine[i],
        macdSignal: signalLine[i],
        macdHist: histogram[i],
        bbUpper: upperBand[i],
        bbLower: lowerBand[i],
        bbMid: bbSma[i],
        vwap: vwap[i],
        atr: atr[i],
        stochK: stochK[i],
        stochD: stochD[i]
      }))
      
      setAnalysisData({
        chartData,
        signals,
        chartDataRSI: chartData.map((d, i) => ({ time: d.date, value: d.rsi })),
        chartDataMACD: chartData.map((d, i) => ({ time: d.date, macd: d.macd, signal: d.macdSignal, hist: d.macdHist })),
        chartDataStoch: chartData.map((d, i) => ({ time: d.date, k: d.stochK, d: d.stochD })),
        chartDataATR: chartData.map((d, i) => ({ time: d.date, value: d.atr }))
      })
      
      setSignal({ type: overallSignal, strength: overallStrength, buyCount: buySignals, sellCount: sellSignals, total: totalSignals })
      setLocalLoading(false)
      setError(null)
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Error performing analysis: ' + err.message)
      setLocalLoading(false)
    }
  }, [stockData, params])
  
  // Store analysis function in ref for access in event handlers
  useEffect(() => {
    analysisRef.current = performAnalysis
  }, [performAnalysis])
  
  // Toggle indicator with proper analysis trigger
  const toggleIndicator = useCallback((indicatorId) => {
    _toggleIndicator(indicatorId)
  }, [_toggleIndicator])
  
  // Effect to trigger analysis when indicators change
  useEffect(() => {
    if (stockData?.ohlc && stockData.ohlc.length > 0) {
      performAnalysis()
    }
  }, [indicators, stockData])
  
  // Initial data load
  useEffect(() => {
    if (!stockData?.ohlc || stockData.ohlc.length === 0) {
      setLocalLoading(true)
      if (fetchStockData && stock) {
        fetchStockData(stock, taTimeframes[1], true)
      }
    } else {
      performAnalysis()
    }
  }, [stockData, stock, fetchStockData, taTimeframes])
  
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value)
  }
  
  const getSignalColor = (type) => {
    if (type?.includes('BUY')) return 'text-terminal-green'
    if (type?.includes('SELL')) return 'text-terminal-red'
    return 'text-terminal-dim'
  }
  
  const getSignalBg = (type) => {
    if (type?.includes('BUY')) return 'bg-terminal-green/20 border-terminal-green'
    if (type?.includes('SELL')) return 'bg-terminal-red/20 border-terminal-red'
    return 'bg-terminal-bg-light border-terminal-border'
  }
  
  // Loading state
  if (localLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-4 border-terminal-green border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-terminal-dim">Loading technical analysis...</p>
          {error && <p className="text-terminal-red mt-2 text-sm">{error}</p>}
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack} className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border p-2.5 rounded-lg hover:bg-terminal-bg-light transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-semibold">{stock?.name || 'Stock'}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-terminal-bg-light text-terminal-dim">{stock?.symbol || ''}</span>
          </div>
          <p className="text-terminal-dim text-sm">Technical Analysis</p>
        </div>
        
        {onOpenConfig && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onOpenConfig} className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-terminal-bg-light transition-colors">
            <Sliders className="w-4 h-4 text-terminal-green" />
            <span className="text-sm">Configure</span>
          </motion.button>
        )}
        
        <TimeframeSelector timeframes={taTimeframes} selected={selectedTimeframe} onSelect={handleTimeframeChange} />
      </div>
      
      {/* Signal Banner */}
      {signal && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6 mb-6 border-2 ${getSignalBg(signal.type)}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                signal.type.includes('BUY') ? 'bg-terminal-green/20' : signal.type.includes('SELL') ? 'bg-terminal-red/20' : 'bg-terminal-bg-light'
              }`}>
                {signal.type.includes('BUY') ? (
                  <TrendingUp className="w-8 h-8 text-terminal-green" />
                ) : signal.type.includes('SELL') ? (
                  <TrendingDown className="w-8 h-8 text-terminal-red" />
                ) : (
                  <Target className="w-8 h-8 text-terminal-dim" />
                )}
              </div>
              <div>
                <p className="text-sm text-terminal-dim mb-1">Overall Signal</p>
                <p className={`text-3xl font-bold ${getSignalColor(signal.type)}`}>{signal.type}</p>
                <p className="text-sm text-terminal-dim mt-1">{signal.strength}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-sm text-terminal-dim">Buy Signals</p>
                <p className="text-2xl font-bold text-terminal-green">{signal.buyCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-terminal-dim">Sell Signals</p>
                <p className="text-2xl font-bold text-terminal-red">{signal.sellCount}</p>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => analysisRef.current?.()} className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-terminal-bg-light">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Indicator Toggles */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
        {[
          { id: 'smaShort', label: `SMA ${params.sma.shortPeriod}`, color: '#f59e0b' },
          { id: 'smaLong', label: `SMA ${params.sma.longPeriod}`, color: '#8b5cf6' },
          { id: 'emaShort', label: `EMA ${params.ema.shortPeriod}`, color: '#10b981' },
          { id: 'bollinger', label: 'Bollinger', color: '#06b6d4' },
          { id: 'vwap', label: 'VWAP', color: '#ec4899' },
          { id: 'stoch', label: 'Stochastic', color: '#f97316' },
          { id: 'atr', label: 'ATR', color: '#84cc16' }
        ].map(indicator => (
          <TerminalIndicatorToggle
            key={indicator.id}
            label={indicator.label}
            color={indicator.color}
            isActive={indicators[indicator.id]}
            onToggle={() => toggleIndicator(indicator.id)}
          />
        ))}
      </div>
      
      {/* Tab Navigation */}
      <TerminalTab
        tabs={[
          { id: 'summary', label: 'Summary', icon: Target },
          { id: 'indicators', label: 'Indicators', icon: Activity },
          { id: 'oscillators', label: 'Oscillators', icon: Zap },
          { id: 'patterns', label: 'Patterns', icon: Grid3X3 }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-6"
      />
      
      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Summary Tab */}
        {activeTab === 'summary' && analysisData && (
          <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-terminal-green" />
                  Price Chart
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysisData.chartData}>
                      <defs>
                        <linearGradient id="priceGradientTA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="close" stroke="none" fill="url(#priceGradientTA)" />
                      {indicators.smaShort && <RechartsLine type="monotone" dataKey="smaShort" stroke="#f59e0b" strokeWidth={2} dot={false} name={`SMA ${params.sma.shortPeriod}`} />}
                      {indicators.smaLong && <RechartsLine type="monotone" dataKey="smaLong" stroke="#8b5cf6" strokeWidth={2} dot={false} name={`SMA ${params.sma.longPeriod}`} />}
                      {indicators.emaShort && <RechartsLine type="monotone" dataKey="emaShort" stroke="#10b981" strokeWidth={2} dot={false} name={`EMA ${params.ema.shortPeriod}`} />}
                      {indicators.bollinger && (
                        <>
                          <RechartsLine type="monotone" dataKey="bbUpper" stroke="#06b6d4" strokeWidth={1} dot={false} />
                          <RechartsLine type="monotone" dataKey="bbLower" stroke="#06b6d4" strokeWidth={1} dot={false} />
                        </>
                      )}
                      {indicators.vwap && <RechartsLine type="monotone" dataKey="vwap" stroke="#ec4899" strokeWidth={2} dot={false} name="VWAP" />}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-terminal-green" />
                  Trading Signals
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analysisData.signals.map((sig, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`p-3 rounded-xl border ${
                      sig.color === 'positive' ? 'bg-terminal-green/10 border-terminal-green/30' :
                      sig.color === 'negative' ? 'bg-terminal-red/10 border-terminal-red/30' :
                      'bg-terminal-bg-light border-terminal-border'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{sig.indicator}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sig.signal === 'BUY' ? 'bg-terminal-green/20 text-terminal-green' :
                          sig.signal === 'SELL' ? 'bg-terminal-red/20 text-terminal-red' :
                          'bg-terminal-bg-light text-terminal-dim'
                        }`}>
                          {sig.signal}
                        </span>
                      </div>
                      <p className="text-xs text-terminal-dim">{sig.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Indicators Tab */}
        {activeTab === 'indicators' && analysisData && (
          <motion.div key="indicators" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">RSI ({params.rsi.period})</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysisData.chartDataRSI}>
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" />
                      <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" />
                      <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.2)" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">MACD</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysisData.chartDataMACD}>
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Bar dataKey="hist">
                        {analysisData.chartDataMACD.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.hist >= 0 ? '#10b981' : '#ef4444'} />))}
                      </Bar>
                      <RechartsLine type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <RechartsLine type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Oscillators Tab */}
        {activeTab === 'oscillators' && analysisData && (
          <motion.div key="oscillators" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Oscillator Values</h3>
              {(() => {
                const currentRSI = analysisData.chartData[analysisData.chartData.length - 1]?.rsi
                const currentStochK = analysisData.chartData[analysisData.chartData.length - 1]?.stochK
                const currentStochD = analysisData.chartData[analysisData.chartData.length - 1]?.stochD
                const currentMACD = analysisData.chartData[analysisData.chartData.length - 1]?.macd
                const currentSignal = analysisData.chartData[analysisData.chartData.length - 1]?.macdSignal
                const currentATR = analysisData.chartData[analysisData.chartData.length - 1]?.atr
                
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: 'RSI (14)', value: currentRSI?.toFixed(2), status: currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral', color: currentRSI > 70 ? 'negative' : currentRSI < 30 ? 'positive' : 'neutral' },
                      { name: 'Stochastic %K', value: currentStochK?.toFixed(2), status: currentStochK > 80 ? 'Overbought' : currentStochK < 20 ? 'Oversold' : 'Neutral', color: currentStochK > 80 ? 'negative' : currentStochK < 20 ? 'positive' : 'neutral' },
                      { name: 'MACD', value: (currentMACD - currentSignal)?.toFixed(2), status: currentMACD > currentSignal ? 'Bullish' : 'Bearish', color: currentMACD > currentSignal ? 'positive' : 'negative' },
                      { name: 'ATR (14)', value: `₹${currentATR?.toFixed(2)}`, status: 'Volatility', color: 'neutral' }
                    ].map((osc, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-4 bg-terminal-bg-light rounded-xl">
                        <p className="text-sm text-terminal-dim mb-1">{osc.name}</p>
                        <p className={`text-2xl font-bold ${
                          osc.color === 'positive' ? 'text-terminal-green' : 
                          osc.color === 'negative' ? 'text-terminal-red' : 
                          'text-terminal-text'
                        }`}>
                          {osc.value}
                        </p>
                        <p className={`text-xs mt-1 ${
                          osc.color === 'positive' ? 'text-terminal-green' : 
                          osc.color === 'negative' ? 'text-terminal-red' : 
                          'text-terminal-dim'
                        }`}>
                          {osc.status}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )
              })()}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">RSI Momentum</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysisData.chartDataRSI}>
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" />
                      <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" />
                      <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.2)" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Stochastic</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysisData.chartDataStoch}>
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" />
                      <ReferenceLine y={20} stroke="#10b981" strokeDasharray="5 5" />
                      <RechartsLine type="monotone" dataKey="k" stroke="#3b82f6" strokeWidth={2} dot={false} name="%K" />
                      <RechartsLine type="monotone" dataKey="d" stroke="#f59e0b" strokeWidth={2} dot={false} name="%D" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Patterns Tab */}
        {activeTab === 'patterns' && analysisData && (
          <motion.div key="patterns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-terminal-green" />
                Technical Patterns
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisData.signals.filter(s => s.strength === 'STRONG' || s.strength === 'MODERATE').map((sig, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={`p-4 rounded-xl border ${
                    sig.color === 'positive' ? 'bg-terminal-green/10 border-terminal-green/30' :
                    sig.color === 'negative' ? 'bg-terminal-red/10 border-terminal-red/30' :
                    'bg-terminal-bg-light border-terminal-border'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{sig.indicator}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sig.signal === 'BUY' ? 'bg-terminal-green/20 text-terminal-green' :
                        sig.signal === 'SELL' ? 'bg-terminal-red/20 text-terminal-red' :
                        'bg-terminal-bg-light text-terminal-dim'
                      }`}>
                        {sig.signal}
                      </span>
                    </div>
                    <p className="text-sm text-terminal-dim">{sig.description}</p>
                    <p className="text-xs text-terminal-dim mt-1">{sig.strength} signal</p>
                  </motion.div>
                ))}
              </div>
              {analysisData.signals.filter(s => s.strength === 'STRONG' || s.strength === 'MODERATE').length === 0 && (
                <p className="text-terminal-dim text-center py-8">No strong patterns detected</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-terminal-dim flex-shrink-0 mt-0.5" />
          <p className="text-xs text-terminal-dim">
            <strong className="text-terminal-text">Disclaimer:</strong> Technical analysis is generated automatically. 
            This should not be considered financial advice. Always conduct your own research.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default TechnicalAnalysis
