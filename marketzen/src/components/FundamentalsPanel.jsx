import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, PieChart, BarChart3, RefreshCw, Info } from 'lucide-react'
import { TerminalTab } from './UI'
import { useFundamentals, getMetric, formatCurrency, formatNumber, formatPercent, formatRatio } from '../hooks/useFundamentals'
import { MetricCard } from './common/MetricCard'

// Sector mapping for Indian stocks
const SECTOR_MAPPING = {
  'RELIANCE.NS': 'Energy',
  'TCS.NS': 'Technology',
  'HDFCBANK.NS': 'Financials',
  'ICICIBANK.NS': 'Financials',
  'SBIN.NS': 'Financials',
  'INFY.NS': 'Technology',
  'HINDUNILVR.NS': 'Consumer Staples',
  'ASIANPAINT.NS': 'Consumer Discretionary',
  'NESTLEIND.NS': 'Consumer Staples',
  'MARUTI.NS': 'Consumer Discretionary',
  'TATAMOTORS.NS': 'Consumer Discretionary',
  'SUNPHARMA.NS': 'Healthcare',
  'AXISBANK.NS': 'Financials',
  'KOTAKBANK.NS': 'Financials',
  'WIPRO.NS': 'Technology',
  'BHARTIARTL.NS': 'Communication',
  'BAJFINANCE.NS': 'Financials',
  'TATASTEEL.NS': 'Materials',
  'JSWSTEEL.NS': 'Materials',
  'MOTHERSUMI.NS': 'Consumer Discretionary',
  'BAJAJ-AUTO.NS': 'Consumer Discretionary',
  'EICHERMOT.NS': 'Consumer Discretionary',
  'DABUR.NS': 'Consumer Staples',
  'BRITANNIA.NS': 'Consumer Staples',
  'COALINDIA.NS': 'Energy',
  'VEDL.NS': 'Materials',
  'ONGC.NS': 'Energy',
  'IOC.NS': 'Energy',
  'NTPC.NS': 'Utilities',
  'POWERGRID.NS': 'Utilities',
  'CIPLA.NS': 'Healthcare',
  'DRREDDY.NS': 'Healthcare',
  'ZYDUSLIFE.NS': 'Healthcare',
  'DLF.NS': 'Real Estate',
  'GODREJPROP.NS': 'Real Estate',
  'SOBHA.NS': 'Real Estate',
  'PRESTIGE.NS': 'Real Estate',
  'LODHA.NS': 'Real Estate',
  'APOLLOHOSP.NS': 'Healthcare',
  'FORTIS.NS': 'Healthcare',
  'MAXHEALTH.NS': 'Healthcare',
  'METROPOLIS.NS': 'Healthcare',
  'ZEE.NS': 'Communication',
  'PVR.NS': 'Communication',
  'INOXLEISUR.NS': 'Communication',
  'DISHTV.NS': 'Communication',
  'SUNTV.NS': 'Communication',
  'ITC.NS': 'Consumer Staples',
  'GODREJCP.NS': 'Consumer Staples',
  'HCLTECH.NS': 'Technology',
  'TECHM.NS': 'Technology'
}

function FundamentalsPanel({ stock, stockData, onClose, onAddToComparison }) {
  const [activeTab, setActiveTab] = useState('valuation')
  
  // Use the new fundamentals hook
  const { 
    data: fundamentals, 
    loading, 
    dataSource, 
    lastUpdated, 
    refresh: fetchFundamentals 
  } = useFundamentals(stock?.id)

  const getSector = () => {
    return SECTOR_MAPPING[stock?.id] || 'Other'
  }

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
            <div>
              <h2 className="text-xl font-semibold">Fundamentals</h2>
              <p className="text-terminal-dim text-sm">Loading...</p>
            </div>
          </div>
        </div>
        <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4 flex-1">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-terminal-bg-light rounded" />
            ))}
          </div>
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-xl font-semibold">{stock?.name}</h2>
            <div className="flex items-center gap-2 text-xs text-terminal-dim">
              <span>{stock?.symbol}</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-terminal-bg-light rounded-full">{getSector()}</span>
              <span>•</span>
              <span>NSE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchFundamentals}
            className="p-2 rounded-lg bg-terminal-bg-light hover:bg-terminal-bg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
          {onAddToComparison && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddToComparison}
              className="px-3 py-1.5 bg-terminal-green/10 text-terminal-green rounded-lg flex items-center gap-1.5 text-sm"
            >
              <PieChart className="w-4 h-4" />
              Compare
            </motion.button>
          )}
        </div>
      </div>

      {/* Data Source & Last Updated */}
      <div className="flex items-center justify-between text-xs text-terminal-dim mb-3">
        <span>Data Source: {dataSource}</span>
        {lastUpdated && <span>Last Updated: {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      {/* Current Price Card */}
      {stockData && (
        <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-terminal-dim">Current Price</p>
            <p className="text-xl font-bold">{formatCurrency(stockData.current_price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-terminal-dim">Day Change</p>
            <p className={`text-lg font-semibold ${
              (stockData.current_price - stockData.previous_close) >= 0 ? 'text-terminal-green' : 'text-terminal-red'
            }`}>
              {((stockData.current_price - stockData.previous_close) / stockData.previous_close * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <TerminalTab
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-3"
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
              className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4"
            >
              <h3 className="text-base font-semibold mb-3">Valuation Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4"
            >
              <h3 className="text-base font-semibold mb-3">Financial Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              className="bg-terminal-bg-secondary border border-terminal-border rounded-lg p-4"
            >
              <h3 className="text-base font-semibold mb-3">Price Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

      {/* Disclaimer */}
      <div className="mt-3 p-3 bg-terminal-bg-secondary border border-terminal-border rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-terminal-dim flex-shrink-0 mt-0.5" />
        <p className="text-xs text-terminal-dim">
          <strong className="text-terminal-text">Disclaimer:</strong> Fundamental data is provided for informational purposes only and should not be considered as financial advice. 
          Always conduct your own research and consider consulting a financial advisor before making investment decisions.
          {dataSource.includes('Demo') && ' Some data shown is demo data as the live API is currently unavailable.'}
        </p>
      </div>
    </motion.div>
  )
}

export default FundamentalsPanel
