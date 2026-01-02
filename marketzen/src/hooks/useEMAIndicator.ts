/**
 * EMA Indicator Hook
 * 
 * Custom React hook for calculating and managing EMA indicators
 * for the Perfect Stack signal. Uses useMemo for performance
 * optimization to prevent recalculation on every render.
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import {
  OHLCVData,
  EnrichedChartData,
  calculateAllIndicators,
  detectSignals,
  isPerfectStack,
  EMA_PERIODS,
  VOLUME_PERIOD
} from '../utils/indicators';

// ============================================================================
// Types
// ============================================================================

/**
 * State for indicator visibility settings
 */
export interface IndicatorState {
  showEMAs: boolean;
  showSignals: boolean;
  showVolume: boolean;
}

/**
 * Default indicator settings
 */
export const DEFAULT_INDICATOR_STATE: IndicatorState = {
  showEMAs: true,
  showSignals: true,
  showVolume: true
};

/**
 * Hook return type
 */
export interface UseEMAIndicatorReturn {
  // Enriched data ready for charting
  enrichedData: EnrichedChartData[];
  
  // Current indicator values
  currentEMA10: number | null;
  currentEMA20: number | null;
  currentEMA44: number | null;
  currentVolSma20: number | null;
  
  // Signal status
  isCurrentPerfectStack: boolean;
  
  // State management
  indicatorState: IndicatorState;
  toggleEMAs: () => void;
  toggleSignals: () => void;
  toggleVolume: () => void;
  
  // Data loading state
  isCalculating: boolean;
  lastCalculated: number | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for EMA indicator calculations
 * 
 * This hook processes raw OHLCV data and enriches it with
 * calculated indicators (EMA10, EMA20, EMA44, Volume SMA)
 * and Perfect Stack signal detection.
 * 
 * @param data - Raw OHLCV data from the API
 * @param enabled - Whether to run calculations (default: true)
 * @returns Object containing enriched data and indicator state
 * 
 * @example
 * ```tsx
 * const { 
 *   enrichedData, 
 *   indicatorState, 
 *   toggleEMAs 
 * } = useEMAIndicator(rawStockData);
 * 
 * return (
 *   <ChartWrapper data={enrichedData} settings={indicatorState} />
 * );
 * ```
 */
export function useEMAIndicator(
  data: OHLCVData[],
  enabled: boolean = true
): UseEMAIndicatorReturn {
  // Indicator visibility state
  const [indicatorState, setIndicatorState] = useState<IndicatorState>(
    DEFAULT_INDICATOR_STATE
  );
  
  // Calculation timing for performance tracking
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculated, setLastCalculated] = useState<number | null>(null);
  
  // =========================================================================
  // Indicator Calculations (Memoized)
  // =========================================================================
  
  const {
    enrichedData,
    currentEMA10,
    currentEMA20,
    currentEMA44,
    currentVolSma20,
    isCurrentPerfectStack
  } = useMemo(() => {
    // Skip calculation if disabled or no data
    if (!enabled || data.length === 0) {
      return {
        enrichedData: [],
        currentEMA10: null,
        currentEMA20: null,
        currentEMA44: null,
        currentVolSma20: null,
        isCurrentPerfectStack: false
      };
    }
    
    setIsCalculating(true);
    
    const startTime = performance.now();
    
    // Step 1: Calculate all EMAs and Volume SMA
    const indicators = calculateAllIndicators(data);
    
    // Step 2: Detect signals across the dataset
    const signals = detectSignals(data, indicators);
    
    // Step 3: Build enriched data array
    const enriched: EnrichedChartData[] = data.map((point, index) => ({
      ...point,
      ema10: indicators.ema10[index],
      ema20: indicators.ema20[index],
      ema44: indicators.ema44[index],
      volSma20: indicators.volSma20[index],
      isPerfectStack: signals[index],
      signalFired: signals[index]
    }));
    
    // Step 4: Get current (latest) values
    const latestIndex = data.length - 1;
    const currentEMA10Val = indicators.ema10[latestIndex];
    const currentEMA20Val = indicators.ema20[latestIndex];
    const currentEMA44Val = indicators.ema44[latestIndex];
    const currentVolSma20Val = indicators.volSma20[latestIndex];
    
    // Step 5: Check if current candle meets Perfect Stack criteria
    const isStack = isPerfectStack(
      data[latestIndex].close,
      currentEMA10Val,
      currentEMA20Val,
      currentEMA44Val,
      data[latestIndex].volume,
      currentVolSma20Val
    );
    
    const endTime = performance.now();
    setLastCalculated(endTime);
    setIsCalculating(false);
    
    return {
      enrichedData: enriched,
      currentEMA10: currentEMA10Val,
      currentEMA20: currentEMA20Val,
      currentEMA44: currentEMA44Val,
      currentVolSma20: currentVolSma20Val,
      isCurrentPerfectStack: isStack
    };
  }, [data, enabled]);
  
  // =========================================================================
  // State Management Functions
  // =========================================================================
  
  const toggleEMAs = useCallback(() => {
    setIndicatorState(prev => ({
      ...prev,
      showEMAs: !prev.showEMAs
    }));
  }, []);
  
