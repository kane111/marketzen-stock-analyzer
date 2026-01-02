/**
 * Technical Indicator Utility Functions
 * 
 * Provides pure functions for calculating moving averages and
 * detecting trading signals for the Perfect Stack indicator.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a single OHLCV data point from the API
 */
export interface OHLCVData {
  timestamp: number | Date;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  date?: string;
  time?: string;
}

/**
 * Enriched chart data point with calculated indicators
 */
export interface EnrichedChartData extends OHLCVData {
  ema10: number | null;
  ema20: number | null;
  ema44: number | null;
  volSma20: number | null;
  isPerfectStack: boolean;
  signalFired: boolean;
}

/**
 * EMA period configuration
 */
export const EMA_PERIODS = {
  FAST: 10,
  MEDIUM: 20,
  SLOW: 44
} as const;

/**
 * Volume SMA period for confirmation
 */
export const VOLUME_PERIOD = 20;

// ============================================================================
// Moving Average Calculations
// ============================================================================

/**
 * Calculate Simple Moving Average (SMA)
 * 
 * The arithmetic mean of the last N closing prices.
 * Used primarily for volume confirmation.
 * 
 * @param prices - Array of price values
 * @param period - Number of periods to calculate
 * @returns Array of SMA values (null for insufficient data)
 */
export function calculateSMA(prices: number[], period: number): (number | null)[] {
  if (prices.length < period || period <= 0) {
    return prices.map(() => null);
  }

  const result: (number | null)[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      // Calculate sum of last 'period' prices
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[i - j];
      }
      result.push(sum / period);
    }
  }
  
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * 
 * Gives more weight to recent prices, making it more responsive
 * to current market conditions. This is the preferred moving
 * average type for momentum-based trading signals.
 * 
 * Formula: EMA_today = (Close_today - EMA_yesterday) × Multiplier + EMA_yesterday
 * Multiplier = 2 / (Period + 1)
 * 
 * @param prices - Array of closing prices
 * @param period - EMA period (10, 20, 44, etc.)
 * @returns Array of EMA values (null for insufficient data)
 */
export function calculateEMA(prices: number[], period: number): (number | null)[] {
  if (prices.length < period || period <= 0) {
    return prices.map(() => null);
  }

  const multiplier = 2 / (period + 1);
  const result: (number | null)[] = [];
  
  // Initialize with SMA of first 'period' prices
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += prices[i];
  }
  let previousEMA = initialSum / period;
  
  // First 'period - 1' values are null
  for (let i = 0; i < period - 1; i++) {
    result.push(null);
  }
  
  // Calculate EMA for each subsequent data point
  result.push(previousEMA);
  
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] - previousEMA) * multiplier + previousEMA;
    result.push(currentEMA);
    previousEMA = currentEMA;
  }
  
  return result;
}

/**
 * Calculate all EMAs and Volume SMA for chart enrichment
 * 
 * This is a convenience function that calculates all required
 * indicators in a single pass for efficiency.
 * 
 * @param data - Array of OHLCV data points
 * @returns Object containing arrays for each indicator
 */
export function calculateAllIndicators(data: OHLCVData[]) {
  // Extract closing prices and volumes
  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  
  // Calculate all EMAs
  const ema10 = calculateEMA(closes, EMA_PERIODS.FAST);
  const ema20 = calculateEMA(closes, EMA_PERIODS.MEDIUM);
  const ema44 = calculateEMA(closes, EMA_PERIODS.SLOW);
  
  // Calculate Volume SMA for confirmation
  const volSma20 = calculateSMA(volumes, VOLUME_PERIOD);
  
  return {
    ema10,
    ema20,
    ema44,
    volSma20
  };
}

// ============================================================================
// Signal Detection Logic
// ============================================================================

/**
 * Check if the Perfect Stack condition is met
 * 
 * The Perfect Stack signal fires when:
 * 1. Price is above EMA10 (immediate momentum)
 * 2. EMA10 is above EMA20 (short-term strength)
 * 3. EMA20 is above EMA44 (medium-term trend)
 * 4. Volume is above its 20-period SMA (confirmation)
 * 
 * @param close - Current closing price
 * @param ema10 - 10-period EMA value
 * @param ema20 - 20-period EMA value
 * @param ema44 - 44-period EMA value
 * @param volume - Current volume
 * @param volSma20 - 20-period Volume SMA
 * @returns Boolean indicating if Perfect Stack condition is met
 */
