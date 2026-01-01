// Custom Hooks Index
export { 
  useChartData, 
  useStockData, 
  useOHLCData,
  default as chartHooks 
} from './useChartData'

export { 
  useIndicators, 
  useIndicatorParams,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
  calculateVWAP,
  default as indicatorHooks 
} from './useIndicators'
