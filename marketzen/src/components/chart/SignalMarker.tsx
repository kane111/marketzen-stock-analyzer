/**
 * Signal Marker Component
 * 
 * Custom Recharts shape component that renders a green upward-pointing
 * arrow to indicate when the Perfect Stack signal fires.
 * 
 * The marker appears below the candle when:
 * 1. Price > EMA10 > EMA20 > EMA44
 * 2. Volume > 20-period Volume SMA
 */

import React from 'react';
import { DotProps } from 'recharts';

// ============================================================================
// Types
// ============================================================================

/**
 * Custom dot props from Recharts
 */
interface CustomDotProps extends DotProps {
  payload?: {
    isPerfectStack?: boolean;
    close?: number;
    ema10?: number | null;
    ema20?: number | null;
    ema44?: number | null;
    [key: string]: unknown;
  };
}

// ============================================================================
// Styles
// ============================================================================

const SIGNAL_COLORS = {
  primary: '#22c55e',    // Green-500
  primaryDark: '#16a34a', // Green-600
  glow: 'rgba(34, 197, 94, 0.5)'
};

const MARKER_SIZE = {
  width: 14,
  height: 16
};

// ============================================================================
// SVG Path Generators
// ============================================================================

/**
 * Generate SVG path for upward arrow marker
 * 
 * Creates a clean upward-pointing arrow shape that
 * indicates a bullish signal.
 * 
 * @param x - Center X position
 * @param y - Center Y position
 * @param size - Size multiplier
 * @returns SVG path string
 */
function createArrowPath(x: number, y: number, size: number = 1): string {
  const w = MARKER_SIZE.width * size;
  const h = MARKER_SIZE.height * size;
  const halfW = w / 2;
  
  // Arrow pointing up: Triangle with a tail
  // Start from bottom left, go up to tip, then down to bottom right
  return `
    M ${x - halfW} ${y + h * 0.3}
    L ${x - halfW} ${y - h * 0.2}
    L ${x - halfW * 0.3} ${y - h * 0.2}
    L ${x} ${y - h * 0.5}
    L ${x + halfW * 0.3} ${y - h * 0.2}
    L ${x + halfW} ${y - h * 0.2}
    L ${x + halfW} ${y + h * 0.3}
    Z
  `;
}

/**
 * Generate SVG path for diamond marker (alternative style)
 * 
 * @param x - Center X position
 * @param y - Center Y position
 * @param size - Size multiplier
 * @returns SVG path string
 */
function createDiamondPath(x: number, y: number, size: number = 1): string {
  const w = MARKER_SIZE.width * 0.6 * size;
  const h = MARKER_SIZE.height * 0.7 * size;
  
  return `
    M ${x} ${y - h}
    L ${x + w} ${y}
    L ${x} ${y + h}
    L ${x - w} ${y}
    Z
  `;
}

/**
 * Generate SVG path for triangle marker (alternative style)
 * 
 * @param x - Center X position
 * @param y - Center Y position
 * @param size - Size multiplier
 * @returns SVG path string
 */
function createTrianglePath(x: number, y: number, size: number = 1): string {
  const w = MARKER_SIZE.width * 0.7 * size;
  const h = MARKER_SIZE.height * 0.8 * size;
  
  return `
    M ${x} ${y - h}
    L ${x + w} ${y + h * 0.3}
    L ${x - w} ${y + h * 0.3}
    Z
  `;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Signal Marker Component
 * 
 * Renders a custom SVG marker that appears when the Perfect Stack
 * signal conditions are met. Only renders when payload.isPerfectStack
 * is true.
 * 
 * Features:
 * - Animated appearance with scale effect
 * - Glow effect for visibility
 * - Responsive positioning
 * 
 * @param props - Recharts dot props
 * @returns SVG element or null
 * 
 * @example
 * ```tsx
 * <ComposedChart>
 *   <Scatter
 *     dataKey="signalFired"
 *     shape={<SignalMarker />}
 *   />
 * </ComposedChart>
 * ```
 */
export const SignalMarker: React.FC<CustomDotProps> = (props) => {
  const { cx, cy, payload } = props;
  
  // Don't render if no signal or invalid position
  if (!cx || !cy || !payload || !payload.isPerfectStack) {
    return null;
  }
  
  return (
    <g>
      {/* Glow effect */}
      <filter id="signalGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      {/* Main arrow marker */}
      <path
        d={createArrowPath(cx, cy + 10, 0.8)}
        fill={SIGNAL_COLORS.primary}
        stroke={SIGNAL_COLORS.primaryDark}
        strokeWidth={1}
        filter="url(#signalGlow)"
        style={{
          cursor: 'pointer',
          transition: 'transform 0.2s ease-out',
          transformOrigin: 'center'
        }}
      />
      
      {/* Optional: Add a second smaller arrow for emphasis */}
      <path
        d={createArrowPath(cx, cy + 20, 0.5)}
        fill={SIGNAL_COLORS.primary}
        opacity={0.6}
      />
    </g>
  );
};

// ============================================================================
// Alternative Marker Styles
// ============================================================================

/**
 * Signal Diamond - Alternative marker style
 */
export const SignalDiamond: React.FC<CustomDotProps> = (props) => {
  const { cx, cy, payload } = props;
  
  if (!cx || !cy || !payload || !payload.isPerfectStack) {
    return null;
  }
  
  return (
    <g>
      <filter id="diamondGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      <path
        d={createDiamondPath(cx, cy + 8)}
        fill={SIGNAL_COLORS.primary}
        stroke={SIGNAL_COLORS.primaryDark}
        strokeWidth={1.5}
        filter="url(#diamondGlow)"
      />
    </g>
  );
};

/**
 * Signal Triangle - Alternative marker style
 */
export const SignalTriangle: React.FC<CustomDotProps> = (props) => {
  const { cx, cy, payload } = props;
  
  if (!cx || !cy || !payload || !payload.isPerfectStack) {
    return null;
  }
  
  return (
    <g>
      <filter id="triangleGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      <path
        d={createTrianglePath(cx, cy + 6)}
        fill={SIGNAL_COLORS.primary}
        stroke={SIGNAL_COLORS.primaryDark}
        strokeWidth={1}
        filter="url(#triangleGlow)"
      />
    </g>
  );
};

// ============================================================================
// Bar Highlight Component
// ============================================================================

/**
 * Highlight bar component for volume confirmation
 * 
 * Changes the color of volume bars when Perfect Stack
 * conditions are met.
 */
interface VolumeBarHighlightProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    isPerfectStack?: boolean;
    volume?: number;
    [key: string]: unknown;
  };
}

export const VolumeBarHighlight: React.FC<VolumeBarHighlightProps> = (props) => {
  const { x, y, width, height, payload } = props;
  
  if (!payload || !payload.isPerfectStack) {
    return null;
  }
  
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={SIGNAL_COLORS.primary}
      fillOpacity={0.3}
    />
  );
};

// ============================================================================
// Default Export
// ============================================================================

export default SignalMarker;

// ============================================================================
// Animation Variants (for Framer Motion if needed)
// ============================================================================

/**
 * Animation variants for marker entrance animation
 */
export const markerAnimations = {
  hidden: {
    scale: 0,
    opacity: 0
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30
    }
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Pulse animation for active signal
 */
export const pulseAnimation = {
  scale: [1, 1.2, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'easeInOut'
  }
};
