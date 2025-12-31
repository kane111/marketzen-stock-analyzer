import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Activity, TrendingUp, TrendingDown, Target, Zap, AlertTriangle, Info, RefreshCw, LineChart, BarChart2, Sliders } from 'lucide-react'
import { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line, Bar, Cell } from 'recharts'
import TimeframeSelector from './TimeframeSelector'

// Technical Indicator Calculation Functions
const calculateSMA = (data, period) => {
  const sma = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      sma.push(sum / period)
    }
  }
  return sma
}

const calculateEMA = (data, period) => {
  const ema = []
  const multiplier = 2 / (period + 1)
  
  // Start with SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    if (i < period - 1) {
      ema.push(null)
    } else {
      sum = data.slice(0, period).reduce((a, b) => a + b, 0)
      ema.push(sum / period)
    }
  }
  
  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    const prevEMA = ema[i - 1]
    const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA
    ema.push(currentEMA)
  }
  
  return ema
}

const calculateRSI = (data, period = 14) => {
  const rsi = []
  const gains = []
  const losses = []
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      gains.push(0)
      losses.push(0)
      rsi.push(50)
      continue
    }
    
    const change = data[i] - data[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  let avgGain = gains.slice(1, period + 1).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(1, period + 1).reduce((a, b) => a + b, 0) / period
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(null)
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      rsi.push(100 - (100 / (1 + rs)))
    } else {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      rsi.push(100 - (100 / (1 + rs)))
    }
  }
  
  return rsi
}

const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)
  
  const macdLine = fastEMA.map((fast, i) => {
    if (fast === null || slowEMA[i] === null) return null
    return fast - slowEMA[i]
  })
  
  // Calculate signal line from MACD
  const macdValues = macdLine.filter(v => v !== null)
  const signalLineValues = calculateEMA(macdValues, signalPeriod)
  
  const signalLine = []
  let signalIdx = 0
  
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null)
    } else {
      signalLine.push(signalIdx < signalLineValues.length ? signalLineValues[signalIdx] : null)
      signalIdx++
    }
  }
  
  // Calculate histogram
  const histogram = macdLine.map((macd, i) => {
    if (macd === null || signalLine[i] === null) return null
    return macd - signalLine[i]
  })
  
  return { macdLine, signalLine, histogram }
}

const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  const sma = calculateSMA(data, period)
  const upperBand = []
  const lowerBand = []
  
  for (let i = 0; i < data.length; i++) {
    if (sma[i] === null) {
      upperBand.push(null)
      lowerBand.push(null)
    } else {
      const slice = data.slice(i - period + 1, i + 1)
      const mean = sma[i]
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
      const std = Math.sqrt(variance)
      upperBand.push(mean + (stdDev * std))
      lowerBand.push(mean - (stdDev * std))
    }
  }
  
  return { sma, upperBand, lowerBand }
}

const calculateVolumeMA = (volumes, period = 20) => {
  return calculateSMA(volumes, period)
}

