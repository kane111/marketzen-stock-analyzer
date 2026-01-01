import { motion } from 'framer-motion'

// ==========================================
// TERMINAL CARD - Container Component
// ==========================================
export function TerminalCard({
  children,
  className = '',
  padding = 'md',
  hover = false
}) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  return (
    <motion.div
      className={`bg-terminal-bg-secondary border border-terminal-border rounded-lg ${paddings[padding]} ${className}`}
      whileHover={hover ? { scale: 1.01 } : {}}
    >
      {children}
    </motion.div>
  )
}

// ==========================================
// TERMINAL CHIP - Filter Chip / Tag
// ==========================================
export function TerminalChip({
  label,
  isSelected,
  onClick,
  disabled = false,
  color,
  className = ''
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap text-xs font-mono transition-all ${
        isSelected
          ? color 
            ? `text-terminal-bg border-0` 
            : 'bg-terminal-green text-terminal-bg border border-terminal-green'
          : 'bg-terminal-bg-secondary text-terminal-dim border border-terminal-border hover:bg-terminal-bg-light hover:text-terminal-text'
      } ${className}`}
      style={color && isSelected ? { backgroundColor: color } : {}}
    >
      {color && isSelected && (
        <span className="w-2 h-2 rounded-full bg-current opacity-50" />
      )}
      {label}
    </motion.button>
  )
}

export default TerminalChip
