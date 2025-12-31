import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

function Sparkline({ assetId, isPositive = true, width = 60, height = 24 }) {
  const pathData = useMemo(() => {
    // Generate a random sparkline for demo
    const points = []
    let value = 50
    for (let i = 0; i < 20; i++) {
      value += (Math.random() - 0.5) * 10
      points.push(value)
    }
    
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    
    const stepX = width / (points.length - 1)
    
    let path = `M 0 ${height - ((points[0] - min) / range) * height}`
    
    points.slice(1).forEach((point, i) => {
      const x = (i + 1) * stepX
      const y = height - ((point - min) / range) * height
      path += ` L ${x} ${y}`
    })
    
    return path
  }, [assetId])

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
        stroke={isPositive ? '#10b981' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <motion.circle
        cx={width}
        cy={height / 2}
        r="2"
        fill={isPositive ? '#10b981' : '#ef4444'}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      />
    </motion.svg>
  )
}

export default Sparkline
