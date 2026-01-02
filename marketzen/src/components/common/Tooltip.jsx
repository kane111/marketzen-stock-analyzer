import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle } from 'lucide-react'

/**
 * Tooltip component for displaying helpful information on hover
 * 
 * @param {string} content - The tooltip content
 * @param {string} position - 'top', 'bottom', 'left', 'right'
 * @param {React.ReactNode} children - The trigger element
 */
export function Tooltip({ content, position = 'top', children }) {
  const [isVisible, setIsVisible] = useState(false)

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowStyles = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-terminal-bg-secondary',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-b-terminal-bg-secondary',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-l-terminal-bg-secondary',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-r-terminal-bg-secondary'
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionStyles[position]}`}
          >
            <div className="bg-terminal-bg-secondary border border-terminal-border rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
              <p className="text-xs text-terminal-text">{content}</p>
              <div className={`absolute w-0 h-0 border-4 border-transparent ${arrowStyles[position]}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Info icon with tooltip - commonly used for help hints
 */
export function InfoTooltip({ content, className = '' }) {
  return (
    <Tooltip content={content}>
      <button
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-terminal-bg hover:bg-terminal-bg-light transition-colors ${className}`}
      >
        <HelpCircle className="w-3 h-3 text-terminal-dim" />
      </button>
    </Tooltip>
  )
}

export default Tooltip
