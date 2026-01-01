import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Activity, TrendingUp, TrendingDown, Target, Zap, AlertTriangle, Info, 
  RefreshCw, LineChart, BarChart2, Sliders, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  PenTool, Eye, Settings, X, ChevronDown, Minus,
  Maximize2, Minimize2, Download, Share2, Undo, Redo, Trash2, Move,
  ArrowUpRight, ArrowDownRight, MinusCircle, PlusCircle, Search, Filter, Grid3X3
} from 'lucide-react'
import { 
  ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line as RechartsLine, 
  Bar, Cell, Scatter, Label 
} from 'recharts'
import TimeframeSelector from './TimeframeSelector'

// ============================================================================
// TECHNICAL INDICATOR CALCULATION FUNCTIONS
// ============================================================================

// Simple Moving Average
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

// Exponential Moving Average
const calculateEMA = (data, period) => {
  const ema = []
  const multiplier = 2 / (period + 1)
  
  let sum = 0
  for (let i = 0; i < period; i++) {
    if (i < period - 1) {
      ema.push(null)
    } else {
      sum = data.slice(0, period).reduce((a, b) => a + b, 0)
      ema.push(sum / period)
    }
  }
  
  for (let i = period; i < data.length; i++) {
    const prevEMA = ema[i - 1]
    const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA
    ema.push(currentEMA)
  }
  
  return ema
}

// RSI Calculation
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

// MACD Calculation
const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)
  
  const macdLine = fastEMA.map((fast, i) => {
    if (fast === null || slowEMA[i] === null) return null
    return fast - slowEMA[i]
  })
  
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
  
  const histogram = macdLine.map((macd, i) => {
    if (macd === null || signalLine[i] === null) return null
    return macd - signalLine[i]
  })
  
  return { macdLine, signalLine, histogram }
}

// Bollinger Bands
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

// Stochastic Oscillator
const calculateStochastic = (highs, lows, closes, kPeriod = 14, dPeriod = 3) => {
  const stochK = []
  const stochD = []
  
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      stochK.push(null)
      stochD.push(null)
      continue
    }
    
    const highSlice = highs.slice(i - kPeriod + 1, i + 1)
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1)
    
    const highestHigh = Math.max(...highSlice)
    const lowestLow = Math.min(...lowSlice)
    const close = closes[i]
    
    if (highestHigh === lowestLow) {
      stochK.push(50)
    } else {
      stochK.push(((close - lowestHigh) / (highestHigh - lowestLow)) * 100)
    }
  }
  
  // Calculate %D (SMA of %K)
  for (let i = 0; i < stochK.length; i++) {
    if (i < kPeriod + dPeriod - 2) {
      stochD.push(null)
    } else {
      const slice = stochK.slice(i - dPeriod + 1, i + 1).filter(v => v !== null)
      if (slice.length === 0) {
        stochD.push(null)
      } else {
        stochD.push(slice.reduce((a, b) => a + b, 0) / slice.length)
      }
    }
  }
  
  return { k: stochK, d: stochD }
}

// Average True Range (ATR)
const calculateATR = (highs, lows, closes, period = 14) => {
  const trueRanges = []
  
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[0] - lows[0])
    } else {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
      trueRanges.push(tr)
    }
  }
  
  const atr = []
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atr.push(null)
    } else if (i === period - 1) {
      const sum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0)
      atr.push(sum / period)
    } else {
      atr.push((atr[i - 1] * (period - 1) + trueRanges[i]) / period)
    }
  }
  
  return atr
}

// On Balance Volume (OBV)
const calculateOBV = (closes, volumes) => {
  const obv = [0]
  
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      obv.push(obv[i - 1] + volumes[i])
    } else if (closes[i] < closes[i - 1]) {
      obv.push(obv[i - 1] - volumes[i])
    } else {
      obv.push(obv[i - 1])
    }
  }
  
  return obv
}

// VWAP (Volume Weighted Average Price)
const calculateVWAP = (ohlc) => {
  const vwap = []
  let cumulativeTPV = 0
  let cumulativeVolume = 0
  
  for (let i = 0; i < ohlc.length; i++) {
    const typicalPrice = (ohlc[i].high + ohlc[i].low + ohlc[i].close) / 3
    cumulativeTPV += typicalPrice * ohlc[i].volume
    cumulativeVolume += ohlc[i].volume
    vwap.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null)
  }
  
  return vwap
}

