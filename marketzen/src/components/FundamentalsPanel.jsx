import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, PieChart, BarChart3 } from 'lucide-react'
import { TerminalTab } from './UI'
import { useFundamentals, getMetric, formatCurrency, formatNumber, formatPercent, formatRatio } from '../hooks/useFundamentals'
import { MetricCard } from './common/MetricCard'

function FundamentalsPanel({ stock, onClose }) {
  const [activeTab, setActiveTab] = useState('valuation')
  
  // Use the new fundamentals hook
  const { 
    data: fundamentals, 
    loading, 
    refresh: fetchFundamentals 
  } = useFundamentals(stock?.id)

  const tabs = [
    { id: 'valuation', label: 'Valuation', icon: PieChart },
    { id: 'financials', label: 'Financials', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ]

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="h-full flex flex-col"
      >
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-1.5 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
          <h2 className="text-lg font-semibold">Fundamentals</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-terminal-dim text-sm">Loading...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-1.5 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
          <h2 className="text-lg font-semibold">{stock?.name}</h2>
        </div>
      </div>

      {/* Tabs */}
      <TerminalTab
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-2"
      />

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'valuation' && (
            <motion.div
              key="valuation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-2"
            >
              <div className="grid grid-cols-3 gap-1">
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
            </motion.div>
          )}

          {activeTab === 'financials' && (
            <motion.div
              key="financials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-2"
            >
              <div className="grid grid-cols-3 gap-1">
                <MetricCard
                  label="Revenue (TTM)"
                  value={formatNumber(getMetric(fundamentals, 'financialData.totalRevenue'))}
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
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-2"
            >
              <div className="grid grid-cols-3 gap-1">
                <MetricCard
                  label="52 Week High"
                  value={formatCurrency(getMetric(fundamentals, 'summaryDetail.fiftyTwoWeekHighRaw'))}
                />
                <MetricCard
                  label="52 Week Low"
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
                  label="52 Week Change"
                  value={formatPercent(getMetric(fundamentals, 'defaultKeyStatistics.fiftyTwoWeekChange'))}
                  variant={getMetric(fundamentals, 'defaultKeyStatistics.fiftyTwoWeekChange') >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  label="Volume (Avg)"
                  value={formatNumber(getMetric(fundamentals, 'summaryDetail.averageVolume'))}
                />
                <MetricCard
                  label="Shares Outstanding"
                  value={formatNumber(getMetric(fundamentals, 'summaryDetail.sharesOutstanding'))}
                  tooltip="Total number of shares held by all shareholders"
                />
                <MetricCard
                  label="Float Shares"
                  value={formatNumber(getMetric(fundamentals, 'defaultKeyStatistics.floatShares'))}
                  tooltip="Shares available for public trading"
                />
                <MetricCard
                  label="Insider Ownership"
                  value={formatPercent(getMetric(fundamentals, 'defaultKeyStatistics.insiderHoldings'))}
                  tooltip="Percentage owned by company insiders"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default FundamentalsPanel