  const toggleSignals = useCallback(() => {
    setIndicatorState(prev => ({
      ...prev,
      showSignals: !prev.showSignals
    }));
  }, []);
  
  const toggleVolume = useCallback(() => {
    setIndicatorState(prev => ({
      ...prev,
      showVolume: !prev.showVolume
    }));
  }, []);
  
  const resetSettings = useCallback(() => {
    setIndicatorState(DEFAULT_INDICATOR_STATE);
  }, []);
  
  // =========================================================================
  // Persistence
  // =========================================================================
  
  // Load saved settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('marketzen_indicator_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the saved settings
        if (typeof parsed.showEMAs === 'boolean' &&
            typeof parsed.showSignals === 'boolean' &&
            typeof parsed.showVolume === 'boolean') {
          setIndicatorState(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load indicator settings:', error);
    }
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('marketzen_indicator_settings', JSON.stringify(indicatorState));
    } catch (error) {
      console.warn('Failed to save indicator settings:', error);
    }
  }, [indicatorState]);
  
  // =========================================================================
  // Return
  // =========================================================================
  
  return {
    enrichedData,
    currentEMA10,
    currentEMA20,
    currentEMA44,
    currentVolSma20,
    isCurrentPerfectStack,
    indicatorState,
    toggleEMAs,
    toggleSignals,
    toggleVolume,
    isCalculating,
    lastCalculated
  };
}

// ============================================================================
// Supplementary Hook: Use Signal History
// ============================================================================

/**
 * Hook to analyze signal history and statistics
 * 
 * Provides additional analysis of signal occurrences,
 * useful for backtesting and performance metrics.
 * 
 * @param enrichedData - Enriched chart data with signals
 * @returns Object containing signal statistics
 */
export function useSignalHistory(enrichedData: EnrichedChartData[]) {
  return useMemo(() => {
    if (enrichedData.length === 0) {
      return {
        totalSignals: 0,
        signalIndices: [],
        lastSignalIndex: null,
        consecutiveSignals: 0,
        maxConsecutiveSignals: 0
      };
    }
    
    const signalIndices: number[] = [];
    let consecutiveSignals = 0;
    let maxConsecutiveSignals = 0;
    
    enrichedData.forEach((point, index) => {
      if (point.isPerfectStack) {
        signalIndices.push(index);
        consecutiveSignals++;
        maxConsecutiveSignals = Math.max(maxConsecutiveSignals, consecutiveSignals);
      } else {
        consecutiveSignals = 0;
      }
    });
    
    const lastSignalIndex = signalIndices.length > 0 
      ? signalIndices[signalIndices.length - 1] 
      : null;
    
    return {
      totalSignals: signalIndices.length,
      signalIndices,
      lastSignalIndex,
      consecutiveSignals,
      maxConsecutiveSignals,
      signalFrequency: signalIndices.length / enrichedData.length
    };
  }, [enrichedData]);
}

// ============================================================================
// Supplementary Hook: Use Current Price vs MAs
// ============================================================================

/**
 * Hook to analyze current price position relative to MAs
 * 
 * Useful for quick visual status indicators showing
 * where the current price stands relative to each MA.
 * 
 * @param enrichedData - Enriched chart data
 * @returns Object containing price position analysis
 */
export function usePricePosition(enrichedData: EnrichedChartData[]) {
  return useMemo(() => {
    if (enrichedData.length === 0 || !enrichedData[enrichedData.length - 1]) {
      return {
        aboveEMA10: false,
        aboveEMA20: false,
        aboveEMA44: false,
        maStackOrder: 'NEUTRAL' as const,
        strengthScore: 0
      };
    }
    
    const latest = enrichedData[enrichedData.length - 1];
    const { close } = latest;
    const { ema10, ema20, ema44 } = latest;
    
    // Handle null values
    if (ema10 === null || ema20 === null || ema44 === null) {
      return {
        aboveEMA10: false,
        aboveEMA20: false,
        aboveEMA44: false,
        maStackOrder: 'NEUTRAL' as const,
        strengthScore: 0
      };
    }
    
    const aboveEMA10 = close > ema10;
    const aboveEMA20 = close > ema20;
    const aboveEMA44 = close > ema44;
    
    // Determine stack order
    let maStackOrder: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    if (aboveEMA10 && aboveEMA20 && aboveEMA44 && ema10 > ema20 && ema20 > ema44) {
      maStackOrder = 'BULLISH';
    } else if (!aboveEMA10 && !aboveEMA20 && !aboveEMA44 && ema10 < ema20 && ema20 < ema44) {
      maStackOrder = 'BEARISH';
    } else {
      maStackOrder = 'NEUTRAL';
    }
    
    // Calculate strength score (0-100)
    let strengthScore = 0;
    if (aboveEMA10) strengthScore += 25;
    if (aboveEMA20) strengthScore += 25;
    if (aboveEMA44) strengthScore += 25;
    if (ema10 > ema20) strengthScore += 12.5;
    if (ema20 > ema44) strengthScore += 12.5;
    
    return {
      aboveEMA10,
      aboveEMA20,
      aboveEMA44,
      maStackOrder,
      strengthScore
    };
  }, [enrichedData]);
}
