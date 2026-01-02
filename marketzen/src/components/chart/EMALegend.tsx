/**
 * EMA Legend Component
 * 
 * Displays a legend showing the current EMA values with
 * color-coded indicators. Can be used in compact or
 * expanded mode.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface EMALegendProps {
  /** Current EMA values */
  emaValues: {
    ema10: number | null;
    ema20: number | null;
    ema44: number | null;
  };
  
  /** Current closing price */
  currentPrice?: number | null;
  
  /** Whether to show compact version */
  compact?: boolean;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Whether to show trend indicators */
  showTrends?: boolean;
  
  /** Previous EMA values for trend comparison */
  prevEmaValues?: {
    ema10: number | null;
    ema20: number | null;
    ema44: number | null;
  };
}

// ============================================================================
// Color Constants
// ============================================================================

const COLORS = {
  ema10: '#22d3ee',  // Cyan-400
  ema20: '#fbbf24',  // Amber-400
  ema44: '#a855f7',  // Purple-500
  up: '#22c55e',     // Green-500
  down: '#ef4444',   // Red-500
  neutral: '#64748b' // Slate-500
};

const STYLES = {
  ema10: {
    color: COLORS.ema10,
    label: 'EMA 10',
    description: 'Fast'
  },
  ema20: {
    color: COLORS.ema20,
    label: 'EMA 20',
    description: 'Medium'
  },
  ema44: {
    color: COLORS.ema44,
    label: 'EMA 44',
    description: 'Slow'
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine if EMA is trending up, down, or neutral
 */
function getTrend(current: number | null, previous: number | null): 'up' | 'down' | 'neutral' {
  if (current === null || previous === null) return 'neutral';
  if (Math.abs(current - previous) < 0.001) return 'neutral';
  return current > previous ? 'up' : 'down';
}

/**
 * Format price value for display
 */
function formatValue(value: number | null, decimals: number = 2): string {
  if (value === null) return '--';
  return value.toFixed(decimals);
}

/**
 * Calculate percentage difference from current price
 */
function getPriceDiffPercent(price: number | null, ema: number | null): string {
  if (price === null || ema === null || ema === 0) return '--';
  const diff = ((price - ema) / ema) * 100;
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Single EMA Legend Item
 */
interface LegendItemProps {
  label: string;
  color: string;
  value: number | null;
  trend?: 'up' | 'down' | 'neutral';
  currentPrice?: number | null;
  compact?: boolean;
}

const LegendItem: React.FC<LegendItemProps> = ({
  label,
  color,
  value,
  trend = 'neutral',
  currentPrice,
  compact = false
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? COLORS.up : trend === 'down' ? COLORS.down : COLORS.neutral;
  
  return (
    <div className={`
      flex items-center gap-2
      ${compact ? 'py-0.5' : 'py-1.5'}
    `}>
      {/* Color Indicator */}
      <div 
        className="flex-shrink-0 w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      
      {/* Label */}
      <span className={`
        text-terminal-dim
        ${compact ? 'text-[10px]' : 'text-xs'}
      `}>
        {label}
      </span>
      
      {/* Value */}
      <span className={`
        font-mono font-medium
        ${compact ? 'text-xs' : 'text-sm'}
      `}>
        {formatValue(value)}
      </span>
      
      {/* Trend Indicator */}
      {!compact && trend !== 'neutral' && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ color: trendColor }}
          className="flex items-center"
        >
          <TrendIcon className="w-3 h-3" />
        </motion.span>
      )}
      
      {/* Price Difference (non-compact only) */}
      {!compact && currentPrice !== undefined && (
        <span className={`
          text-xs font-mono ml-1
          ${value !== null && currentPrice > value ? 'text-terminal-green' : 'text-negative'}
        `}>
          {getPriceDiffPercent(currentPrice, value)}
        </span>
      )}
    </div>
  );
};

/**
 * Signal Status Badge
 */
interface SignalStatusProps {
  isPerfectStack: boolean;
  strengthScore?: number;
}

const SignalStatus: React.FC<SignalStatusProps> = ({ isPerfectStack, strengthScore }) => {
  if (!isPerfectStack) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-terminal-bg rounded border border-terminal-border/50">
        <Minus className="w-3 h-3 text-terminal-dim" />
        <span className="text-[10px] text-terminal-dim">NO SIGNAL</span>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-2 py-1 bg-terminal-green/10 rounded border border-terminal-green/30"
    >
      <TrendingUp className="w-3 h-3 text-terminal-green" />
      <span className="text-[10px] font-medium text-terminal-green">PERFECT STACK</span>
      {strengthScore !== undefined && (
        <span className="text-[10px] text-terminal-green/70">
          {Math.round(strengthScore)}%
        </span>
      )}
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * EMA Legend Component
 * 
 * Displays a color-coded legend showing current EMA values.
 * Supports compact and expanded modes, with optional trend
 * indicators and signal status.
 * 
 * @example
 * ```tsx
 * <EMALegend
 *   emaValues={{ ema10, ema20, ema44 }}
 *   currentPrice={currentPrice}
 * />
 * ```
 */
export const EMALegend: React.FC<EMALegendProps> = ({
  emaValues,
  currentPrice = null,
  compact = false,
  className = '',
  showTrends = false,
  prevEmaValues
}) => {
  // Calculate trends if previous values provided
  const trends = showTrends && prevEmaValues ? {
    ema10: getTrend(emaValues.ema10, prevEmaValues.ema10),
    ema20: getTrend(emaValues.ema20, prevEmaValues.ema20),
    ema44: getTrend(emaValues.ema44, prevEmaValues.ema44)
  } : {
    ema10: 'neutral' as const,
    ema20: 'neutral' as const,
    ema44: 'neutral' as const
  };
  
  // Check if Perfect Stack condition is met
  const isPerfectStack = 
    emaValues.ema10 !== null &&
    emaValues.ema20 !== null &&
    emaValues.ema44 !== null &&
    currentPrice !== null &&
    currentPrice > emaValues.ema10 &&
    emaValues.ema10 > emaValues.ema20 &&
    emaValues.ema20 > emaValues.ema44;
  
  // Calculate strength score (0-100)
  const strengthScore = isPerfectStack ? 100 : 
    (emaValues.ema10 !== null && currentPrice !== null && currentPrice > emaValues.ema10 ? 25 : 0) +
    (emaValues.ema10 !== null && emaValues.ema20 !== null && emaValues.ema10 > emaValues.ema20 ? 25 : 0) +
    (emaValues.ema20 !== null && emaValues.ema44 !== null && emaValues.ema20 > emaValues.ema44 ? 25 : 0) +
    (emaValues.ema44 !== null && currentPrice !== null ? 25 : 0);
  
  return (
    <div className={className}>
      {compact ? (
        // Compact Version - Horizontal Layout
        <div className="flex items-center gap-3">
          <SignalStatus isPerfectStack={isPerfectStack} />
          
          <div className="flex items-center gap-2">
            <LegendItem
              label="10"
              color={STYLES.ema10.color}
              value={emaValues.ema10}
              trend={trends.ema10}
              compact={true}
            />
            <LegendItem
              label="20"
              color={STYLES.ema20.color}
              value={emaValues.ema20}
              trend={trends.ema20}
              compact={true}
            />
            <LegendItem
              label="44"
              color={STYLES.ema44.color}
              value={emaValues.ema44}
              trend={trends.ema44}
              compact={true}
            />
          </div>
        </div>
      ) : (
        // Expanded Version - Vertical Layout with more details
        <div className="flex flex-col gap-2">
          {/* Header with Signal Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-terminal-dim uppercase tracking-wider">
              Moving Averages
            </span>
            <SignalStatus isPerfectStack={isPerfectStack} />
          </div>
          
          {/* EMA Items */}
          <div className="flex flex-col gap-1">
            <LegendItem
              label={STYLES.ema10.label}
              color={STYLES.ema10.color}
              value={emaValues.ema10}
              trend={trends.ema10}
              currentPrice={currentPrice}
            />
            <LegendItem
              label={STYLES.ema20.label}
              color={STYLES.ema20.color}
              value={emaValues.ema20}
              trend={trends.ema20}
              currentPrice={currentPrice}
            />
            <LegendItem
              label={STYLES.ema44.label}
              color={STYLES.ema44.color}
              value={emaValues.ema44}
              trend={trends.ema44}
              currentPrice={currentPrice}
            />
          </div>
          
          {/* Strength Meter */}
          {isPerfectStack && (
            <div className="mt-1 pt-2 border-t border-terminal-border/50">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-terminal-dim">Stack Strength</span>
                <span className="text-terminal-green font-mono">{Math.round(strengthScore)}%</span>
              </div>
              <div className="h-1.5 bg-terminal-bg rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${strengthScore}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-terminal-green/70 to-terminal-green"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Floating Legend (Absolute Positioned)
// ============================================================================

interface FloatingLegendProps extends EMALegendProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const FloatingLegend: React.FC<FloatingLegendProps> = ({
  position = 'top-left',
  ...props
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: position.includes('top') ? -10 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        absolute z-10 p-3
        bg-terminal-panel/95 backdrop-blur-sm
        border border-terminal-border
        rounded-xl shadow-xl
        ${positionClasses[position]}
      `}
    >
      <EMALegend {...props} />
    </motion.div>
  );
};

// ============================================================================
// Inline Legend (For Chart Header)
// ============================================================================

export const InlineLegend: React.FC<EMALegendProps> = ({
  emaValues,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.ema10 }} />
        <span className="text-xs text-terminal-dim">10</span>
        <span className="text-xs font-mono">{formatValue(emaValues.ema10)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.ema20 }} />
        <span className="text-xs text-terminal-dim">20</span>
        <span className="text-xs font-mono">{formatValue(emaValues.ema20)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.ema44 }} />
        <span className="text-xs text-terminal-dim">44</span>
        <span className="text-xs font-mono">{formatValue(emaValues.ema44)}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Default Export
// ============================================================================

export default EMALegend;
