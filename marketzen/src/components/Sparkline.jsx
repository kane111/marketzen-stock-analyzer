import { useMemo } from 'react'
import { motion } from 'framer-motion'

function Sparkline({ data = [], isPositive = true, width = 60, height = 24 }) {
  const pathData = useMemo(() => {
    // Use real data if provided, otherwise show flat line
    if (!data || data.length < 2) {
      // Return a flat line when no data
      return `M 0 ${height / 2} L ${width} ${height / 2}`
    }

    const prices = data.map(d => d.price || d.close || d.value || d)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    
    const stepX = width / (prices.length - 1)
    
    let path = `M 0 ${height - ((prices[0] - min) / range) * height}`
    
    prices.slice(1).forEach((price, i) => {
      const x = (i + 1) * stepX
      const y = height - ((price - min) / range) * height
      path += ` L ${x} ${y}`
    })
    
    return path
  }, [data, width, height])

  // Determine color based on trend
  const color = isPositive ? '#10b981' : '#ef4444'

  // Calculate end point for the dot
  const endPoint = useMemo(() => {
    if (!data || data.length < 2) {
      return { x: width, y: height / 2 }
    }
    
    const prices = data.map(d => d.price || d.close || d.value || d)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const lastPrice = prices[prices.length - 1]
    
    return {
      x: width,
      y: height - ((lastPrice - min) / range) * height
    }
  }, [data, width, height])

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <motion.path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <motion.circle
        cx={endPoint.x}
        cy={endPoint.y}
        r="2"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />
    </motion.svg>
  )
}

export default Sparkline
