import { useState, useCallback, useMemo } from 'react'

// ==========================================
// USE INDICATORS - Technical Indicators Hook
// ==========================================
export function useIndicators(initialIndicators = {}) {
  const [indicators, setIndicators] = useState({
    smaShort: true,
    smaLong: true,
    emaShort: true,
    emaLong: false,
    bollinger: false,
    vwap: false,
    atr: false,
    stoch: false,
    rsi: true,
    macd: true,
    ...initialIndicators
  })

  // Toggle single indicator
  const toggleIndicator = useCallback((indicatorId) => {
    setIndicators(prev => ({
      ...prev,
      [indicatorId]: !prev[indicatorId]
    }))
  }, [])

  // Set specific indicator value
  const setIndicator = useCallback((indicatorId, value) => {
    setIndicators(prev => ({
      ...prev,
      [indicatorId]: value
    }))
  }, [])

  // Reset all indicators
  const resetIndicators = useCallback((defaultState = {}) => {
    setIndicators({
      smaShort: true,
      smaLong: true,
      emaShort: true,
      emaLong: false,
      bollinger: false,
      vwap: false,
      atr: false,
      stoch: false,
      rsi: true,
      macd: true,
      ...defaultState
    })
  }, [])

  // Get list of active indicators
  const activeIndicators = useMemo(() => {
    return Object.entries(indicators)
      .filter(([_, value]) => value)
      .map(([key]) => key)
  }, [indicators])

  // Check if any indicators are active
  const hasActiveIndicators = activeIndicators.length > 0

  return {
    indicators,
    activeIndicators,
    hasActiveIndicators,
    toggleIndicator,
    setIndicator,
    resetIndicators
  }
}

// ==========================================
// USE INDICATOR PARAMS - Indicator Parameters Hook
// ==========================================
export function useIndicatorParams(initialParams = {}) {
  const [params, setParams] = useState({
    rsi: { period: 14, overbought: 70, oversold: 30, ...initialParams.rsi },
    macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, ...initialParams.macd },
    sma: { shortPeriod: 20, longPeriod: 50, ...initialParams.sma },
    ema: { shortPeriod: 12, longPeriod: 26, ...initialParams.ema },
    bollinger: { period: 20, stdDev: 2, ...initialParams.bollinger },
    volume: { maPeriod: 20, ...initialParams.volume },
    stoch: { kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20, ...initialParams.stoch },
    atr: { period: 14, ...initialParams.atr },
    ...initialParams
  })

  const updateParam = useCallback((indicator, key, value) => {
    setParams(prev => ({
      ...prev,
      [indicator]: {
        ...prev[indicator],
        [key]: value
      }
    }))
  }, [])

  const resetParams = useCallback((defaultParams = {}) => {
    setParams({
      rsi: { period: 14, overbought: 70, oversold: 30 },
      macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      sma: { shortPeriod: 20, longPeriod: 50 },
      ema: { shortPeriod: 12, longPeriod: 26 },
      bollinger: { period: 20, stdDev: 2 },
      volume: { maPeriod: 20 },
      stoch: { kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
      atr: { period: 14 },
      ...defaultParams
    })
  }, [])

  return {
    params,
    updateParam,
    resetParams
  }
}

// ==========================================
// Indicator Calculation Utilities
// ==========================================

// Simple Moving Average
export function calculateSMA(data, period) {
  if (!data || data.length < period) return []
  
  const result = []
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / period)
  }
  
  return result
}

// Exponential Moving Average
export function calculateEMA(data, period) {
  if (!data || data.length < period) return []
  
  const result = []
  const multiplier = 2 / (period + 1)
  
  // First EMA is SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]
  }
  result.push(sum / period)
  
  // Rest are EMA
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - result[result.length - 1]) * multiplier + result[result.length - 1]
    result.push(ema)
  }
  
  return result
}

