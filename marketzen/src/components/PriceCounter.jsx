import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

function PriceCounter({ value, isPositive = true, decimals = 2, prefix = '' }) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (value === displayValue) return

    const startValue = displayValue
    const endValue = value
    const duration = 500
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  const formattedValue = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(displayValue)

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: isPositive ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-4xl md:text-5xl font-bold font-mono ${
        isPositive ? 'text-positive' : 'text-negative'
      }`}
    >
      {prefix}{formattedValue}
    </motion.span>
  )
}

export default PriceCounter