export function isPerfectStack(
  close: number,
  ema10: number | null,
  ema20: number | null,
  ema44: number | null,
  volume: number,
  volSma20: number | null
): boolean {
  // All EMAs must be calculated (not null)
  if (ema10 === null || ema20 === null || ema44 === null || volSma20 === null) {
    return false;
  }
  
  // Condition 1: Price above fastest EMA
  const priceAboveEma10 = close > ema10;
  
  // Condition 2: Fast EMA above medium EMA
  const ema10AboveEma20 = ema10 > ema20;
  
  // Condition 3: Medium EMA above slow EMA
  const ema20AboveEma44 = ema20 > ema44;
  
  // Condition 4: Volume confirmation
  const volumeConfirmed = volume > volSma20;
  
  // All conditions must be true
  return priceAboveEma10 && ema10AboveEma20 && ema20AboveEma44 && volumeConfirmed;
}

/**
 * Detect signal firing points across the entire dataset
 * 
 * Analyzes each data point and marks where Perfect Stack
 * conditions are met. A signal "fires" when the condition
 * becomes true.
 * 
 * @param data - Array of OHLCV data
 * @param indicators - Object containing calculated indicators
 * @returns Array of boolean values indicating signal firing
 */
export function detectSignals(
  data: OHLCVData[],
  indicators: {
    ema10: (number | null)[];
    ema20: (number | null)[];
    ema44: (number | null)[];
    volSma20: (number | null)[];
  }
): boolean[] {
  return data.map((point, index) => {
    return isPerfectStack(
      point.close,
      indicators.ema10[index],
      indicators.ema20[index],
      indicators.ema44[index],
      point.volume,
      indicators.volSma20[index]
    );
  });
}

// ============================================================================
// Data Enrichment
// ============================================================================

/**
 * Enrich raw chart data with all calculated indicators
 * 
 * This is the main function that transforms raw OHLCV data
 * into enriched data ready for charting. It calculates all
 * EMAs, Volume SMA, and detects Perfect Stack signals.
 * 
 * @param data - Raw OHLCV data from API
 * @returns Enriched data with indicator values
 */
export function enrichChartData(data: OHLCVData[]): EnrichedChartData[] {
  if (data.length === 0) {
    return [];
  }
  
  // Calculate all indicators
  const indicators = calculateAllIndicators(data);
  
  // Detect signals
  const signals = detectSignals(data, indicators);
  
  // Combine into enriched data
  return data.map((point, index) => ({
    ...point,
    ema10: indicators.ema10[index],
    ema20: indicators.ema20[index],
    ema44: indicators.ema44[index],
    volSma20: indicators.volSma20[index],
    isPerfectStack: signals[index],
    signalFired: signals[index]
  }));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the latest EMA value (non-null)
 * 
 * Used for displaying current indicator values in the UI.
 * 
 * @param emaArray - Array of EMA values
 * @returns The most recent non-null EMA value, or 0 if none
 */
export function getLatestEMA(emaArray: (number | null)[]): number {
  for (let i = emaArray.length - 1; i >= 0; i--) {
    if (emaArray[i] !== null) {
      return emaArray[i];
    }
  }
  return 0;
}

/**
 * Format EMA value for display
 * 
 * @param value - EMA value
 * @param decimals - Number of decimal places
 * @returns Formatted string for display
 */
export function formatEMAValue(value: number | null, decimals: number = 2): string {
  if (value === null) return '--';
  return value.toFixed(decimals);
}

/**
 * Get EMA color based on period
 * 
 * @param period - EMA period (10, 20, 44)
 * @returns Tailwind color class for the line
 */
export function getEMAColor(period: number): string {
  switch (period) {
    case 10:
      return '#22d3ee'; // Cyan-400
    case 20:
      return '#fbbf24'; // Amber-400
    case 44:
      return '#a855f7'; // Purple-500
    default:
      return '#6b7280'; // Gray-500
  }
}

/**
 * Get EMA label based on period
 * 
 * @param period - EMA period (10, 20, 44)
 * @returns Human-readable label
 */
export function getEMALabel(period: number): string {
  switch (period) {
    case 10:
      return 'EMA 10';
    case 20:
      return 'EMA 20';
    case 44:
      return 'EMA 44';
    default:
      return `EMA ${period}`;
  }
}