// Ichimoku Cloud Components
const calculateIchimoku = (highs, lows, closes) => {
  const conversionPeriod = 9
  const basePeriod = 26
  const leadingSpanBPeriod = 52
  
  const conversionLine = []
  const baseLine = []
  const leadingSpanA = []
  const leadingSpanB = []
  const laggingSpan = []
  
  // Conversion Line (Tenkan-sen)
  for (let i = 0; i < highs.length; i++) {
    if (i < conversionPeriod - 1) {
      conversionLine.push(null)
    } else {
      const highSlice = highs.slice(i - conversionPeriod + 1, i + 1)
      const lowSlice = lows.slice(i - conversionPeriod + 1, i + 1)
      conversionLine.push((Math.max(...highSlice) + Math.min(...lowSlice)) / 2)
    }
  }
  
  // Base Line (Kijun-sen)
  for (let i = 0; i < highs.length; i++) {
    if (i < basePeriod - 1) {
      baseLine.push(null)
    } else {
      const highSlice = highs.slice(i - basePeriod + 1, i + 1)
      const lowSlice = lows.slice(i - basePeriod + 1, i + 1)
      baseLine.push((Math.max(...highSlice) + Math.min(...lowSlice)) / 2)
    }
  }
  
  // Leading Span A (Senkou Span A)
  for (let i = 0; i < highs.length; i++) {
    if (i < basePeriod - 1) {
      leadingSpanA.push(null)
    } else if (conversionLine[i - basePeriod + 1] !== null && baseLine[i - basePeriod + 1] !== null) {
      leadingSpanA.push((conversionLine[i - basePeriod + 1] + baseLine[i - basePeriod + 1]) / 2)
    } else {
      leadingSpanA.push(null)
    }
  }
  
  // Leading Span B (Senkou Span B)
  for (let i = 0; i < highs.length; i++) {
    if (i < leadingSpanBPeriod - 1) {
      leadingSpanB.push(null)
    } else {
      const highSlice = highs.slice(i - leadingSpanBPeriod + 1, i + 1)
      const lowSlice = lows.slice(i - leadingSpanBPeriod + 1, i + 1)
      leadingSpanB.push((Math.max(...highSlice) + Math.min(...lowSlice)) / 2)
    }
  }
  
  // Lagging Span (Chikou Span)
  for (let i = 0; i < closes.length; i++) {
    if (i < basePeriod - 1) {
      laggingSpan.push(null)
    } else {
      laggingSpan.push(closes[i - basePeriod + 1])
    }
  }
  
  return { conversionLine, baseLine, leadingSpanA, leadingSpanB, laggingSpan }
}

// Fibonacci Retracement Levels
const calculateFibonacciLevels = (high, low) => {
  const diff = high - low
  return {
    level0: low,
    level236: low + diff * 0.236,
    level382: low + diff * 0.382,
    level500: low + diff * 0.5,
    level618: low + diff * 0.618,
    level786: low + diff * 0.786,
    level100: high
  }
}

// ============================================================================
// CHART PATTERN RECOGNITION
// ============================================================================

const detectCandlestickPatterns = (ohlc) => {
  const patterns = []
  
  for (let i = 2; i < ohlc.length; i++) {
    const current = ohlc[i]
    const prev1 = ohlc[i - 1]
    const prev2 = ohlc[i - 2]
    
    const currentBodySize = Math.abs(current.close - current.open)
    const currentUpperWick = current.high - Math.max(current.close, current.open)
    const currentLowerWick = Math.min(current.close, current.open) - current.low
    const prev1BodySize = Math.abs(prev1.close - prev1.open)
    
    // Doji
    if (currentBodySize <= currentUpperWick * 0.1 && currentBodySize <= currentLowerWick * 0.1 && 
        currentUpperWick > currentBodySize && currentLowerWick > currentBodySize) {
      patterns.push({ index: i, type: 'Doji', sentiment: 'neutral', date: current.date })
    }
    
    // Hammer (bullish reversal)
    const isHammer = currentLowerWick > currentBodySize * 2 && currentUpperWick < currentBodySize * 0.5
    if (isHammer && current.close > current.open) {
      patterns.push({ index: i, type: 'Hammer', sentiment: 'bullish', date: current.date })
    }
    
    // Shooting Star (bearish reversal)
    const isShootingStar = currentUpperWick > currentBodySize * 2 && currentLowerWick < currentBodySize * 0.5
    if (isShootingStar && current.close < current.open) {
      patterns.push({ index: i, type: 'Shooting Star', sentiment: 'bearish', date: current.date })
    }
    
    // Bullish Engulfing
    const isBullishEngulfing = 
      prev1.close < prev1.open && // Previous candle is bearish
      current.close > current.open && // Current candle is bullish
      current.open < prev1.close && // Current opens below previous close
      current.close > prev1.open // Current closes above previous open
    
    if (isBullishEngulfing) {
      patterns.push({ index: i, type: 'Bullish Engulfing', sentiment: 'bullish', date: current.date })
    }
    
    // Bearish Engulfing
    const isBearishEngulfing = 
      prev1.close > prev1.open && // Previous candle is bullish
      current.close < current.open && // Current candle is bearish
      current.open > prev1.close && // Current opens above previous close
      current.close < prev1.open // Current closes below previous open
    
    if (isBearishEngulfing) {
      patterns.push({ index: i, type: 'Bearish Engulfing', sentiment: 'bearish', date: current.date })
    }
    
    // Morning Star (3-candle bullish reversal)
    if (i >= 2) {
      const isMorningStar = 
        prev2BodySize > currentBodySize * 3 && prev2.close < prev2.open && // First candle large bearish
        Math.abs(prev1.close - prev1.open) < currentBodySize * 0.3 && // Second candle small
        current.close > current.open && current.close > (prev2.open + prev2.close) / 2 // Third candle closes above midpoint
      
      if (isMorningStar) {
        patterns.push({ index: i, type: 'Morning Star', sentiment: 'bullish', date: current.date })
      }
    }
  }
  
  return patterns
}