// RSI Calculation
export function calculateRSI(data, period = 14) {
  if (!data || data.length < period + 1) return []
  
  const result = []
  const gains = []
  const losses = []
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? -change : 0)
  }
  
  // First average
  const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  
  if (avgLoss === 0) {
    result.push(100)
  } else {
    const rs = avgGain / avgLoss
    result.push(100 - (100 / (1 + rs)))
  }
  
  // Rest use smoothed averages
  for (let i = period; i < gains.length; i++) {
    const avgG = (avgGain * (period - 1) + gains[i]) / period
    const avgL = (avgLoss * (period - 1) + losses[i]) / period
    
    if (avgL === 0) {
      result.push(100)
    } else {
      const rs = avgG / avgL
      result.push(100 - (100 / (1 + rs)))
    }
  }
  
  return result
}

// MACD Calculation
export function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!data || data.length < slowPeriod + signalPeriod) {
    return { macdLine: [], signalLine: [], histogram: [] }
  }
  
  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)
  
  // MACD Line = Fast EMA - Slow EMA
  const macdLine = []
  const startIndex = slowPeriod - fastPeriod
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + startIndex] - slowEMA[i])
  }
  
  // Signal Line = EMA of MACD Line
  const signalLine = calculateEMA(macdLine, signalPeriod)
  
  // Histogram = MACD Line - Signal Line
  const histogram = []
  const histStart = signalPeriod - 1
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + histStart] - signalLine[i])
  }
  
  return { macdLine, signalLine, histogram }
}

// Bollinger Bands Calculation
export function calculateBollingerBands(data, period = 20, stdDev = 2) {
  if (!data || data.length < period) {
    return { sma: [], upperBand: [], lowerBand: [] }
  }
  
  const sma = calculateSMA(data, period)
  const upperBand = []
  const lowerBand = []
  
  for (let i = 0; i < sma.length; i++) {
    const slice = data.slice(i, i + period)
    const mean = sma[i]
    const squaredDiffs = slice.map(val => Math.pow(val - mean, 2))
    const std = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period)
    
    upperBand.push(mean + (std * stdDev))
    lowerBand.push(mean - (std * stdDev))
  }
  
  return { sma, upperBand, lowerBand }
}

// ATR (Average True Range) Calculation
export function calculateATR(highs, lows, closes, period = 14) {
  if (!highs || !lows || !closes || highs.length < period + 1) {
    return []
  }
  
  const trueRanges = []
  
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    )
    trueRanges.push(tr)
  }
  
  // Calculate ATR using Wilder's smoothing method for better accuracy
  const atr = []
  
  // First ATR is simple average of first 'period' true ranges
  let sumTR = 0
  for (let i = 0; i < period; i++) {
    sumTR += trueRanges[i]
  }
  atr.push(sumTR / period)
  
  // Subsequent ATRs use smoothing formula
  for (let i = period; i < trueRanges.length; i++) {
    const prevATR = atr[atr.length - 1]
    const currentATR = (prevATR * (period - 1) + trueRanges[i]) / period
    atr.push(currentATR)
  }
  
  return atr
}

// Stochastic Oscillator Calculation
export function calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
  if (!highs || !lows || !closes || highs.length < kPeriod) {
    return { k: [], d: [] }
  }
  
  const k = []
  
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highSlice = highs.slice(i - kPeriod + 1, i + 1)
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1)
    
    const highest = Math.max(...highSlice)
    const lowest = Math.min(...lowSlice)
    
    if (highest === lowest) {
      k.push(50)
    } else {
      k.push(((closes[i] - lowest) / (highest - lowest)) * 100)
    }
  }
  
  // %D is SMA of %K
  const d = calculateSMA(k, dPeriod)
  
  return { k, d }
}

// VWAP Calculation
export function calculateVWAP(ohlc) {
  if (!ohlc || ohlc.length === 0) return []
  
  let cumulativeTPV = 0
  let cumulativeVol = 0
  const vwap = []
  
  for (let i = 0; i < ohlc.length; i++) {
    const { high, low, close, volume } = ohlc[i]
    const typicalPrice = (high + low + close) / 3
    cumulativeTPV += typicalPrice * volume
    cumulativeVol += volume
    vwap.push(cumulativeTPV / cumulativeVol)
  }
  
  return vwap
}

export default useIndicators