function TechnicalAnalysis({ stock, stockData, onBack, taTimeframes, fetchStockData, loading, indicatorParams = {}, onOpenConfig }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(taTimeframes[1])
  const [analysisData, setAnalysisData] = useState(null)
  const [signal, setSignal] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [localLoading, setLocalLoading] = useState(true)
  const [error, setError] = useState(null)

  // Merge with defaults
  const params = useMemo(() => ({
    rsi: { period: 14, overbought: 70, oversold: 30, ...indicatorParams.rsi },
    macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, ...indicatorParams.macd },
    sma: { shortPeriod: 20, longPeriod: 50, ...indicatorParams.sma },
    ema: { shortPeriod: 12, longPeriod: 26, ...indicatorParams.ema },
    bollinger: { period: 20, stdDev: 2, ...indicatorParams.bollinger },
    volume: { maPeriod: 20, ...indicatorParams.volume }
  }), [indicatorParams])

  useEffect(() => {
    if (!stockData?.ohlc || stockData.ohlc.length === 0) {
      setLocalLoading(true)
      setError(null)
      if (fetchStockData && stock) {
        fetchStockData(stock, taTimeframes[1], true)
      }
    } else if (stockData?.ohlc && stockData.ohlc.length > 0) {
      performAnalysis()
      setLocalLoading(false)
    }
  }, [stockData])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stockData?.ohlc && stockData.ohlc.length > 0) {
        performAnalysis()
        setLocalLoading(false)
      } else if (!localLoading) {
        setError('Unable to fetch stock data for analysis')
      }
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [stockData])

  const performAnalysis = () => {
    if (!stockData?.ohlc) return

    const ohlc = stockData.ohlc
    const closes = ohlc.map(d => d.close)
    const highs = ohlc.map(d => d.high)
    const lows = ohlc.map(d => d.low)
    const volumes = ohlc.map(d => d.volume)
    
    // Calculate all indicators using configurable parameters
    const smaShort = calculateSMA(closes, params.sma.shortPeriod)
    const smaLong = calculateSMA(closes, params.sma.longPeriod)
    const emaShort = calculateEMA(closes, params.ema.shortPeriod)
    const emaLong = calculateEMA(closes, params.ema.longPeriod)
    const rsi = calculateRSI(closes, params.rsi.period)
    const { macdLine, signalLine, histogram } = calculateMACD(
      closes, 
      params.macd.fastPeriod, 
      params.macd.slowPeriod, 
      params.macd.signalPeriod
    )
    const { sma: bbSma, upperBand, lowerBand } = calculateBollingerBands(
      closes, 
      params.bollinger.period, 
      params.bollinger.stdDev
    )
    const volumeMA = calculateVolumeMA(volumes, params.volume.maPeriod)
    
    // Current values
    const currentPrice = closes[closes.length - 1]
    const currentRSI = rsi[rsi.length - 1]
    const currentMACD = macdLine[macdLine.length - 1]
    const currentSignal = signalLine[signalLine.length - 1]
    const currentSMAShort = smaShort[smaShort.length - 1]
    const currentSMALong = smaLong[smaLong.length - 1]
    const currentEMAShort = emaShort[emaShort.length - 1]
    const currentEMALong = emaLong[emaLong.length - 1]
    const currentBBUpper = upperBand[upperBand.length - 1]
    const currentBBLower = lowerBand[lowerBand.length - 1]
    
    // Analyze signals
    const signals = []
    const analysis = []
    
    // RSI Analysis
    let rsiSignal = 'neutral'
    let rsiText = ''
    if (currentRSI < params.rsi.oversold) {
      rsiSignal = 'buy'
      rsiText = `RSI is at ${currentRSI.toFixed(2)}, indicating oversold conditions (below ${params.rsi.oversold}) - potential buying opportunity`
      signals.push({ indicator: `RSI (${params.rsi.period})`, signal: 'BUY', strength: 'STRONG', description: rsiText, color: 'positive' })
    } else if (currentRSI > params.rsi.overbought) {
      rsiSignal = 'sell'
      rsiText = `RSI is at ${currentRSI.toFixed(2)}, indicating overbought conditions (above ${params.rsi.overbought}) - potential selling pressure`
      signals.push({ indicator: `RSI (${params.rsi.period})`, signal: 'SELL', strength: 'STRONG', description: rsiText, color: 'negative' })
    } else {
      rsiText = `RSI is at ${currentRSI.toFixed(2)}, indicating neutral momentum (between ${params.rsi.oversold}-${params.rsi.overbought})`
      signals.push({ indicator: `RSI (${params.rsi.period})`, signal: 'NEUTRAL', strength: 'WEAK', description: rsiText, color: 'neutral' })
    }
    analysis.push({ name: 'RSI', value: currentRSI.toFixed(2), threshold: `${params.rsi.oversold}/${params.rsi.overbought}`, status: rsiSignal, details: rsiText })
    
    // MACD Analysis
    let macdSignal = 'neutral'
    let macdText = ''
    if (currentMACD > currentSignal) {
      macdSignal = 'buy'
      macdText = `MACD (${currentMACD.toFixed(2)}) is above Signal (${currentSignal.toFixed(2)}) - Bullish crossover (${params.macd.fastPeriod}/${params.macd.slowPeriod}/${params.macd.signalPeriod})`
      signals.push({ indicator: 'MACD', signal: 'BUY', strength: 'MODERATE', description: macdText, color: 'positive' })
    } else if (currentMACD < currentSignal) {
      macdSignal = 'sell'
      macdText = `MACD (${currentMACD.toFixed(2)}) is below Signal (${currentSignal.toFixed(2)}) - Bearish crossover`
      signals.push({ indicator: 'MACD', signal: 'SELL', strength: 'MODERATE', description: macdText, color: 'negative' })
    } else {
      macdText = `MACD and Signal lines are converging - waiting for clear direction`
      signals.push({ indicator: 'MACD', signal: 'NEUTRAL', strength: 'WEAK', description: macdText, color: 'neutral' })
    }
    analysis.push({ name: 'MACD', value: currentMACD.toFixed(2), threshold: 'Signal Line', status: macdSignal, details: macdText })
    
    // Moving Averages Analysis
    let maSignal = 'neutral'
    let maText = ''
    if (currentPrice > currentSMALong && currentPrice > currentSMAShort) {
      maSignal = 'buy'
      maText = `Price (₹${currentPrice.toFixed(2)}) is above SMA${params.sma.longPeriod} (₹${currentSMALong?.toFixed(2)}) and SMA${params.sma.shortPeriod} (₹${currentSMAShort?.toFixed(2)}) - Strong uptrend`
      signals.push({ indicator: `SMA (${params.sma.shortPeriod}/${params.sma.longPeriod})`, signal: 'BUY', strength: 'STRONG', description: maText, color: 'positive' })
    } else if (currentPrice < currentSMALong && currentPrice < currentSMAShort) {
      maSignal = 'sell'
      maText = `Price (₹${currentPrice.toFixed(2)}) is below SMA${params.sma.longPeriod} (₹${currentSMALong?.toFixed(2)}) and SMA${params.sma.shortPeriod} (₹${currentSMAShort?.toFixed(2)}) - Downtrend`
      signals.push({ indicator: `SMA (${params.sma.shortPeriod}/${params.sma.longPeriod})`, signal: 'SELL', strength: 'STRONG', description: maText, color: 'negative' })
    } else {
      maText = `Price is between key moving averages - consolidating`
      signals.push({ indicator: `SMA (${params.sma.shortPeriod}/${params.sma.longPeriod})`, signal: 'NEUTRAL', strength: 'WEAK', description: maText, color: 'neutral' })
    }
    analysis.push({ name: 'SMA', value: `Short: ₹${currentSMAShort?.toFixed(2) || 'N/A'}`, threshold: 'Price vs SMA', status: maSignal, details: maText })
    
    // Bollinger Bands Analysis
    let bbSignal = 'neutral'
    let bbText = ''
    if (currentPrice > currentBBUpper) {
      bbSignal = 'sell'
      bbText = `Price is above upper Bollinger Band (${params.bollinger.period}/${params.bollinger.stdDev}σ) - potentially overbought`
      signals.push({ indicator: 'Bollinger Bands', signal: 'SELL', strength: 'MODERATE', description: bbText, color: 'negative' })
    } else if (currentPrice < currentBBLower) {
      bbSignal = 'buy'
      bbText = `Price is below lower Bollinger Band - potentially oversold`
      signals.push({ indicator: 'Bollinger Bands', signal: 'BUY', strength: 'MODERATE', description: bbText, color: 'positive' })
    } else {
      bbText = `Price is within Bollinger Bands - normal volatility range`
      signals.push({ indicator: 'Bollinger Bands', signal: 'NEUTRAL', strength: 'WEAK', description: bbText, color: 'neutral' })
    }
    analysis.push({ name: 'BB', value: 'Active', threshold: 'Upper/Lower', status: bbSignal, details: bbText })
    
    // EMA Crossover Analysis
    let emaSignal = 'neutral'
    let emaText = ''
    if (currentEMAShort > currentEMALong) {
      emaSignal = 'buy'
      emaText = `EMA${params.ema.shortPeriod} (₹${currentEMAShort?.toFixed(2)}) is above EMA${params.ema.longPeriod} (₹${currentEMALong?.toFixed(2)}) - Bullish momentum`
      signals.push({ indicator: `EMA Crossover`, signal: 'BUY', strength: 'MODERATE', description: emaText, color: 'positive' })
    } else if (currentEMAShort < currentEMALong) {
      emaSignal = 'sell'
      emaText = `EMA${params.ema.shortPeriod} (₹${currentEMAShort?.toFixed(2)}) is below EMA${params.ema.longPeriod} (₹${currentEMALong?.toFixed(2)}) - Bearish momentum`
      signals.push({ indicator: `EMA Crossover`, signal: 'SELL', strength: 'MODERATE', description: emaText, color: 'negative' })
    } else {
      emaText = `EMA lines are aligned - waiting for clear signal`
      signals.push({ indicator: `EMA Crossover`, signal: 'NEUTRAL', strength: 'WEAK', description: emaText, color: 'neutral' })
    }
    analysis.push({ name: 'EMA', value: `Short: ₹${currentEMAShort?.toFixed(2) || 'N/A'}`, threshold: '12/26 Cross', status: emaSignal, details: emaText })
    
    // Calculate overall signal
    const buySignals = signals.filter(s => s.signal === 'BUY').length
    const sellSignals = signals.filter(s => s.signal === 'SELL').length
    const totalSignals = signals.filter(s => s.signal !== 'NEUTRAL').length
    
    let overallSignal = 'NEUTRAL'
    let overallStrength = ''
    if (totalSignals === 0) {
      overallSignal = 'NEUTRAL'
      overallStrength = 'No clear trend'
    } else if (buySignals > sellSignals) {
      overallSignal = buySignals / totalSignals > 0.7 ? 'STRONG BUY' : 'BUY'
      overallStrength = `${buySignals} of ${totalSignals} indicators bullish`
    } else if (sellSignals > buySignals) {
      overallSignal = sellSignals / totalSignals > 0.7 ? 'STRONG SELL' : 'SELL'
      overallStrength = `${sellSignals} of ${totalSignals} indicators bearish`
    }
    
    // Prepare chart data with indicators
    const chartData = ohlc.map((d, i) => ({
      ...d,
      smaShort: smaShort[i],
      smaLong: smaLong[i],
      emaShort: emaShort[i],
      emaLong: emaLong[i],
      rsi: rsi[i],
      macd: macdLine[i],
      macdSignal: signalLine[i],
      macdHist: histogram[i],
      bbUpper: upperBand[i],
      bbLower: lowerBand[i],
      bbMid: bbSma[i],
      volumeMA: volumeMA[i],
      isGreen: d.close >= d.open
    }))
    
    setAnalysisData({
      chartData,
      signals,
      analysis,
      chartDataRSI: chartData.map(d => ({ time: d.date, value: d.rsi })),
      chartDataMACD: chartData.map(d => ({ time: d.date, macd: d.macd, signal: d.macdSignal, hist: d.macdHist })),
      chartDataVolume: chartData.map(d => ({ time: d.date, volume: d.volume, isGreen: d.isGreen, ma: d.volumeMA }))
    })
    
    setSignal({ type: overallSignal, strength: overallStrength, buyCount: buySignals, sellCount: sellSignals, total: totalSignals })
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value)
  }

  const getSignalColor = (type) => {
    switch(type) {
      case 'STRONG BUY': return 'text-positive'
      case 'BUY': return 'text-positive'
      case 'STRONG SELL': return 'text-negative'
      case 'SELL': return 'text-negative'
      default: return 'text-textSecondary'
    }
  }

  const getSignalBg = (type) => {
    switch(type) {
      case 'STRONG BUY': return 'bg-positive/20 border-positive'
      case 'BUY': return 'bg-positive/10 border-positive/50'
      case 'STRONG SELL': return 'bg-negative/20 border-negative'
      case 'SELL': return 'bg-negative/10 border-negative/50'
      default: return 'bg-surfaceLight border-white/10'
    }
  }

  const getIndicatorStatusColor = (status) => {
    switch(status) {
      case 'buy': return 'text-positive'
      case 'sell': return 'text-negative'
      default: return 'text-textSecondary'
    }
  }

  if (localLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-96"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-textSecondary">Loading stock data for analysis...</p>
          {error && <p className="text-negative mt-2 text-sm">{error}</p>}
        </div>
      </motion.div>
    )
  }

  if (error && !analysisData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-96"
      >
        <div className="text-negative mb-4 text-center">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{error}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setError(null)
            setLocalLoading(true)
            if (fetchStockData && stock) {
              fetchStockData(stock, taTimeframes[1], true)
            }
          }}
          className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surfaceLight"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Analysis
        </motion.button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="glass p-2.5 rounded-lg hover:bg-surfaceLight transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-semibold">{stock?.name}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-surfaceLight text-textSecondary">
              {stock?.symbol}
            </span>
          </div>
          <p className="text-textSecondary text-sm">Technical Analysis</p>
        </div>
        
        {/* Indicator Config Button */}
        {onOpenConfig && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenConfig}
            className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surfaceLight transition-colors"
          >
            <Sliders className="w-4 h-4 text-primary" />
            <span className="text-sm">Configure</span>
          </motion.button>
        )}
        
        <TimeframeSelector 
          timeframes={taTimeframes}
          selected={selectedTimeframe}
          onSelect={setSelectedTimeframe}
        />
      </div>

      {/* Signal Banner */}
      {signal && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`glass rounded-2xl p-6 mb-6 border-2 ${getSignalBg(signal.type)}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                signal.type.includes('BUY') ? 'bg-positive/20' : signal.type.includes('SELL') ? 'bg-negative/20' : 'bg-surfaceLight'
              }`}>
                {signal.type.includes('BUY') ? (
                  <TrendingUp className="w-8 h-8 text-positive" />
                ) : signal.type.includes('SELL') ? (
                  <TrendingDown className="w-8 h-8 text-negative" />
                ) : (
                  <Target className="w-8 h-8 text-textSecondary" />
                )}
              </div>
              <div>
                <p className="text-sm text-textSecondary mb-1">Overall Signal</p>
                <p className={`text-3xl font-bold ${getSignalColor(signal.type)}`}>
                  {signal.type}
                </p>
                <p className="text-sm text-textSecondary mt-1">{signal.strength}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-sm text-textSecondary">Buy Signals</p>
                <p className="text-2xl font-bold text-positive">{signal.buyCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-textSecondary">Sell Signals</p>
                <p className="text-2xl font-bold text-negative">{signal.sellCount}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={performAnalysis}
                className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surfaceLight"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'summary', label: 'Summary', icon: Target },
          { id: 'price', label: 'Price & MA', icon: LineChart },
          { id: 'rsi', label: 'RSI', icon: Activity },
          { id: 'macd', label: 'MACD', icon: Zap },
          { id: 'bollinger', label: 'Bollinger Bands', icon: Target },
          { id: 'volume', label: 'Volume', icon: BarChart2 }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-primary text-white' 
                : 'glass hover:bg-surfaceLight'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Summary Tab */}
        {activeTab === 'summary' && analysisData && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Indicator Signals */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Indicator Signals
              </h3>
              <div className="space-y-3">
                {analysisData.signals.map((sig, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl border ${
                      sig.color === 'positive' ? 'bg-positive/10 border-positive/30' :
                      sig.color === 'negative' ? 'bg-negative/10 border-negative/30' :
                      'bg-surfaceLight border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{sig.indicator}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sig.signal === 'BUY' ? 'bg-positive/20 text-positive' :
                        sig.signal === 'SELL' ? 'bg-negative/20 text-negative' :
                        'bg-surface text-textSecondary'
                      }`}>
                        {sig.signal} ({sig.strength})
                      </span>
                    </div>
                    <p className="text-sm text-textSecondary">{sig.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Analysis Breakdown */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Analysis Breakdown
              </h3>
              <div className="space-y-4">
                {analysisData.analysis.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-surfaceLight"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.name}</span>
                      <span className={`text-sm font-mono ${getIndicatorStatusColor(item.status)}`}>
                        {item.value}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-textSecondary mb-2">
                      <span>Threshold: {item.threshold}</span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        item.status === 'buy' ? 'bg-positive/20 text-positive' :
                        item.status === 'sell' ? 'bg-negative/20 text-negative' :
                        'bg-surface text-textSecondary'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-textSecondary">{item.details}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Price & Moving Averages Tab */}
        {activeTab === 'price' && analysisData && (
          <motion.div
            key="price"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Price Action with Moving Averages</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysisData.chartData}>
                    <defs>
                      <linearGradient id="priceGradientTA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(value) => [formatCurrency(value), '']}
                    />
                    <Area type="monotone" dataKey="close" stroke="none" fill="url(#priceGradientTA)" />
                    <Line type="monotone" dataKey="smaShort" stroke="#f59e0b" strokeWidth={2} dot={false} name={`SMA ${params.sma.shortPeriod}`} />
                    <Line type="monotone" dataKey="smaLong" stroke="#8b5cf6" strokeWidth={2} dot={false} name={`SMA ${params.sma.longPeriod}`} />
                    <Line type="monotone" dataKey="emaShort" stroke="#10b981" strokeWidth={2} dot={false} name={`EMA ${params.ema.shortPeriod}`} />
                    <Line type="monotone" dataKey="emaLong" stroke="#ef4444" strokeWidth={2} dot={false} name={`EMA ${params.ema.longPeriod}`} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-amber-500"></div>
                  <span>SMA {params.sma.shortPeriod}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-purple-500"></div>
                  <span>SMA {params.sma.longPeriod}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-emerald-500"></div>
                  <span>EMA {params.ema.shortPeriod}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-red-500"></div>
                  <span>EMA {params.ema.longPeriod}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RSI Tab */}
        {activeTab === 'rsi' && analysisData && (
          <motion.div
            key="rsi"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Relative Strength Index (RSI {params.rsi.period})</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysisData.chartDataRSI}>
                    <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <ReferenceLine y={params.rsi.overbought} stroke="#ef4444" strokeDasharray="5 5" />
                    <ReferenceLine y={params.rsi.oversold} stroke="#10b981" strokeDasharray="5 5" />
                    <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-negative/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-textSecondary mb-1">Overbought ({params.rsi.overbought}+)</p>
                  <p className="text-negative font-semibold">SELL SIGNAL</p>
                </div>
                <div className="bg-surfaceLight rounded-lg p-4 text-center">
                  <p className="text-xs text-textSecondary mb-1">Neutral ({params.rsi.oversold}-{params.rsi.overbought})</p>
                  <p className="text-textSecondary font-semibold">NO SIGNAL</p>
                </div>
                <div className="bg-positive/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-textSecondary mb-1">Oversold ({params.rsi.oversold}-)</p>
                  <p className="text-positive font-semibold">BUY SIGNAL</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MACD Tab */}
        {activeTab === 'macd' && analysisData && (
          <motion.div
            key="macd"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">MACD ({params.macd.fastPeriod}/{params.macd.slowPeriod}/{params.macd.signalPeriod})</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysisData.chartDataMACD}>
                    <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="hist" name="Histogram">
                      {analysisData.chartDataMACD.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.hist >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} name="MACD" />
                    <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={2} dot={false} name="Signal" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-blue-500"></div>
                  <span>MACD Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-3 bg-amber-500"></div>
                  <span>Signal Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-positive"></div>
                  <span>Bullish Histogram</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-negative"></div>
                  <span>Bearish Histogram</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bollinger Bands Tab */}
        {activeTab === 'bollinger' && analysisData && (
          <motion.div
            key="bollinger"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Bollinger Bands ({params.bollinger.period}/{params.bollinger.stdDev}σ)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysisData.chartData}>
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(value) => [formatCurrency(value), '']}
                    />
                    <Area type="monotone" dataKey="close" stroke="none" fill="rgba(59, 130, 246, 0.1)" />
                    <Line type="monotone" dataKey="bbUpper" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Upper Band" />
                    <Line type="monotone" dataKey="bbMid" stroke="#f59e0b" strokeWidth={2} dot={false} name="Middle (SMA)" />
                    <Line type="monotone" dataKey="bbLower" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Lower Band" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-negative/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-textSecondary mb-1">Price Above Upper Band</p>
                  <p className="text-negative font-semibold">OVERBOUGHT - SELL</p>
                </div>
                <div className="bg-surfaceLight rounded-lg p-4 text-center">
                  <p className="text-xs text-textSecondary mb-1">Price Within Bands</p>
                  <p className="text-textSecondary font-semibold">NORMAL - WAIT</p>
                </div>
                <div className="bg-positive/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-textSecondary mb-1">Price Below Lower Band</p>
                  <p className="text-positive font-semibold">OVERSOLD - BUY</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Volume Tab */}
        {activeTab === 'volume' && analysisData && (
          <motion.div
            key="volume"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Volume Analysis (MA {params.volume.maPeriod})</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysisData.chartDataVolume}>
                    <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(value) => [value >= 1e6 ? `${(value/1e6).toFixed(2)}M` : value >= 1e3 ? `${(value/1e3).toFixed(2)}K` : value, 'Volume']}
                    />
                    <Bar dataKey="volume" name="Volume">
                      {analysisData.chartDataVolume.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isGreen ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="ma" stroke="#f59e0b" strokeWidth={2} dot={false} name={`MA ${params.volume.maPeriod}`} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-positive"></div>
                  <span>Buying Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-negative"></div>
                  <span>Selling Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-amber-500"></div>
                  <span>{params.volume.maPeriod}-Day MA</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="mt-6 p-4 glass rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-textSecondary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-textSecondary">
            <strong className="text-text">Disclaimer:</strong> This technical analysis is generated automatically and should not be considered as financial advice. 
            Always conduct your own research and consider consulting a financial advisor before making investment decisions. 
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default TechnicalAnalysis
