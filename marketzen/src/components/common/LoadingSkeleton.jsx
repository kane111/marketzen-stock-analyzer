import { motion } from 'framer-motion'

// ==========================================
// LOADING SKELETON - Unified Loading Component
// Used across: App, FundamentalsPanel, NewsFeed, TechnicalAnalysis, StockComparison
// ==========================================

// Basic skeleton line
export function SkeletonLine({ className = '', width = '100%', height = '1rem' }) {
  return (
    <motion.div
      className={`bg-terminal-bg-light rounded ${className}`}
      style={{ width, height }}
      animate={{
        opacity: [0.4, 0.7, 0.4]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  )
}

// Basic skeleton circle
export function SkeletonCircle({ size = '2rem', className = '' }) {
  return (
    <motion.div
      className={`bg-terminal-bg-light rounded-full ${className}`}
      style={{ width: size, height: size }}
      animate={{
        opacity: [0.4, 0.7, 0.4]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  )
}

// Skeleton card with title and content
export function SkeletonCard({ title = true, lines = 3, showIcon = false }) {
  return (
    <div className="bg-terminal-bg border border-terminal-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        {showIcon && <SkeletonCircle size="2rem" />}
        {title && <SkeletonLine width="40%" height="1.25rem" />}
      </div>
      <div className="space-y-3">
        {[...Array(lines)].map((_, i) => (
          <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} height="0.875rem" />
        ))}
      </div>
    </div>
  )
}

// Spinner loader
export function Spinner({ size = '2rem', color = 'terminal-green' }) {
  const colorClass = color === 'terminal-green' 
    ? 'border-terminal-green border-t-transparent' 
    : 'border-terminal-dim border-t-transparent'
  
  return (
    <motion.div
      className={`w-${size} h-${size} rounded-full border-3 ${colorClass}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  )
}

// Full page loading state
export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <Spinner size="3rem" />
      <p className="text-terminal-dim mt-4 font-mono">{message}</p>
    </div>
  )
}

// Chart loading skeleton
export function LoadingChart({ height = '300px' }) {
  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4" style={{ height }}>
      <div className="flex items-center gap-4 mb-4">
        <SkeletonLine width="100px" height="1.5rem" />
        <div className="flex-1" />
        {[...Array(5)].map((_, i) => (
          <SkeletonCircle key={i} size="1.5rem" />
        ))}
      </div>
      <div className="flex-1 flex items-end gap-1">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-terminal-bg-light rounded-t"
            style={{ height: `${20 + Math.random() * 60}%` }}
            animate={{ height: `${20 + Math.random() * 60}%` }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: i * 0.05
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Table loading skeleton
export function LoadingTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg overflow-hidden">
      <div className="bg-terminal-bg border-b border-terminal-border p-3">
        <div className="flex gap-4">
          {[...Array(columns)].map((_, i) => (
            <SkeletonLine key={i} width={`${100 / columns}%`} height="1rem" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-terminal-border">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-3 flex gap-4">
            {[...Array(columns)].map((_, colIndex) => (
              <SkeletonLine 
                key={colIndex} 
                width={`${100 / columns}%`} 
                height="1.5rem"
                className={colIndex === 0 ? 'w-[30%]' : ''}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Metric card loading skeleton
export function LoadingMetrics({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-terminal-bg border border-terminal-border rounded-lg p-4">
          <SkeletonLine width="50%" height="0.75rem" className="mb-2" />
          <SkeletonLine width="80%" height="1.5rem" />
        </div>
      ))}
    </div>
  )
}

// News feed loading skeleton
export function LoadingNews({ items = 3 }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="bg-terminal-bg border border-terminal-border rounded-lg p-3">
          <SkeletonLine width="90%" height="1rem" className="mb-2" />
          <SkeletonLine width="60%" height="0.875rem" />
        </div>
      ))}
    </div>
  )
}

// Fundamentals loading skeleton
export function LoadingFundamentals() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-terminal-bg-secondary border border-terminal-border rounded p-2.5">
            <SkeletonLine width="60%" height="0.75rem" className="mb-1" />
            <SkeletonLine width="80%" height="1.25rem" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact inline loader
export function InlineLoader({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Spinner size="1.5rem" />
      <span className="text-sm text-terminal-dim font-mono">{message}</span>
    </div>
  )
}

// Dots loader
export function DotsLoader({ dots = 3 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[...Array(dots)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-terminal-green"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15
          }}
        />
      ))}
    </div>
  )
}

export default {
  SkeletonLine,
  SkeletonCircle,
  SkeletonCard,
  Spinner,
  LoadingPage,
  LoadingChart,
  LoadingTable,
  LoadingMetrics,
  LoadingNews,
  LoadingFundamentals,
  InlineLoader,
  DotsLoader
}