// Detect Divergence (Price vs RSI)
const detectDivergence = (prices, rsiValues) => {
  const divergences = []
  
  // Look for recent peaks and troughs
  const lookback = 50
  const startIndex = Math.max(0, rsiValues.length - lookback)
  
  for (let i = startIndex; i < rsiValues.length; i++) {
    if (rsiValues[i] === null) continue
    
    // Bearish Divergence: Price makes higher high, RSI makes lower high
    if (i >= 5) {
      const priceRange = prices.slice(Math.max(0, i - 10), i + 1)
      const rsiRange = rsiValues.slice(Math.max(0, i - 10), i + 1)
      
      const pricePeakIdx = priceRange.indexOf(Math.max(...priceRange))
      const rsiPeakIdx = rsiRange.indexOf(Math.max(...rsiRange.filter(v => v !== null)))
      
      if (priceRange[priceRange.length - 1] === Math.max(...priceRange) && // Current is price peak
          rsiRange[rsiRange.length - 1] !== Math.max(...rsiRange.filter(v => v !== null))) { // But not RSI peak
        divergences.push({ type: 'Bearish Divergence', severity: 'strong', date: i })
      }
    }
    
    // Bullish Divergence: Price makes lower low, RSI makes higher low
    if (i >= 5) {
      const priceRange = prices.slice(Math.max(0, i - 10), i + 1)
      const rsiRange = rsiValues.slice(Math.max(0, i - 10), i + 1)
      
      const priceLowIdx = priceRange.indexOf(Math.min(...priceRange))
      const rsiLowIdx = rsiRange.indexOf(Math.min(...rsiRange.filter(v => v !== null)))
      
      if (priceRange[priceRange.length - 1] === Math.min(...priceRange) && // Current is price low
          rsiRange[rsiRange.length - 1] !== Math.min(...rsiRange.filter(v => v !== null))) { // But not RSI low
        divergences.push({ type: 'Bullish Divergence', severity: 'strong', date: i })
      }
    }
  }
  
  return divergences
}

// ============================================================================
// DRAWING TOOLS STATE MANAGEMENT
// ============================================================================

