import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Activity, TrendingUp, TrendingDown, Target, Zap, AlertTriangle, Info, 
  RefreshCw, LineChart, BarChart2, Sliders,
  PenTool, Eye, Settings, X, ChevronDown, Minus,
  Grid3X3, Star, Check, Users, PieChart, Layout, Columns
} from 'lucide-react'
import { 
  ComposedChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Line as RechartsLine, 
  Bar, Cell 
} from 'recharts'
import TimeframeSelector from './charts/TimeframeSelector'
import { TerminalTab, TerminalIndicatorToggle } from './UI'
import { Spinner } from './common/LoadingSkeleton'
import { InlineError } from './common/ErrorDisplay'
import { InfoTooltip } from './common/Tooltip'
import FundamentalsPanel from './FundamentalsPanel'
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

function TechnicalAnalysis({ 
  stock, 
  stockData, 
  onBack, 
  taTimeframes, 
  fetchStockData, 
  loading: propLoading, 
  indicatorParams = {}, 
  onOpenConfig, 
  watchlist = [], 
  onAddToWatchlist = null,
  cachedFundamentals = null,
  fundamentalsLoading = false
}) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(taTimeframes[1])
  const [analysisData, setAnalysisData] = useState(null)
  const [signal, setSignal] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [localLoading, setLocalLoading] = useState(true)
  const [error, setError] = useState(null)
  const [indicatorUpdateTimestamp, setIndicatorUpdateTimestamp] = useState(null)
  const [activeOscillatorTab, setActiveOscillatorTab] = useState('rsi')
  
  // View mode for fundamentals integration
  const [viewMode, setViewMode] = useState('split') // 'chart', 'split', 'fundamentals'
  const [fundamentalsTab, setFundamentalsTab] = useState('valuation')
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

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
      const currentRSI = rsi.length > 0 ? rsi[rsi.length - 1] : null
      const currentMACD = macdLine.length > 0 ? macdLine[macdLine.length - 1] : null
      const currentSignal = signalLine.length > 0 ? signalLine[signalLine.length - 1] : null
      const currentSMAShort = smaShort.length > 0 ? smaShort[smaShort.length - 1] : null
      const currentSMALong = smaLong.length > 0 ? smaLong[smaLong.length - 1] : null
      const currentEMAShort = emaShort.length > 0 ? emaShort[emaShort.length - 1] : null
      const currentBBUpper = upperBand.length > 0 ? upperBand[upperBand.length - 1] : null
      const currentBBLower = lowerBand.length > 0 ? lowerBand[lowerBand.length - 1] : null
      const currentATR = atr.length > 0 ? atr[atr.length - 1] : null
      const currentStochK = stochK.length > 0 ? stochK[stochK.length - 1] : null
      const currentStochD = stochD.length > 0 ? stochD[stochD.length - 1] : null
      
      // Calculate additional moving averages
      const ma10 = calculateSMA(closes, 10)
      const ma20 = calculateSMA(closes, 20)
      const ma44 = calculateSMA(closes, 44)
      
      const currentMA10 = ma10.length > 0 ? ma10[ma10.length - 1] : null
      const currentMA20 = ma20.length > 0 ? ma20[ma20.length - 1] : null
      const currentMA44 = ma44.length > 0 ? ma44[ma44.length - 1] : null
      
      // Moving Average Analysis
      const maAnalysis = [
        { period: 10, value: currentMA10, above: currentPrice > currentMA10 },
        { period: 20, value: currentMA20, above: currentPrice > currentMA20 },
        { period: 44, value: currentMA44, above: currentPrice > currentMA44 }
      ]
      
      const maAboveCount = maAnalysis.filter(m => m.above).length
      
      // Initialize signals array
      const signals = []
      
      // Perfect Order Analysis
      const isBullishPerfectOrder = currentPrice > currentMA10 && currentMA10 > currentMA20 && currentMA20 > currentMA44
      const isBearishPerfectOrder = currentPrice < currentMA10 && currentMA10 < currentMA20 && currentMA20 < currentMA44
      const isPartialBullish = currentPrice > currentMA10 && currentMA10 > currentMA20 && currentMA20 <= currentMA44
      const isPartialBearish = currentPrice < currentMA10 && currentMA10 < currentMA20 && currentMA20 >= currentMA44
      
      // MA Alignment signals
      if (isBullishPerfectOrder) {
        signals.push({ 
          indicator: 'MA Alignment', 
          signal: 'BUY', 
          strength: 'STRONG', 
          description: 'Perfect Order: MA10 > MA20 > MA44 - Strong Uptrend',
          color: 'positive',
          alignmentType: 'bullish'
        })
      } else if (isBearishPerfectOrder) {
        signals.push({ 
          indicator: 'MA Alignment', 
          signal: 'SELL', 
          strength: 'STRONG', 
          description: 'Perfect Order: MA10 < MA20 < MA44 - Strong Downtrend',
          color: 'negative',
          alignmentType: 'bearish'
        })
      } else if (isPartialBullish) {
        signals.push({ 
          indicator: 'MA Alignment', 
          signal: 'BUY', 
          strength: 'MODERATE', 
          description: 'Partial Alignment: Price > MA10 > MA20 - Building Uptrend',
          color: 'positive',
          alignmentType: 'partial_bullish'
        })
      } else if (isPartialBearish) {
        signals.push({ 
          indicator: 'MA Alignment', 
          signal: 'SELL', 
          strength: 'MODERATE', 
          description: 'Partial Alignment: Price < MA10 < MA20 - Building Downtrend',
          color: 'negative',
          alignmentType: 'partial_bearish'
        })
      }
      
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
      const chartData = ohlc.map((d, i) => {
        const atrIndex = i - (params.atr.period - 1)
        const stochIndex = i - (params.stoch.kPeriod - 1)
        
        return {
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
          atr: atrIndex >= 0 && atrIndex < atr.length ? atr[atrIndex] : null,
          stochK: stochIndex >= 0 && stochIndex < stochK.length ? stochK[stochIndex] : null,
          stochD: stochIndex >= 0 && stochIndex < stochD.length ? stochD[stochIndex] : null
        }
      })
      
      setAnalysisData({
        chartData,
        signals,
        chartDataRSI: chartData.map((d, i) => ({ time: d.date, value: d.rsi })),
        chartDataMACD: chartData.map((d, i) => ({ time: d.date, macd: d.macd, signal: d.macdSignal, hist: d.macdHist })),
        chartDataStoch: chartData.map((d, i) => ({ time: d.date, k: d.stochK, d: d.stochD })),
        chartDataATR: chartData.map((d, i) => ({ time: d.date, value: d.atr })),
        maAnalysis,
        maAboveCount,
        currentPrice,
        isBullishPerfectOrder,
        isBearishPerfectOrder,
        isPartialBullish,
        isPartialBearish
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
  
  // Store analysis function in ref
  useEffect(() => {
    analysisRef.current = performAnalysis
  }, [performAnalysis])
  
  // Toggle indicator
  const toggleIndicator = useCallback((indicatorId) => {
    _toggleIndicator(indicatorId)
    if (indicatorId === 'stoch' || indicatorId === 'atr') {
      setIndicatorUpdateTimestamp(Date.now())
    }
  }, [_toggleIndicator])
  
  // Trigger analysis when indicators change
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
  
  // View mode toggle options
  const viewModes = [
    { id: 'chart', label: 'Chart', icon: Layout, desc: 'Technical chart only' },
    { id: 'split', label: 'Split', icon: Columns, desc: 'Chart + Fundamentals' },
    { id: 'fundamentals', label: 'Data', icon: PieChart, desc: 'Fundamentals only' }
  ]

  // Loading state
  if (localLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-96">
        <Spinner size="3rem" />
        <p className="text-terminal-dim mt-4 font-mono">Loading technical analysis...</p>
        {error && <div className="mt-4"><InlineError message={error} severity="error" /></div>}
      </motion.div>
    )
  }
  
  // Main render
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header with Breadcrumb Navigation */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack} className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border p-2.5 rounded-lg hover:bg-terminal-bg-light transition-colors" title="Back to Dashboard">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <button onClick={onBack} className="text-terminal-dim hover:text-terminal-text transition-colors">
            Dashboard
          </button>
          <span className="text-terminal-dim/50">/</span>
          <span className="text-terminal-green font-medium">Analysis</span>
        </nav>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">{stock?.name || 'Stock'}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-terminal-bg-light text-terminal-dim">{stock?.symbol || ''}</span>
          </div>
          <p className="text-terminal-dim text-sm">Technical Analysis</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-lg p-1">
          {viewModes.map((mode) => (
            <InfoTooltip key={mode.id} content={mode.desc} position="bottom">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === mode.id
                    ? 'bg-terminal-green text-black shadow-lg shadow-terminal-green/20'
                    : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg-light'
                }`}
              >
                <mode.icon className="w-4 h-4" />
                {mode.label}
              </motion.button>
            </InfoTooltip>
          ))}
        </div>
        
        {onOpenConfig && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onOpenConfig} className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-terminal-bg-light transition-colors">
            <Sliders className="w-4 h-4 text-terminal-green" />
            <span className="text-sm">Configure</span>
          </motion.button>
        )}
        
        <TimeframeSelector timeframes={taTimeframes} selected={selectedTimeframe} onSelect={handleTimeframeChange} />
      </div>
      
      {/* Split View Layout */}
      <div className={`flex-1 flex gap-4 overflow-hidden ${viewMode === 'fundamentals' ? 'flex-col' : ''}`}>
        
        {/* Main Chart Area (Left Panel) */}
        <AnimatePresence mode="wait">
          {(viewMode === 'chart' || viewMode === 'split') && (
            <motion.div
              key="chart-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'flex-1' : 'w-full'}`}
            >
              {/* Combined Signal & MA Analysis Section */}
              {signal && analysisData && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4 mb-4 flex-shrink-0">
                  {/* Signal Header */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-terminal-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        signal.type.includes('BUY') ? 'bg-terminal-green/20' : signal.type.includes('SELL') ? 'bg-terminal-red/20' : 'bg-terminal-bg-light'
                      }`}>
                        {signal.type.includes('BUY') ? (
                          <TrendingUp className="w-5 h-5 text-terminal-green" />
                        ) : signal.type.includes('SELL') ? (
                          <TrendingDown className="w-5 h-5 text-terminal-red" />
                        ) : (
                          <Target className="w-5 h-5 text-terminal-dim" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-terminal-dim">Signal</p>
                        <p className={`text-lg font-bold ${getSignalColor(signal.type)}`}>{signal.type}</p>
                      </div>
                    </div>
                    
                    {/* MA Status */}
                    <div className={`px-3 py-1 rounded-lg border text-sm ${
                      analysisData.isBullishPerfectOrder 
                        ? 'bg-terminal-green/10 border-terminal-green/50 text-terminal-green' 
                        : analysisData.isBearishPerfectOrder
                          ? 'bg-terminal-red/10 border-terminal-red/50 text-terminal-red'
                          : analysisData.isPartialBullish || analysisData.isPartialBearish
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                            : 'bg-terminal-bg-light border-terminal-border text-terminal-dim'
                    }`}>
                      {analysisData.isBullishPerfectOrder 
                        ? 'Perfect Order ↑' 
                        : analysisData.isBearishPerfectOrder
                          ? 'Perfect Order ↓'
                          : `MA: ${analysisData.maAboveCount}/3`
                      }
                    </div>
                    
                    {/* Signal Counts */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-terminal-dim">BUY</p>
                        <p className="text-lg font-bold text-terminal-green">{signal.buyCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-terminal-dim">SELL</p>
                        <p className="text-lg font-bold text-terminal-red">{signal.sellCount}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact MA Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {analysisData.maAnalysis.map((ma, index) => (
                      <motion.div
                        key={ma.period}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-lg border p-3 ${
                          ma.above 
                            ? 'bg-terminal-green/5 border-terminal-green/30' 
                            : 'bg-terminal-red/5 border-terminal-red/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-terminal-dim">MA{ma.period}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            ma.above ? 'bg-terminal-green/20 text-terminal-green' : 'bg-terminal-red/20 text-terminal-red'
                          }`}>
                            {ma.above ? '↑' : '↓'}
                          </span>
                        </div>
                        <p className={`text-lg font-bold font-mono ${
                          ma.above ? 'text-terminal-green' : 'text-terminal-red'
                        }`}>
                          {formatCurrency(ma.value)}
                        </p>
                        <p className={`text-xs mt-1 ${
                          ma.above ? 'text-terminal-green/70' : 'text-terminal-red/70'
                        }`}>
                          {ma.above ? '+' : ''}{formatCurrency(analysisData.currentPrice - ma.value)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Indicator Toggles */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 flex-wrap flex-shrink-0">
                {[
                  { id: 'smaShort', label: `SMA ${params.sma.shortPeriod}`, color: '#f59e0b', tooltip: `Simple Moving Average over ${params.sma.shortPeriod} periods` },
                  { id: 'smaLong', label: `SMA ${params.sma.longPeriod}`, color: '#8b5cf6', tooltip: `Simple Moving Average over ${params.sma.longPeriod} periods` },
                  { id: 'emaShort', label: `EMA ${params.sma.shortPeriod}`, color: '#10b981', tooltip: 'Exponential Moving Average - more responsive' },
                  { id: 'bollinger', label: 'Bollinger', color: '#06b6d4', tooltip: 'Bollinger Bands - shows volatility' },
                  { id: 'vwap', label: 'VWAP', color: '#ec4899', tooltip: 'Volume Weighted Average Price' },
                  { id: 'stoch', label: 'Stochastic', color: '#f97316', tooltip: 'Stochastic Oscillator - momentum' },
                  { id: 'atr', label: 'ATR', color: '#84cc16', tooltip: 'Average True Range - measures volatility' }
                ].map(indicator => (
                  <InfoTooltip key={indicator.id} content={indicator.tooltip} position="bottom">
                    <TerminalIndicatorToggle
                      label={indicator.label}
                      color={indicator.color}
                      isActive={indicators[indicator.id]}
                      onToggle={() => toggleIndicator(indicator.id)}
                    />
                  </InfoTooltip>
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
                className="mb-4 flex-shrink-0"
              />
              
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Summary Tab */}
                  {activeTab === 'summary' && analysisData && (
                    <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 border border-terminal-border rounded-lg bg-terminal-panel p-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-4 h-4 text-terminal-green" />
                            <h3 className="text-sm font-mono text-terminal-text">Price Chart</h3>
                          </div>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={analysisData.chartData}>
                                <defs>
                                  <linearGradient id="priceGradientTA" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(value) => {
                                  const date = new Date(value)
                                  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                }} />
                                <YAxis domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                                <RechartsTooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
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
                        
                        <div className="border border-terminal-border rounded-lg bg-terminal-panel p-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-terminal-green" />
                            <h3 className="text-sm font-mono text-terminal-text">Signals</h3>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {analysisData.signals.slice(0, 6).map((sig, i) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className={`p-2 rounded-lg border ${
                                sig.color === 'positive' ? 'bg-terminal-green/10 border-terminal-green/30' :
                                sig.color === 'negative' ? 'bg-terminal-red/10 border-terminal-red/30' :
                                'bg-terminal-bg-light border-terminal-border'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">{sig.indicator}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    sig.signal === 'BUY' ? 'bg-terminal-green/20 text-terminal-green' :
                                    sig.signal === 'SELL' ? 'bg-terminal-red/20 text-terminal-red' :
                                    'bg-terminal-bg-light text-terminal-dim'
                                  }`}>
                                    {sig.signal}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <SectorPeersSection
                        currentStock={stock}
                        watchlist={watchlist}
                        onAddToWatchlist={onAddToWatchlist}
                        onSelectStock={(peerStock) => {
                          if (fetchStockData) {
                            fetchStockData(peerStock, selectedTimeframe, true)
                          }
                        }}
                      />
                    </motion.div>
                  )}
                  
                  {/* Indicators Tab */}
                  {activeTab === 'indicators' && analysisData && (
                    <motion.div key="indicators" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="border border-terminal-border rounded-lg bg-terminal-panel p-4">
                          <h3 className="text-lg font-mono mb-4 text-terminal-text">RSI ({params.rsi.period})</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={analysisData.chartDataRSI}>
                                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(value) => {
                                  const date = new Date(value)
                                  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" />
                                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" />
                                <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.2)" strokeWidth={2} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div className="border border-terminal-border rounded-lg bg-terminal-panel p-4">
                          <h3 className="text-lg font-mono mb-4 text-terminal-text">MACD</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={analysisData.chartDataMACD}>
                                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(value) => {
                                  const date = new Date(value)
                                  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                }} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
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
                      {indicatorUpdateTimestamp && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 px-4 py-2 bg-terminal-green/10 border border-terminal-green/30 rounded-lg flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
                          <span className="text-sm text-terminal-green">
                            {indicators.stoch && indicators.atr ? 'Stochastic & ATR indicators updated' : 
                             indicators.stoch ? 'Stochastic indicator updated' : 
                             indicators.atr ? 'ATR indicator updated' : 'Indicators updated'}
                          </span>
                          <span className="text-xs text-terminal-dim ml-auto">
                            {new Date(indicatorUpdateTimestamp).toLocaleTimeString()}
                          </span>
                        </motion.div>
                      )}
                      
                      <div className="border border-terminal-border rounded-lg bg-terminal-panel p-4 mb-6">
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <span className="text-sm text-terminal-dim mr-2">INDICATOR:</span>
                          {[
                            { id: 'rsi', label: 'RSI', color: '#3b82f6', tooltip: 'Relative Strength Index - Overbought/Oversold (70/30)' },
                            { id: 'stoch', label: 'Stochastic', color: '#f97316', tooltip: 'Stochastic Oscillator - Momentum' },
                            { id: 'atr', label: 'ATR', color: '#84cc16', tooltip: 'Average True Range - Volatility' },
                            { id: 'macd', label: 'MACD', color: '#10b981', tooltip: 'Moving Average Convergence Divergence' }
                          ].map((tab) => {
                            const isActive = activeOscillatorTab === tab.id
                            const isDisabled = (tab.id === 'stoch' && !indicators.stoch) || (tab.id === 'atr' && !indicators.atr)
                            
                            return (
                              <InfoTooltip key={tab.id} content={tab.tooltip} position="bottom">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => !isDisabled && setActiveOscillatorTab(tab.id)}
                                  disabled={isDisabled}
                                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                    isActive 
                                      ? 'bg-terminal-green text-black shadow-lg shadow-terminal-green/20' 
                                      : isDisabled
                                        ? 'bg-terminal-bg-light text-terminal-dim cursor-not-allowed opacity-50'
                                        : 'bg-terminal-bg-light text-terminal-text hover:bg-terminal-bg-secondary'
                                  }`}
                                >
                                  <div 
                                    className={`w-2 h-2 rounded-full ${
                                      isActive ? 'bg-black' : isDisabled ? 'bg-terminal-dim' : `bg-[${tab.color}]`
                                    }`} 
                                    style={!isActive && !isDisabled ? { backgroundColor: tab.color } : {}}
                                  />
                                  {tab.label}
                                </motion.button>
                              </InfoTooltip>
                            )
                          })}
                        </div>
                        
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            {activeOscillatorTab === 'rsi' && (
                              <ComposedChart data={analysisData.chartDataRSI}>
                                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(value) => {
                                  const date = new Date(value)
                                  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" />
                                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" />
                                <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.2)" strokeWidth={2} />
                              </ComposedChart>
                            )}
                            
                            {activeOscillatorTab === 'stoch' && (
                              <ComposedChart data={analysisData.chartDataStoch}>
                                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(value) => {
                                  const date = new Date(value)
                                  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" />
                                <ReferenceLine y={20} stroke="#10b981" strokeDasharray="5 5" />
                                <RechartsLine type="monotone" dataKey="k" stroke="#f97316" strokeWidth={2} dot={false} name="%K" />
                                <RechartsLine type="monotone" dataKey="d" stroke="#3b82f6" strokeWidth={2} dot={false} name="%D" />
                              </ComposedChart>
                            )}
                            
                            {activeOscillatorTab === 'atr' && (
                              <ComposedChart data={analysisData.chartDataATR}>
                                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(value) => {
                                  const date = new Date(value)
                                  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                }} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `₹${v.toFixed(0)}`} />
                                <RechartsTooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <Area 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#84cc16" 
                                  fill="rgba(132, 204, 22, 0.2)" 
                                  strokeWidth={2} 
                                  name="ATR"
                                />
                              </ComposedChart>
                            )}
                            
                            {activeOscillatorTab === 'macd' && (
                              <ComposedChart data={analysisData.chartDataMACD}>
                                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(value) => {
                                  const date = new Date(value)
                                  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                }} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <Bar dataKey="hist">
                                  {analysisData.chartDataMACD.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.hist >= 0 ? '#10b981' : '#ef4444'} />
                                  ))}
                                </Bar>
                                <RechartsLine type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} name="MACD" />
                                <RechartsLine type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={2} dot={false} name="Signal" />
                              </ComposedChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      {/* Oscillator Values */}
                      <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-mono text-terminal-text">Oscillator Values</h3>
                          <div className="flex items-center gap-2 text-xs text-terminal-dim">
                            <div className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse" />
                            Live Data
                          </div>
                        </div>
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
                                { 
                                  name: 'RSI (14)', 
                                  value: currentRSI?.toFixed(2), 
                                  status: currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral', 
                                  color: currentRSI > 70 ? 'negative' : currentRSI < 30 ? 'positive' : 'neutral',
                                  active: true,
                                  tab: 'rsi'
                                },
                                { 
                                  name: 'Stochastic %K', 
                                  value: currentStochK?.toFixed(2), 
                                  status: currentStochK > 80 ? 'Overbought' : currentStochK < 20 ? 'Oversold' : 'Neutral', 
                                  color: currentStochK > 80 ? 'negative' : currentStochK < 20 ? 'positive' : 'neutral',
                                  active: indicators.stoch,
                                  tab: 'stoch'
                                },
                                { 
                                  name: 'MACD', 
                                  value: (currentMACD - currentSignal)?.toFixed(2), 
                                  status: currentMACD > currentSignal ? 'Bullish' : 'Bearish', 
                                  color: currentMACD > currentSignal ? 'positive' : 'negative',
                                  active: true,
                                  tab: 'macd'
                                },
                                { 
                                  name: 'ATR (14)', 
                                  value: `₹${currentATR?.toFixed(2)}`, 
                                  status: 'Volatility', 
                                  color: 'neutral',
                                  active: indicators.atr,
                                  tab: 'atr'
                                }
                              ].map((osc, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  onClick={() => osc.active && setActiveOscillatorTab(osc.tab)}
                                  className={`p-4 bg-terminal-bg-light rounded-xl relative overflow-hidden cursor-pointer transition-all ${
                                    osc.active 
                                      ? activeOscillatorTab === osc.tab 
                                        ? 'ring-2 ring-terminal-green shadow-lg shadow-terminal-green/10' 
                                        : 'hover:ring-2 hover:ring-terminal-green/50'
                                      : 'opacity-50 cursor-not-allowed'
                                  }`}
                                >
                                  {osc.active && activeOscillatorTab === osc.tab && (
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-terminal-green animate-pulse" />
                                  )}
                                  {osc.active && (
                                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse ${
                                      activeOscillatorTab === osc.tab ? 'bg-terminal-green' : 'bg-terminal-dim'
                                    }`} />
                                  )}
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
                    </motion.div>
                  )}
                  
                  {/* Patterns Tab */}
                  {activeTab === 'patterns' && analysisData && (
                    <motion.div key="patterns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                      <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-6">
                        <h3 className="text-lg font-mono mb-4 flex items-center gap-2 text-terminal-text">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Fundamentals Panel (Right Panel - Split & Data modes) */}
        <AnimatePresence>
          {(viewMode === 'split' || viewMode === 'fundamentals') && (
            <motion.div
              key="fundamentals-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl overflow-hidden flex flex-col ${
                viewMode === 'split' ? 'w-96 flex-shrink-0' : 'w-full'
              }`}
            >
              {/* Fundamentals Header */}
              <div className="p-4 border-b border-terminal-border flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-terminal-green" />
                    <h3 className="text-lg font-semibold">{stock?.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-terminal-bg-light text-terminal-dim">{stock?.symbol}</span>
                  </div>
                  {viewMode === 'split' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                      className="p-1.5 rounded bg-terminal-bg-light hover:bg-terminal-border transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isPanelCollapsed ? '-rotate-90' : ''}`} />
                    </motion.button>
                  )}
                </div>
                
                {/* Fundamentals Tabs */}
                <div className="flex gap-1">
                  {[
                    { id: 'valuation', label: 'Valuation' },
                    { id: 'financials', label: 'Financials' },
                    { id: 'performance', label: 'Performance' }
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFundamentalsTab(tab.id)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        fundamentalsTab === tab.id
                          ? 'bg-terminal-green text-black'
                          : 'bg-terminal-bg-light text-terminal-dim hover:text-terminal-text'
                      }`}
                    >
                      {tab.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Fundamentals Content */}
              <AnimatePresence mode="wait">
                {!isPanelCollapsed && (
                  <motion.div
                    key={fundamentalsTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-1 overflow-y-auto p-4"
                  >
                    {fundamentalsLoading || !cachedFundamentals?.data ? (
                      <div className="flex flex-col items-center justify-center h-48">
                        <Spinner size="2rem" />
                        <p className="text-xs text-terminal-dim mt-2">Loading fundamentals...</p>
                      </div>
                    ) : (
                      <FundamentalsTabContent 
                        tab={fundamentalsTab} 
                        fundamentals={cachedFundamentals.data}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl flex-shrink-0">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-terminal-dim flex-shrink-0 mt-0.5" />
          <p className="text-xs text-terminal-dim">
            <strong className="text-terminal-text">Disclaimer:</strong> Analysis is generated automatically. 
            Not financial advice. Always conduct your own research.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// FUNDAMENTALS TAB CONTENT COMPONENT
// ============================================================================

function FundamentalsTabContent({ tab, fundamentals }) {
  const getMetric = (path) => {
    const keys = path.split('.')
    let value = fundamentals
    for (const key of keys) {
      value = value?.[key]
    }
    return value
  }
  
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value)
  }
  
  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A'
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toLocaleString()
  }
  
  const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A'
    return `${(value * 100).toFixed(2)}%`
  }
  
  const formatRatio = (value) => {
    if (value === null || value === undefined) return 'N/A'
    return value.toFixed(2)
  }
  
  return (
    <div className="space-y-4">
      {tab === 'valuation' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">P/E Ratio</p>
              <p className="text-lg font-bold">{formatRatio(getMetric('defaultKeyStatistics.trailingPE'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Forward P/E</p>
              <p className="text-lg font-bold">{formatRatio(getMetric('defaultKeyStatistics.forwardPE'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">P/B Ratio</p>
              <p className="text-lg font-bold">{formatRatio(getMetric('defaultKeyStatistics.priceToBookRaw'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">P/S Ratio</p>
              <p className="text-lg font-bold">{formatRatio(getMetric('defaultKeyStatistics.priceToSalesTrailing12Months'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">EPS (TTM)</p>
              <p className="text-lg font-bold">{formatCurrency(getMetric('defaultKeyStatistics.trailingEps'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Dividend Yield</p>
              <p className="text-lg font-bold">{formatPercent(getMetric('summaryDetail.dividendYieldRaw'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Beta</p>
              <p className="text-lg font-bold">{formatRatio(getMetric('defaultKeyStatistics.beta'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Market Cap</p>
              <p className="text-lg font-bold">{formatNumber(getMetric('summaryDetail.marketCap'))}</p>
            </div>
          </div>
        </>
      )}
      
      {tab === 'financials' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Revenue (TTM)</p>
              <p className="text-lg font-bold">{formatNumber(getMetric('financialData.totalData'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Net Income</p>
              <p className="text-lg font-bold">{formatNumber(getMetric('financialData.netIncomeToCommon'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Gross Margin</p>
              <p className="text-lg font-bold">{formatPercent(getMetric('financialData.grossMargins'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Operating Margin</p>
              <p className="text-lg font-bold">{formatPercent(getMetric('financialData.operatingMargins'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Profit Margin</p>
              <p className="text-lg font-bold">{formatPercent(getMetric('financialData.profitMargins'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">ROE</p>
              <p className="text-lg font-bold">{formatPercent(getMetric('financialData.returnOnEquity'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">ROA</p>
              <p className="text-lg font-bold">{formatPercent(getMetric('financialData.returnOnAssets'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Debt/Equity</p>
              <p className="text-lg font-bold">{formatRatio(getMetric('financialData.debtToEquity'))}</p>
            </div>
          </div>
        </>
      )}
      
      {tab === 'performance' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">52W High</p>
              <p className="text-lg font-bold">{formatCurrency(getMetric('summaryDetail.fiftyTwoWeekHighRaw'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">52W Low</p>
              <p className="text-lg font-bold">{formatCurrency(getMetric('summaryDetail.fiftyTwoWeekLowRaw'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">52W Change</p>
              <p className={`text-lg font-bold ${getMetric('defaultKeyStatistics.fiftyTwoWeekChange') >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {formatPercent(getMetric('defaultKeyStatistics.fiftyTwoWeekChange'))}
              </p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">50 Day MA</p>
              <p className="text-lg font-bold">{formatCurrency(getMetric('summaryDetail.fiftyDayAverage'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">200 Day MA</p>
              <p className="text-lg font-bold">{formatCurrency(getMetric('summaryDetail.twoHundredDayAverage'))}</p>
            </div>
            <div className="bg-terminal-bg-light rounded-lg p-3">
              <p className="text-xs text-terminal-dim">Avg Volume</p>
              <p className="text-lg font-bold">{formatNumber(getMetric('summaryDetail.averageVolume'))}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// SECTOR PEERS SECTION
// ============================================================================

function SectorPeersSection({ currentStock, watchlist, onAddToWatchlist, onSelectStock }) {
  const getSectorPeers = (stockId) => {
    const peers = {
      'RELIANCE.NS': [
        { id: 'ONGC.NS', symbol: 'ONGC', name: 'Oil & Natural Gas' },
        { id: 'IOC.NS', symbol: 'IOC', name: 'Indian Oil Corporation' },
        { id: 'NTPC.NS', symbol: 'NTPC', name: 'NTPC' },
        { id: 'BPCL.NS', symbol: 'BPCL', name: 'Bharat Petroleum' },
      ],
      'TCS.NS': [
        { id: 'INFY.NS', symbol: 'INFY', name: 'Infosys' },
        { id: 'WIPRO.NS', symbol: 'WIPRO', name: 'Wipro' },
        { id: 'HCLTECH.NS', symbol: 'HCLTECH', name: 'HCL Technologies' },
        { id: 'TECHM.NS', symbol: 'TECHM', name: 'Tech Mahindra' },
      ],
      'HDFCBANK.NS': [
        { id: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank' },
        { id: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India' },
        { id: 'KOTAKBANK.NS', symbol: 'KOTAKBANK', name: 'Kotak Mahindra' },
        { id: 'AXISBANK.NS', symbol: 'AXISBANK', name: 'Axis Bank' },
      ],
    }
    
    const symbol = stockId?.replace('.NS', '') || ''
    if (!peers[stockId]) {
      return [
        { id: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries' },
        { id: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy' },
        { id: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank' },
        { id: 'INFY.NS', symbol: 'INFY', name: 'Infosys' },
      ]
    }
    
    return peers[stockId]
  }

  const peers = getSectorPeers(currentStock?.id)
  
  const isInWatchlist = (stockId) => {
    return watchlist.some(s => s.id === stockId)
  }
  
  const peersWithData = peers.map((peer, index) => ({
    ...peer,
    price: Math.random() * 5000 + 100,
    change: (Math.random() - 0.5) * 5,
  }))

  return (
    <div className="bg-terminal-bg-secondary/80 backdrop-blur-xl border border-terminal-border rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-terminal-green" />
        <h3 className="text-sm font-mono font-semibold text-terminal-text">Sector Peers</h3>
        <span className="text-xs text-terminal-dim">Click to analyze</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {peersWithData.map((peer, index) => {
          const inWatchlist = isInWatchlist(peer.id)
          const isPositive = peer.change >= 0

          return (
            <motion.div
              key={peer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-terminal-bg-light rounded-lg hover:bg-terminal-panel/50 transition-colors group cursor-pointer"
              onClick={() => onSelectStock(peer)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isPositive 
                    ? 'bg-terminal-green/20 text-terminal-green' 
                    : 'bg-terminal-red/20 text-terminal-red'
                }`}>
                  {peer.symbol.substring(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-terminal-text">{peer.symbol}</p>
                  <p className="text-xs text-terminal-dim truncate max-w-[80px]">{peer.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-mono">₹{peer.price.toFixed(0)}</p>
                  <p className={`text-xs font-mono ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
                    {isPositive ? '+' : ''}{peer.change.toFixed(2)}%
                  </p>
                </div>
                
                {onAddToWatchlist && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToWatchlist(peer)
                    }}
                    disabled={inWatchlist}
                    className={`p-1.5 rounded-lg transition-all ${
                      inWatchlist
                        ? 'text-terminal-dim cursor-not-allowed'
                        : 'text-terminal-green hover:bg-terminal-green/20 opacity-0 group-hover:opacity-100'
                    }`}
                    title={inWatchlist ? 'Already in watchlist' : 'Add to watchlist'}
                  >
                    {inWatchlist ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Star className="w-3 h-3" />
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default TechnicalAnalysis
