/**
 * Indicator Controls Component
 * 
 * Provides toggle switches for controlling the visibility of
 * EMAs, signals, and volume on the chart. Uses Lucide icons
 * and Tailwind CSS for styling.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  Eye,
  EyeOff,
  Settings2
} from 'lucide-react';
import { 
  IndicatorState, 
  DEFAULT_INDICATOR_STATE 
} from '../../hooks/useEMAIndicator';

// ============================================================================
// Types
// ============================================================================

interface IndicatorControlsProps {
  /** Current indicator visibility state */
  state: IndicatorState;
  
  /** Callback when EMA toggle is clicked */
  onToggleEMAs: () => void;
  
  /** Callback when signal toggle is clicked */
  onToggleSignals: () => void;
  
  /** Callback when volume toggle is clicked */
  onToggleVolume: () => void;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Whether to show compact version */
  compact?: boolean;
  
  /** Current price position data */
  pricePosition?: {
    aboveEMA10: boolean;
    aboveEMA20: boolean;
    aboveEMA44: boolean;
    maStackOrder: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strengthScore: number;
  };
}

// ============================================================================
// Color Constants
// ============================================================================

const COLORS = {
  ema10: '#22d3ee',  // Cyan-400
  ema20: '#fbbf24',  // Amber-400
  ema44: '#a855f7',  // Purple-500
  signal: '#22c55e', // Green-500
  active: '#22c55e',
  inactive: '#64748b'
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Toggle Switch Component
 */
interface ToggleProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  color?: string;
  compact?: boolean;
}

const ToggleSwitch: React.FC<ToggleProps> = ({
  label,
  icon,
  isActive,
  onClick,
  color = COLORS.active,
  compact = false
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`
      flex items-center gap-2 px-3 py-2 rounded-lg
      border transition-all duration-200
      ${isActive 
        ? 'bg-terminal-bg border-terminal-green/50 shadow-lg shadow-terminal-green/10' 
        : 'bg-terminal-panel border-terminal-border hover:border-terminal-dim'
      }
      ${compact ? 'py-1 px-2' : ''}
    `}
    title={isActive ? `Hide ${label}` : `Show ${label}`}
  >
    <span style={{ color: isActive ? color : COLORS.inactive }}>
      {icon}
    </span>
    {!compact && (
      <span className={`
        text-sm font-medium
        ${isActive ? 'text-terminal-text' : 'text-terminal-dim'}
      `}>
        {label}
      </span>
    )}
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.span
          key="eye-on"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Eye className="w-4 h-4 text-terminal-green" />
        </motion.span>
      ) : (
        <motion.span
          key="eye-off"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <EyeOff className="w-4 h-4 text-terminal-dim" />
        </motion.span>
      )}
    </AnimatePresence>
  </motion.button>
);

/**
 * Stack Status Badge
 */
interface StackStatusProps {
  isBullish: boolean;
  strengthScore: number;
}