const createDrawing = (type, points, settings = {}) => ({
  id: Date.now(),
  type,
  points,
  color: settings.color || '#3b82f6',
  lineWidth: settings.lineWidth || 2,
  visible: true
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function TechnicalAnalysis({ stock, stockData, onBack, taTimeframes, fetchStockData, loading, indicatorParams = {}, onOpenConfig }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(taTimeframes[1])
  const [analysisData, setAnalysisData] = useState(null)
  const [signal, setSignal] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [localLoading, setLocalLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Chart customization states
  const [chartType, setChartType] = useState('candlestick') // candlestick, line, area, heikin-ashi
  const [showDrawings, setShowDrawings] = useState(true)
  const [showPatterns, setShowPatterns] = useState(true)
  const [activeDrawingTool, setActiveDrawingTool] = useState(null)
  const [drawings, setDrawings] = useState([])
  const [currentDrawing, setCurrentDrawing] = useState(null)
  const [crosshair, setCrosshair] = useState(null)
  
  // Enhanced indicator toggles
  const [indicators, setIndicators] = useState({
    smaShort: true,
    smaLong: true,
    emaShort: true,
    emaLong: false,
    bollinger: true,
    vwap: false,
    ichimoku: false,
    volume: true,
    atr: false,
    stoch: false,
    obv: false
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
  
  const chartRef = useRef(null)
  const containerRef = useRef(null)
  
  // Mouse handlers for drawing
  const handleChartClick = useCallback((e) => {
    if (!activeDrawingTool || !chartRef.current) return
    
    const rect = chartRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (!currentDrawing) {
      setCurrentDrawing({ type: activeDrawingTool, points: [{ x, y }], color: '#3b82f6' })
    } else {
      const newPoints = [...currentDrawing.points, { x, y }]
      if (newPoints.length >= 2) {
        setDrawings(prev => [...prev, createDrawing(currentDrawing.type, newPoints, { color: currentDrawing.color })])
        setCurrentDrawing(null)
        setActiveDrawingTool(null)
      } else {
        setCurrentDrawing({ ...currentDrawing, points: newPoints })
      }
    }
  }, [activeDrawingTool, currentDrawing])
  
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
    const opens = ohlc.map(d => d.open)
    const volumes = ohlc.map(d => d.volume)
    
    // Calculate all indicators
    const smaShort = calculateSMA(closes, params.sma.shortPeriod)
    const smaLong = calculateSMA(closes, params.sma.longPeriod)
    const emaShort = calculateEMA(closes, params.ema.shortPeriod)
    const emaLong = calculateEMA(closes, params.ema.longPeriod)
    const rsi = calculateRSI(closes, params.rsi.period)
    const { macdLine, signalLine, histogram } = calculateMACD(closes, params.macd.fastPeriod, params.macd.slowPeriod, params.macd.signalPeriod)
    const { sma: bbSma, upperBand, lowerBand } = calculateBollingerBands(closes, params.bollinger.period, params.bollinger.stdDev)
    const volumeMA = calculateSMA(volumes, params.volume.maPeriod)
    const atr = calculateATR(highs, lows, closes, params.atr.period)
    const { k: stochK, d: stochD } = calculateStochastic(highs, lows, closes, params.stoch.kPeriod, params.stoch.dPeriod)
    const obv = calculateOBV(closes, volumes)
    const vwap = calculateVWAP(ohlc)
    const ichimoku = calculateIchimoku(highs, lows, closes)
    
    // Detect patterns
    const patterns = detectCandlestickPatterns(ohlc)
    
    // Detect divergences
    const divergences = detectDivergence(closes, rsi)
    
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
    const currentATR = atr[atr.length - 1]
    const currentStochK = stochK[stochK.length - 1]
    const currentStochD = stochD[stochD.length - 1]
    
    // Generate signals
    const signals = []
    
    // RSI Analysis
    let rsiSignal = 'neutral'
    let rsiText = ''
    if (currentRSI < params.rsi.oversold) {
      rsiSignal = 'buy'
      rsiText = `RSI at ${currentRSI?.toFixed(2)} - Oversold conditions, potential reversal`
      signals.push({ indicator: 'RSI', signal: 'BUY', strength: 'STRONG', description: rsiText, color: 'positive' })
    } else if (currentRSI > params.rsi.overbought) {
      rsiSignal = 'sell'
      rsiText = `RSI at ${currentRSI?.toFixed(2)} - Overbought conditions, possible pullback`
      signals.push({ indicator: 'RSI', signal: 'SELL', strength: 'STRONG', description: rsiText, color: 'negative' })
    } else {
      rsiText = `RSI at ${currentRSI?.toFixed(2)} - Neutral momentum`
      signals.push({ indicator: 'RSI', signal: 'NEUTRAL', strength: 'WEAK', description: rsiText, color: 'neutral' })
    }
    
    // MACD Analysis
    let macdSignal = 'neutral'
    if (currentMACD > currentSignal) {
      macdSignal = 'buy'
      signals.push({ indicator: 'MACD', signal: 'BUY', strength: 'MODERATE', description: 'MACD above signal line - bullish momentum', color: 'positive' })
    } else if (currentMACD < currentSignal) {
      macdSignal = 'sell'
      signals.push({ indicator: 'MACD', signal: 'SELL', strength: 'MODERATE', description: 'MACD below signal line - bearish momentum', color: 'negative' })
    } else {
      signals.push({ indicator: 'MACD', signal: 'NEUTRAL', strength: 'WEAK', description: 'MACD converging with signal', color: 'neutral' })
    }
    
    // Golden/Death Cross Detection
    const sma50 = smaShort[smaShort.length - 1]
    const sma200 = smaLong[smaLong.length - 1]
    const prevSMA50 = smaShort[smaShort.length - 2]
    const prevSMA200 = smaLong[smaLong.length - 2]
    
    if (prevSMA50 < prevSMA200 && sma50 > sma200) {
      signals.push({ indicator: 'Golden Cross', signal: 'BUY', strength: 'STRONG', description: 'SMA 50 crossed above SMA 200 - major bullish signal', color: 'positive' })
    } else if (prevSMA50 > prevSMA200 && sma50 < sma200) {
      signals.push({ indicator: 'Death Cross', signal: 'SELL', strength: 'STRONG', description: 'SMA 50 crossed below SMA 200 - major bearish signal', color: 'negative' })
    }
    
    // Stochastic Analysis
    if (currentStochK < params.stoch.oversold && currentStochD < params.stoch.oversold) {
      signals.push({ indicator: 'Stochastic', signal: 'BUY', strength: 'MODERATE', description: 'Oversold territory - potential bounce', color: 'positive' })
    } else if (currentStochK > params.stoch.overbought && currentStochD > params.stoch.overbought) {
      signals.push({ indicator: 'Stochastic', signal: 'SELL', strength: 'MODERATE', description: 'Overbought territory - risk of reversal', color: 'negative' })
    }
    
    // Bollinger Band Analysis
    if (currentPrice > currentBBUpper) {
      signals.push({ indicator: 'Bollinger', signal: 'SELL', strength: 'MODERATE', description: 'Price above upper band - potential mean reversion', color: 'negative' })
    } else if (currentPrice < currentBBLower) {
      signals.push({ indicator: 'Bollinger', signal: 'BUY', strength: 'MODERATE', description: 'Price below lower band - oversold condition', color: 'positive' })
    }
    
    // Divergence signals
    divergences.forEach(div => {
      signals.push({ indicator: div.type, signal: div.type.includes('Bullish') ? 'BUY' : 'SELL', strength: 'STRONG', description: `${div.type} detected - strong reversal signal`, color: div.type.includes('Bullish') ? 'positive' : 'negative' })
    })
    
    // Pattern signals
    patterns.slice(-5).forEach(pattern => {
      signals.push({ indicator: pattern.type, signal: pattern.sentiment === 'bullish' ? 'BUY' : pattern.sentiment === 'bearish' ? 'SELL' : 'NEUTRAL', strength: 'MODERATE', description: `${pattern.type} pattern detected`, color: pattern.sentiment === 'bullish' ? 'positive' : pattern.sentiment === 'bearish' ? 'negative' : 'neutral' })
    })
    
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
      overallStrength = `${buySignals} bullish vs ${sellSignals} bearish signals`
    } else if (sellSignals > buySignals) {
      overallSignal = sellSignals / totalSignals > 0.7 ? 'STRONG SELL' : 'SELL'
      overallStrength = `${sellSignals} bearish vs ${buySignals} bullish signals`
    }
    
    // Prepare chart data
    const chartData = ohlc.map((d, i) => {
      const isGreen = d.close >= d.open
      return {
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
        atr: atr[i],
        stochK: stochK[i],
        stochD: stochD[i],
        obv: obv[i],
        vwap: vwap[i],
        ichimokuConversion: ichimoku.conversionLine[i],
        ichimokuBase: ichimoku.baseLine[i],
        ichimokuSpanA: ichimoku.leadingSpanA[i],
        ichimokuSpanB: ichimoku.leadingSpanB[i],
        ichimokuLagging: ichimoku.laggingSpan[i],
        isGreen,
        heikinClose: (d.open + d.high + d.low + d.close) / 4,
        heikinOpen: i > 0 ? (chartData[i - 1]?.heikinClose || (d.open + d.close) / 2) : (d.open + d.close) / 2,
        heikinHigh: Math.max(d.high, d.open, d.close),
        heikinLow: Math.min(d.low, d.open, d.close)
      }
    })
    
    setAnalysisData({
      chartData,
      signals,
      patterns,
      divergences,
      chartDataRSI: chartData.map(d => ({ time: d.date, value: d.rsi })),
      chartDataMACD: chartData.map(d => ({ time: d.date, macd: d.macd, signal: d.macdSignal, hist: d.macdHist })),
      chartDataVolume: chartData.map(d => ({ time: d.date, volume: d.volume, isGreen: d.isGreen, ma: d.volumeMA })),
      chartDataStoch: chartData.map(d => ({ time: d.date, k: d.stochK, d: d.stochD })),
      chartDataATR: chartData.map(d => ({ time: d.date, value: d.atr })),
      chartDataOBV: chartData.map(d => ({ time: d.date, value: d.obv })),
      chartDataIchimoku: chartData.map(d => ({
        time: d.date,
        conversion: d.ichimokuConversion,
        base: d.ichimokuBase,
        spanA: d.ichimokuSpanA,
        spanB: d.ichimokuSpanB,
        lagging: d.ichimokuLagging
      }))
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
  
  const toggleIndicator = (indicator) => {
    setIndicators(prev => ({ ...prev, [indicator]: !prev[indicator] }))
  }
  
  const renderCandlestick = (props) => {
    const { x, y, width, low, high, open, close } = props
    const isGreen = close >= open
    const candleHeight = Math.max(1, Math.abs(close - open))
    const candleY = isGreen ? y - candleHeight : y
    const color = isGreen ? '#10b981' : '#ef4444'
    
    return (
      <g>
        {/* Wick */}
        <line x1={x + width / 2} y1={y - (high - Math.max(open, close))} x2={x + width / 2} y2={y - (low - Math.min(open, close))} stroke={color} strokeWidth={1} />
        {/* Body */}
        <rect x={x} y={candleY} width={width} height={candleHeight} fill={color} stroke={color} />
      </g>
    )
  }
  
  const clearDrawings = () => {
    setDrawings([])
    setCurrentDrawing(null)
  }
  
  if (localLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-textSecondary">Loading technical analysis...</p>
          {error && <p className="text-negative mt-2 text-sm">{error}</p>}
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack} className="glass p-2.5 rounded-lg hover:bg-surfaceLight transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-semibold">{stock?.name}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-surfaceLight text-textSecondary">{stock?.symbol}</span>
          </div>
          <p className="text-textSecondary text-sm">Advanced Technical Analysis</p>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          {['candlestick', 'line', 'area'].map(type => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setChartType(type)}
              className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                chartType === type ? 'bg-primary text-white' : 'hover:bg-surfaceLight text-textSecondary'
              }`}
            >
              {type}
            </motion.button>
          ))}
        </div>
        
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveDrawingTool('trendline')} className={`p-2 rounded ${activeDrawingTool === 'trendline' ? 'bg-primary text-white' : 'hover:bg-surfaceLight'}`} title="Trendline">
            <Line className="w-4 h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveDrawingTool('horizontal')} className={`p-2 rounded ${activeDrawingTool === 'horizontal' ? 'bg-primary text-white' : 'hover:bg-surfaceLight'}`} title="Horizontal Line">
            <Minus className="w-4 h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveDrawingTool('ray')} className={`p-2 rounded ${activeDrawingTool === 'ray' ? 'bg-primary text-white' : 'hover:bg-surfaceLight'}`} title="Horizontal Ray">
            <TrendingUp className="w-4 h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={clearDrawings} className="p-2 rounded hover:bg-negative/20 text-negative" title="Clear All">
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
        
        {/* Toggle Views */}
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowDrawings(!showDrawings)} className={`p-2 rounded-lg ${showDrawings ? 'bg-primary text-white' : 'glass hover:bg-surfaceLight'}`} title="Toggle Drawings">
            <PenTool className="w-4 h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowPatterns(!showPatterns)} className={`p-2 rounded-lg ${showPatterns ? 'bg-primary text-white' : 'glass hover:bg-surfaceLight'}`} title="Toggle Patterns">
            <Grid3X3 className="w-4 h-4" />
          </motion.button>
        </div>
        
        {onOpenConfig && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onOpenConfig} className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surfaceLight transition-colors">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="text-sm">Configure</span>
          </motion.button>
        )}
        
        <TimeframeSelector timeframes={taTimeframes} selected={selectedTimeframe} onSelect={setSelectedTimeframe} />
      </div>
      
      {/* Signal Banner */}
      {signal && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`glass rounded-2xl p-6 mb-6 border-2 ${getSignalBg(signal.type)}`}>
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
                <p className={`text-3xl font-bold ${getSignalColor(signal.type)}`}>{signal.type}</p>
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
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={performAnalysis} className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surfaceLight">
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
          { id: 'ichimoku', label: 'Ichimoku', color: '#a855f7' },
          { id: 'stoch', label: 'Stochastic', color: '#f97316' },
          { id: 'atr', label: 'ATR', color: '#84cc16' },
          { id: 'obv', label: 'OBV', color: '#14b8a6' }
        ].map(indicator => (
          <motion.button
            key={indicator.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleIndicator(indicator.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors border ${
              indicators[indicator.id] 
                ? 'bg-primary/20 border-primary/50 text-white' 
                : 'glass hover:bg-surfaceLight border-transparent'
            }`}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: indicator.color }} />
            <span className="text-sm">{indicator.label}</span>
          </motion.button>
        ))}
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'summary', label: 'Summary', icon: Target },
          { id: 'price', label: 'Price', icon: LineChart },
          { id: 'indicators', label: 'Indicators', icon: Activity },
          { id: 'oscillators', label: 'Oscillators', icon: Zap },
          { id: 'patterns', label: 'Patterns', icon: Grid3X3 },
          { id: 'volume', label: 'Volume', icon: BarChart2 }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-primary text-white' : 'glass hover:bg-surfaceLight'
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
          <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart */}
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Price Chart
                </h3>
                <div className="h-80" ref={chartRef} onClick={handleChartClick}>
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
                      {chartType === 'area' && <Area type="monotone" dataKey="close" stroke="none" fill="url(#priceGradientTA)" />}
                      {chartType === 'line' && <RechartsLine type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} />}
                      {indicators.smaShort && <RechartsLine type="monotone" dataKey="smaShort" stroke="#f59e0b" strokeWidth={2} dot={false} name={`SMA ${params.sma.shortPeriod}`} />}
                      {indicators.smaLong && <RechartsLine type="monotone" dataKey="smaLong" stroke="#8b5cf6" strokeWidth={2} dot={false} name={`SMA ${params.sma.longPeriod}`} />}
                      {indicators.emaShort && <RechartsLine type="monotone" dataKey="emaShort" stroke="#10b981" strokeWidth={2} dot={false} name={`EMA ${params.ema.shortPeriod}`} />}
                      {indicators.bollinger && (
                        <>
                          <RechartsLine type="monotone" dataKey="bbUpper" stroke="#06b6d4" strokeWidth={1} dot={false} name="BB Upper" />
                          <RechartsLine type="monotone" dataKey="bbMid" stroke="#06b6d4" strokeWidth={1} dot={false} strokeDasharray="5 5" name="BB Mid" />
                          <RechartsLine type="monotone" dataKey="bbLower" stroke="#06b6d4" strokeWidth={1} dot={false} name="BB Lower" />
                        </>
                      )}
                      {indicators.vwap && <RechartsLine type="monotone" dataKey="vwap" stroke="#ec4899" strokeWidth={2} dot={false} name="VWAP" />}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Signals Summary */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Trading Signals
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {analysisData.signals.slice(0, 10).map((sig, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`p-3 rounded-xl border ${
                      sig.color === 'positive' ? 'bg-positive/10 border-positive/30' :
                      sig.color === 'negative' ? 'bg-negative/10 border-negative/30' :
                      'bg-surfaceLight border-white/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{sig.indicator}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sig.signal === 'BUY' ? 'bg-positive/20 text-positive' :
                          sig.signal === 'SELL' ? 'bg-negative/20 text-negative' :
                          'bg-surface text-textSecondary'
                        }`}>
                          {sig.signal}
                        </span>
                      </div>
                      <p className="text-xs text-textSecondary">{sig.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Detected Patterns */}
            {analysisData.patterns.length > 0 && showPatterns && (
              <div className="glass rounded-2xl p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-primary" />
                  Detected Chart Patterns
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {analysisData.patterns.slice(-10).reverse().map((pattern, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`flex-shrink-0 p-3 rounded-xl border ${
                      pattern.sentiment === 'bullish' ? 'bg-positive/10 border-positive/30' :
                      pattern.sentiment === 'bearish' ? 'bg-negative/10 border-negative/30' :
                      'bg-surfaceLight border-white/10'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{pattern.type}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          pattern.sentiment === 'bullish' ? 'bg-positive/20 text-positive' :
                          pattern.sentiment === 'bearish' ? 'bg-negative/20 text-negative' :
                          'bg-surface text-textSecondary'
                        }`}>
                          {pattern.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-textSecondary">{pattern.date}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Price Tab */}
        {activeTab === 'price' && analysisData && (
          <motion.div key="price" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Price Action with Moving Averages</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-amber-500"></div><span>SMA {params.sma.shortPeriod}</span></div>
                  <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-purple-500"></div><span>SMA {params.sma.longPeriod}</span></div>
                  <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-emerald-500"></div><span>EMA {params.ema.shortPeriod}</span></div>
                </div>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysisData.chartData}>
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(value) => [formatCurrency(value), '']} />
                    {chartType === 'area' && <Area type="monotone" dataKey="close" stroke="none" fill="rgba(59, 130, 246, 0.1)" />}
                    <RechartsLine type="monotone" dataKey="smaShort" stroke="#f59e0b" strokeWidth={2} dot={false} name={`SMA ${params.sma.shortPeriod}`} />
                    <RechartsLine type="monotone" dataKey="smaLong" stroke="#8b5cf6" strokeWidth={2} dot={false} name={`SMA ${params.sma.longPeriod}`} />
                    <RechartsLine type="monotone" dataKey="emaShort" stroke="#10b981" strokeWidth={2} dot={false} name={`EMA ${params.ema.shortPeriod}`} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Indicators Tab */}
        {activeTab === 'indicators' && analysisData && (
          <motion.div key="indicators" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RSI */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">RSI ({params.rsi.period})</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysisData.chartDataRSI}>
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <ReferenceLine y={params.rsi.overbought} stroke="#ef4444" strokeDasharray="5 5" />
                      <ReferenceLine y={params.rsi.oversold} stroke="#10b981" strokeDasharray="5 5" />
                      <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                      <RechartsLine type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* MACD */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">MACD ({params.macd.fastPeriod}/{params.macd.slowPeriod}/{params.macd.signalPeriod})</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysisData.chartDataMACD}>
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                      <Bar dataKey="hist">
                        {analysisData.chartDataMACD.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.hist >= 0 ? '#10b981' : '#ef4444'} />))}
                      </Bar>
                      <RechartsLine type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} name="MACD" />
                      <RechartsLine type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={2} dot={false} name="Signal" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Stochastic */}
              {indicators.stoch && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Stochastic ({params.stoch.kPeriod}/{params.stoch.dPeriod})</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analysisData.chartDataStoch}>
                        <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <ReferenceLine y={params.stoch.overbought} stroke="#ef4444" strokeDasharray="5 5" />
                        <ReferenceLine y={params.stoch.oversold} stroke="#10b981" strokeDasharray="5 5" />
                        <RechartsLine type="monotone" dataKey="k" stroke="#3b82f6" strokeWidth={2} dot={false} name="%K" />
                        <RechartsLine type="monotone" dataKey="d" stroke="#f59e0b" strokeWidth={2} dot={false} name="%D" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {/* ATR */}
              {indicators.atr && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">ATR ({params.atr.period})</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analysisData.chartDataATR}>
                        <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => `₹${v.toFixed(0)}`} />
                        <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(value) => [formatCurrency(value), 'ATR']} />
                        <Area type="monotone" dataKey="value" stroke="#84cc16" fill="rgba(132, 204, 22, 0.2)" strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Oscillators Tab */}
        {activeTab === 'oscillators' && analysisData && (
          <motion.div key="oscillators" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {(() => {
              const currentRSI = analysisData.chartData[analysisData.chartData.length - 1]?.rsi
              const currentStochK = analysisData.chartData[analysisData.chartData.length - 1]?.stochK
              const currentStochD = analysisData.chartData[analysisData.chartData.length - 1]?.stochD
              const currentMACD = analysisData.chartData[analysisData.chartData.length - 1]?.macd
              const currentSignal = analysisData.chartData[analysisData.chartData.length - 1]?.macdSignal
              const currentATR = analysisData.chartData[analysisData.chartData.length - 1]?.atr
              
              return (
            <div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">All Oscillators</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'RSI (14)', value: currentRSI?.toFixed(2), status: currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral', color: currentRSI > 70 ? 'negative' : currentRSI < 30 ? 'positive' : 'neutral' },
                  { name: 'Stochastic %K', value: currentStochK?.toFixed(2), status: currentStochK > 80 ? 'Overbought' : currentStochK < 20 ? 'Oversold' : 'Neutral', color: currentStochK > 80 ? 'negative' : currentStochK < 20 ? 'positive' : 'neutral' },
                  { name: 'MACD', value: (currentMACD - currentSignal)?.toFixed(2), status: currentMACD > currentSignal ? 'Bullish' : 'Bearish', color: currentMACD > currentSignal ? 'positive' : 'negative' },
                  { name: 'ATR (14)', value: `₹${currentATR?.toFixed(2)}`, status: 'Volatility', color: 'neutral' }
                ].map((osc, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-4 bg-surfaceLight rounded-xl">
                    <p className="text-sm text-textSecondary mb-1">{osc.name}</p>
                    <p className={`text-2xl font-bold ${
                      osc.color === 'positive' ? 'text-positive' : 
                      osc.color === 'negative' ? 'text-negative' : 
                      'text-text'
                    }`}>
                      {osc.value}
                    </p>
                    <p className={`text-xs mt-1 ${
                      osc.color === 'positive' ? 'text-positive' : 
                      osc.color === 'negative' ? 'text-negative' : 
                      'text-textSecondary'
                    }`}>
                      {osc.status}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
              )
            })()}
            
            {/* RSI and MACD Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
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
              
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">MACD Signal</h3>
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
        
        {/* Patterns Tab */}
        {activeTab === 'patterns' && analysisData && (
          <motion.div key="patterns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-primary" />
                Detected Candlestick Patterns
              </h3>
              {analysisData.patterns.length === 0 ? (
                <p className="text-textSecondary text-center py-8">No significant patterns detected in the current data</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysisData.patterns.map((pattern, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={`p-4 rounded-xl border ${
                      pattern.sentiment === 'bullish' ? 'bg-positive/10 border-positive/30' :
                      pattern.sentiment === 'bearish' ? 'bg-negative/10 border-negative/30' :
                      'bg-surfaceLight border-white/10'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{pattern.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          pattern.sentiment === 'bullish' ? 'bg-positive/20 text-positive' :
                          pattern.sentiment === 'bearish' ? 'bg-negative/20 text-negative' :
                          'bg-surface text-textSecondary'
                        }`}>
                          {pattern.sentiment.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-textSecondary">{pattern.date}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Divergences */}
            {analysisData.divergences.length > 0 && (
              <div className="glass rounded-2xl p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Detected Divergences
                </h3>
                <div className="space-y-3">
                  {analysisData.divergences.map((div, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-xl border ${
                      div.type.includes('Bullish') ? 'bg-positive/10 border-positive/30' :
                      'bg-negative/10 border-negative/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{div.type}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-positive/20 text-positive">STRONG</span>
                      </div>
                      <p className="text-sm text-textSecondary mt-1">Price and indicator are diverging - potential reversal signal</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Volume Tab */}
        {activeTab === 'volume' && analysisData && (
          <motion.div key="volume" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Volume Profile (MA {params.volume.maPeriod})</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analysisData.chartDataVolume}>
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v} />
                      <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(value) => [value >= 1e6 ? `${(value/1e6).toFixed(2)}M` : value >= 1e3 ? `${(value/1e3).toFixed(2)}K` : value, 'Volume']} />
                      <Bar dataKey="volume">
                        {analysisData.chartDataVolume.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.isGreen ? '#10b981' : '#ef4444'} />))}
                      </Bar>
                      <RechartsLine type="monotone" dataKey="ma" stroke="#f59e0b" strokeWidth={2} dot={false} name={`MA ${params.volume.maPeriod}`} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {indicators.obv && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">On Balance Volume (OBV)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analysisData.chartDataOBV}>
                        <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v} />
                        <Tooltip contentStyle={{ background: 'rgba(21, 26, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(value) => [value >= 1e6 ? `${(value/1e6).toFixed(2)}M` : value >= 1e3 ? `${(value/1e3).toFixed(2)}K` : value, 'OBV']} />
                        <Area type="monotone" dataKey="value" stroke="#14b8a6" fill="rgba(20, 184, 166, 0.2)" strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Disclaimer */}
      <div className="mt-6 p-4 glass rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-textSecondary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-textSecondary">
            <strong className="text-text">Disclaimer:</strong> Technical analysis and pattern detection are generated automatically. 
            These signals should not be considered financial advice. Always conduct your own research and consider consulting a 
            qualified financial advisor before making investment decisions. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default TechnicalAnalysis
