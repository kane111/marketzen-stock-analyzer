import { useState, memo, useEffect } from 'react'
import { X, TrendingUp, PieChart, BarChart3 } from 'lucide-react'
import { TerminalTab } from './UI'
import { getMetric, formatCurrency, formatNumber, formatPercent, formatRatio } from '../hooks/useFundamentals'
import { MetricCard } from './common/MetricCard'

/**
 * FundamentalsPanel - Displays fundamental data for a stock
 * 
 * UX Improvements:
 * - Better header spacing and layout
 * - Improved tab spacing
 * - Better card padding in grids
 * - Clearer visual hierarchy
 * - Smooth transitions between tabs
 * - Uses cached data when available
 */
function FundamentalsPanel({ stock, stockData, onClose, cachedFundamentals = null, loading: externalLoading = false }) {
  const [activeTab, setActiveTab] = useState('valuation')
  
  // Use cached data if available, otherwise show loading
  const fundamentals = cachedFundamentals?.data
  const isLoading = externalLoading || !fundamentals

  const tabs = [
    { id: 'valuation', label: 'Valuation', icon: PieChart },
    { id: 'financials', label: 'Financials', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ]

  // Loading state with better visual feedback
  if (isLoading) {
    return (
      <div className="h-full flex flex-col p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-terminal-bg-light hover:bg-terminal-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold">{stock?.name}</h2>
        </div>
        
        {/* Loading skeleton */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-3 border-terminal-green border-t-transparent rounded-full"
            />
            <p className="text-xs text-terminal-dim">Loading fundamentals...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-3">
      {/* Header with better spacing */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded bg-terminal-bg-light hover:bg-terminal-border transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold">{stock?.name}</h2>
      </div>

      {/* Tabs with better spacing */}
      <div className="flex-shrink-0 mb-3">
        <TerminalTab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Main Content with better scroll behavior */}
      <div className="flex-1 overflow-y-auto">
        {/* Valuation Tab */}
        {activeTab === 'valuation' && (
          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-2.5">
            <div className="grid grid-cols-3 gap-2">
              <MetricCard
                label="P/E Ratio"
                value={formatRatio(getMetric(fundamentals, 'defaultKeyStatistics.trailingPE'))}
                tooltip="Price to Earnings Ratio - Lower may indicate undervaluation"
              />
              <MetricCard
                label="Forward P/E"
                value={formatRatio(getMetric(fundamentals, 'defaultKeyStatistics.forwardPE'))}
                tooltip="Forward P/E based on estimated earnings"
              />
              <MetricCard
                label="P/B Ratio"
                value={formatRatio(getMetric(fundamentals, 'defaultKeyStatistics.priceToBookRaw'))}
                tooltip="Price to Book Ratio"
              />
              <MetricCard
                label="P/S Ratio"
                value={formatRatio(getMetric(fundamentals, 'defaultKeyStatistics.priceToSalesTrailing12Months'))}
                tooltip="Price to Sales Ratio"
              />
              <MetricCard
                label="EPS (TTM)"
                value={formatCurrency(getMetric(fundamentals, 'defaultKeyStatistics.trailingEps'))}
                tooltip="Earnings Per Share - Trailing Twelve Months"
              />
              <MetricCard
                label="Dividend Yield"
                value={formatPercent(getMetric(fundamentals, 'summaryDetail.dividendYieldRaw'))}
                tooltip="Annual dividend as percentage of stock price"
              />
              <MetricCard
                label="Beta"
                value={formatRatio(getMetric(fundamentals, 'defaultKeyStatistics.beta'))}
                tooltip="Measure of volatility relative to market"
              />
              <MetricCard
                label="Market Cap"
                value={formatNumber(getMetric(fundamentals, 'summaryDetail.marketCap'))}
                tooltip="Total market value"
                isLarge
              />
              <MetricCard
                label="Enterprise Value"
                value={formatNumber(getMetric(fundamentals, 'defaultKeyStatistics.enterpriseValue'))}
                tooltip="Total company value including debt"
              />
            </div>
          </div>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && (
          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-2.5">
            <div className="grid grid-cols-3 gap-2">
              <MetricCard
                label="Revenue (TTM)"
                value={formatNumber(getMetric(fundamentals, 'financialData.totalData'))}
                tooltip="Total revenue over trailing twelve months"
              />
              <MetricCard
                label="Net Income (TTM)"
                value={formatNumber(getMetric(fundamentals, 'financialData.netIncomeToCommon'))}
                tooltip="Net profit available to common shareholders"
              />
              <MetricCard
                label="Gross Margin"
                value={formatPercent(getMetric(fundamentals, 'financialData.grossMargins'))}
                tooltip="Revenue minus cost of goods sold as percentage"
              />
              <MetricCard
                label="Operating Margin"
                value={formatPercent(getMetric(fundamentals, 'financialData.operatingMargins'))}
                tooltip="Operating income as percentage of revenue"
              />
              <MetricCard
                label="Profit Margin"
                value={formatPercent(getMetric(fundamentals, 'financialData.profitMargins'))}
                tooltip="Net profit as percentage of revenue"
              />
              <MetricCard
                label="ROE"
                value={formatPercent(getMetric(fundamentals, 'financialData.returnOnEquity'))}
                tooltip="Return on Equity - How efficiently equity is used"
              />
              <MetricCard
                label="ROA"
                value={formatPercent(getMetric(fundamentals, 'financialData.returnOnAssets'))}
                tooltip="Return on Assets"
              />
              <MetricCard
                label="Debt/Equity"
                value={formatRatio(getMetric(fundamentals, 'financialData.debtToEquity'))}
                tooltip="Total debt divided by shareholder equity"
              />
              <MetricCard
                label="Current Ratio"
                value={formatRatio(getMetric(fundamentals, 'financialData.currentRatio'))}
                tooltip="Current assets divided by current liabilities"
              />
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-2.5">
            <div className="grid grid-cols-3 gap-2">
              <MetricCard
                label="52W High"
                value={formatCurrency(getMetric(fundamentals, 'summaryDetail.fiftyTwoWeekHighRaw'))}
              />
              <MetricCard
                label="52W Low"
                value={formatCurrency(getMetric(fundamentals, 'summaryDetail.fiftyTwoWeekLowRaw'))}
              />
              <MetricCard
                label="50 Day MA"
                value={formatCurrency(getMetric(fundamentals, 'summaryDetail.fiftyDayAverage'))}
                tooltip="Average closing price over last 50 days"
              />
              <MetricCard
                label="200 Day MA"
                value={formatCurrency(getMetric(fundamentals, 'summaryDetail.twoHundredDayAverage'))}
                tooltip="Average closing price over last 200 days"
              />
              <MetricCard
                label="52W Change"
                value={formatPercent(getMetric(fundamentals, 'defaultKeyStatistics.fiftyTwoWeekChange'))}
                variant={getMetric(fundamentals, 'defaultKeyStatistics.fiftyTwoWeekChange') >= 0 ? 'positive' : 'negative'}
              />
              <MetricCard
                label="Volume (Avg)"
                value={formatNumber(getMetric(fundamentals, 'summaryDetail.averageVolume'))}
              />
              <MetricCard
                label="Shares Out"
                value={formatNumber(getMetric(fundamentals, 'summaryDetail.sharesOutstanding'))}
                tooltip="Total number of shares"
              />
              <MetricCard
                label="Float Shares"
                value={formatNumber(getMetric(fundamentals, 'defaultKeyStatistics.floatShares'))}
                tooltip="Shares available for trading"
              />
              <MetricCard
                label="Insider Own"
                value={formatPercent(getMetric(fundamentals, 'defaultKeyStatistics.insiderHoldings'))}
                tooltip="Percentage owned by insiders"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Add missing import for motion
import { motion } from 'framer-motion'

// Custom comparison to prevent unnecessary re-renders
export default memo(FundamentalsPanel, (prevProps, nextProps) => {
  return (
    prevProps.stock?.id === nextProps.stock?.id &&
    prevProps.onClose === nextProps.onClose
  )
})
