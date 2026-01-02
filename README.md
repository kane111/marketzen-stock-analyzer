# MarketZen - Stock Market Technical Analysis Platform

<p align="center">
  <strong>A professional-grade stock market technical analysis terminal built with React</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#project-structure">Project Structure</a>
</p>

---

## Overview

MarketZen is a sophisticated stock market technical analysis application that provides traders and investors with powerful tools for analyzing financial markets. Built with React and modern web technologies, it offers real-time technical indicators, signal analysis, and a professional terminal-style interface.

The platform focuses on technical analysis, providing comprehensive indicator calculations including Moving Averages (SMA, EMA), Momentum Oscillators (RSI, Stochastic), Trend Indicators (MACD, Bollinger Bands), and Volatility Measures (ATR, VWAP). The application fetches data from Yahoo Finance API to provide accurate and timely market data.

## Features

### Technical Analysis Tools

- **Moving Averages**
  - Simple Moving Average (SMA) - Configurable short and long periods
  - Exponential Moving Average (EMA) - Responsive to price changes
  - MA Alignment Analysis with Perfect Order detection
  
- **Momentum Indicators**
  - Relative Strength Index (RSI) with overbought/oversold levels
  - Stochastic Oscillator with %K and %D lines
  
- **Trend Indicators**
  - Moving Average Convergence Divergence (MACD)
  - Signal line crossovers and histogram analysis
  
- **Volatility Indicators**
  - Bollinger Bands (Upper, Middle, Lower bands)
  - Average True Range (ATR)
  - Volume Weighted Average Price (VWAP)

### Signal Analysis

- **Automated Signal Generation**
  - Buy/Sell/Neutral signals from multiple indicators
  - Signal strength assessment (Strong, Moderate, Weak)
  - Overall market sentiment calculation
  
- **MA Perfect Order Detection**
  - Identifies bullish and bearish perfect orders
  - Partial alignment detection for emerging trends
  - Visual indicators for MA relationships

### User Interface

- **Professional Terminal Design**
  - Dark-themed, terminal-inspired interface
  - Responsive layout for all screen sizes
  - Smooth animations and transitions
  
- **Interactive Charts**
  - Composed charts with multiple overlays
  - Customizable indicator toggles
  - Timeframe selector (1D, 5D, 1M, 3M, 6M, 1Y, 5Y)
  
- **Sector Peers Comparison**
  - Quick access to sector-related stocks
  - Watchlist integration
  - One-click stock switching

## Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks and concurrent features
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Production-ready animations
- **Recharts** - Composable charting library

### State Management
- **React Context API** - Lightweight state management
- **Custom Hooks** - Modular logic separation (useIndicators, useChartData, useFundamentals)

### Data & APIs
- **Yahoo Finance API** - Historical price data and market information
- **CORS Proxies** - Cross-origin request handling

### Development
- **ESLint** - Code linting and quality assurance
- **Playwright** - End-to-end testing
- **Git** - Version control

## Installation

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kane111/yfinance-stock-analyzer.git
   cd yfinance-stock-analyzer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Build for production**
   ```bash
   pnpm build
   ```

5. **Preview production build**
   ```bash
   pnpm preview
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://query1.finance.yahoo.com/v8/finance
```

## Usage

### Selecting a Stock

1. Use the search overlay to find stocks by symbol or company name
2. Click on a stock to load its data
3. Select your preferred timeframe from the dropdown

### Configuring Indicators

1. Click the "Configure" button in the header
2. Toggle indicators on/off
3. Adjust indicator parameters (periods, overbought/oversold levels)

### Reading the Charts

- **SMA/EMA Lines**: Trend direction indicators
- **Bollinger Bands**: Volatility and potential reversal points
- **MACD Histogram**: Momentum and trend strength
- **RSI**: Overbought (>70) / Oversold (<30) conditions
- **Stochastic**: Momentum within price range

### Understanding Signals

- **BUY Signal (Green)**: Indicates bullish momentum
- **SELL Signal (Red)**: Indicates bearish momentum
- **NEUTRAL Signal (Gray)**: No clear direction
- **Perfect Order**: Multiple MAs aligned in sequence

## Project Structure

```
marketzen/
├── src/
│   ├── components/
│   │   ├── charts/           # Chart-related components
│   │   │   ├── ChartContainer.jsx
│   │   │   ├── ChartWrapper.jsx
│   │   │   └── TimeframeSelector.jsx
│   │   ├── common/           # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── ErrorDisplay.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   ├── StockHeader.jsx
│   │   │   ├── Tab.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Toggle.jsx
│   │   │   └── Tooltip.jsx
│   │   ├── indicators/       # Indicator toggle components
│   │   └── TechnicalAnalysis.jsx
│   ├── context/              # React Context providers
│   │   ├── AlertsContext.jsx
│   │   ├── PortfolioContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── WatchlistContext.jsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useChartData.js
│   │   ├── useFundamentals.js
│   │   ├── useIndicators.js
│   │   └── useIndicatorParams.js
│   ├── utils/                # Utility functions
│   │   ├── cache.js
│   │   ├── formatters.js
│   │   └── indicators.ts
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # Application entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── .gitignore
```

## API Reference

### Yahoo Finance Endpoints

The application uses Yahoo Finance API for market data:

**Chart Data (Historical Prices)**
```
GET https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range={range}&interval={interval}
```

**Parameters:**
- `symbol`: Stock ticker (e.g., RELIANCE.NS, AAPL)
- `range`: Time range (1d, 5d, 1m, 3m, 6m, 1y, 5y)
- `interval`: Data interval (1d, 1wk, 1mo)

### Supported Indian Stock Symbols

- RELIANCE.NS - Reliance Industries
- TCS.NS - Tata Consultancy Services
- HDFCBANK.NS - HDFC Bank
- INFY.NS - Infosys
- And more...

### Global Stocks

- AAPL - Apple Inc.
- MSFT - Microsoft Corporation
- GOOGL - Alphabet Inc.
- AMZN - Amazon.com Inc.

## Customization

### Adding New Indicators

1. Create indicator calculation function in `src/utils/indicators.ts`
2. Add toggle button in `src/components/indicators/IndicatorToggle.jsx`
3. Integrate into `useIndicators` hook
4. Update chart rendering in `TechnicalAnalysis.jsx`

### Theming

The application uses Tailwind CSS with a custom terminal theme. Modify `tailwind.config.js` to customize colors:

```javascript
theme: {
  extend: {
    colors: {
      'terminal-green': '#10b981',
      'terminal-red': '#ef4444',
      'terminal-bg': '#151a21',
      // ... more colors
    }
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

**Not Financial Advice**: MarketZen is provided for educational and informational purposes only. The technical analysis, signals, and indicators presented should not be considered as financial advice or recommendations to buy or sell any securities.

**Trading Risks**: Trading in financial markets involves substantial risk of loss. Past performance does not guarantee future results. Always conduct your own research and consult with a qualified financial advisor before making investment decisions.

## Acknowledgments

- [Yahoo Finance](https://finance.yahoo.com/) for market data
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for charting
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide Icons](https://lucide.dev/) for icons

---

<p align="center">
  Made with ❤️ for traders and investors
</p>