const StackStatus: React.FC<StackStatusProps> = ({ isBullish, strengthScore }) => {
  const statusColor = isBullish ? 'text-terminal-green' : 'text-terminal-dim';
  const bgColor = isBullish ? 'bg-terminal-green/10' : 'bg-terminal-dim/10';
  const borderColor = isBullish ? 'border-terminal-green/30' : 'border-terminal-dim/30';
  
  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-lg
      border ${borderColor} ${bgColor}
    `}>
      <Activity className={`w-4 h-4 ${statusColor}`} />
      <span className={`text-xs font-medium ${statusColor}`}>
        {isBullish ? 'PERFECT STACK' : 'NO SIGNAL'}
      </span>
      {isBullish && (
        <span className="text-xs text-terminal-dim">
          ({Math.round(strengthScore)}%)
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Indicator Controls Component
 * 
 * Renders a control panel for toggling chart indicators.
 * Supports both compact and full modes.
 * 
 * @example
 * ```tsx
 * <IndicatorControls
 *   state={indicatorState}
 *   onToggleEMAs={toggleEMAs}
 *   onToggleSignals={toggleSignals}
 *   onToggleVolume={toggleVolume}
 * />
 * ```
 */
export const IndicatorControls: React.FC<IndicatorControlsProps> = ({
  state,
  onToggleEMAs,
  onToggleSignals,
  onToggleVolume,
  className = '',
  compact = false,
  pricePosition
}) => {
  const hasPricePosition = pricePosition && pricePosition.maStackOrder !== 'NEUTRAL';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Stack Status (only when bullish) */}
      {hasPricePosition && pricePosition.maStackOrder === 'BULLISH' && (
        <StackStatus
          isBullish={true}
          strengthScore={pricePosition.strengthScore}
        />
      )}
      
      {/* EMA Toggle */}
      <ToggleSwitch
        label="EMAs"
        icon={<TrendingUp className="w-4 h-4" />}
        isActive={state.showEMAs}
        onClick={onToggleEMAs}
        compact={compact}
      />
      
      {/* Signals Toggle */}
      <ToggleSwitch
        label="Signals"
        icon={<Activity className="w-4 h-4" />}
        isActive={state.showSignals}
        onClick={onToggleSignals}
        color={COLORS.signal}
        compact={compact}
      />
      
      {/* Volume Toggle */}
      <ToggleSwitch
        label="Volume"
        icon={<BarChart3 className="w-4 h-4" />}
        isActive={state.showVolume}
        onClick={onToggleVolume}
        compact={compact}
      />
    </div>
  );
};

// ============================================================================
// Extended Controls with Legend
// ============================================================================

interface ExtendedIndicatorControlsProps extends IndicatorControlsProps {
  /** Current EMA values */
  emaValues?: {
    ema10: number | null;
    ema20: number | null;
    ema44: number | null;
  };
  
  /** Whether to show settings dropdown */
  showSettings?: boolean;
  
  /** Settings click handler */
  onSettingsClick?: () => void;
}

/**
 * Extended Indicator Controls with EMA values display
 */
export const ExtendedIndicatorControls: React.FC<ExtendedIndicatorControlsProps> = ({
  state,
  onToggleEMAs,
  onToggleSignals,
  onToggleVolume,
  className = '',
  compact = false,
  pricePosition,
  emaValues,
  showSettings = false,
  onSettingsClick
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Left: Controls */}
      <IndicatorControls
        state={state}
        onToggleEMAs={onToggleEMAs}
        onToggleSignals={onToggleSignals}
        onToggleVolume={onToggleVolume}
        compact={compact}
        pricePosition={pricePosition}
      />
      
      {/* Center: EMA Values (if provided) */}
      {emaValues && state.showEMAs && (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-terminal-panel rounded-lg border border-terminal-border">
          <div className="flex items-center gap-1.5">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: COLORS.ema10 }}
            />
            <span className="text-xs text-terminal-dim">10:</span>
            <span className="text-xs font-mono text-terminal-text">
              {emaValues.ema10?.toFixed(2) ?? '--'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: COLORS.ema20 }}
            />
            <span className="text-xs text-terminal-dim">20:</span>
            <span className="text-xs font-mono text-terminal-text">
              {emaValues.ema20?.toFixed(2) ?? '--'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: COLORS.ema44 }}
            />
            <span className="text-xs text-terminal-dim">44:</span>
            <span className="text-xs font-mono text-terminal-text">
              {emaValues.ema44?.toFixed(2) ?? '--'}
            </span>
          </div>
        </div>
      )}
      
      {/* Right: Settings */}
      {showSettings && (
        <motion.button
          onClick={onSettingsClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg bg-terminal-bg border border-terminal-border hover:border-terminal-dim transition-colors"
          title="Indicator Settings"
        >
          <Settings2 className="w-4 h-4 text-terminal-dim" />
        </motion.button>
      )}
    </div>
  );
};

// ============================================================================
// Compact Floating Controls
// ============================================================================

/**
 * Compact floating control bar
 */
export const FloatingControls: React.FC<IndicatorControlsProps> = ({
  state,
  onToggleEMAs,
  onToggleSignals,
  onToggleVolume,
  pricePosition
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <div className="relative">
      {/* Collapse/Expand Toggle */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          border transition-all duration-200
          ${isExpanded 
            ? 'bg-terminal-bg border-terminal-green/50' 
            : 'bg-terminal-panel border-terminal-border'
          }
        `}
      >
        <Activity className="w-4 h-4 text-terminal-green" />
        <span className="text-sm font-medium text-terminal-text">Indicators</span>
        {pricePosition?.maStackOrder === 'BULLISH' && (
          <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
        )}
      </motion.button>
      
      {/* Expanded Controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-full right-0 mt-2 p-3 bg-terminal-panel border border-terminal-border rounded-xl shadow-xl z-50"
          >
            <div className="flex flex-col gap-2">
              <IndicatorControls
                state={state}
                onToggleEMAs={onToggleEMAs}
                onToggleSignals={onToggleSignals}
                onToggleVolume={onToggleVolume}
                compact={true}
                pricePosition={pricePosition}
              />
              
              {/* Reset Button */}
              <motion.button
                onClick={() => {
                  onToggleEMAs();
                  onToggleSignals();
                  onToggleVolume();
                }}
                whileHover={{ scale: 1.02 }}
                className="mt-2 px-3 py-1.5 text-xs text-terminal-dim hover:text-terminal-text bg-terminal-bg rounded border border-terminal-border transition-colors"
              >
                Reset to Default
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Click outside to close */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// Default Export
// ============================================================================

export default IndicatorControls;
