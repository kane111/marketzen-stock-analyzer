import { motion } from 'framer-motion'

// ==========================================
// TERMINAL BUTTON - Primary CTA Component
// ==========================================
export function TerminalButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  isSelected = false
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out rounded-lg focus:outline-none focus:ring-2 focus:ring-terminal-green/50 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: isSelected
      ? 'bg-terminal-green text-terminal-bg border border-terminal-green shadow-lg shadow-terminal-green/20'
      : 'bg-terminal-bg-secondary text-terminal-green border border-terminal-border hover:bg-terminal-green/10 hover:border-terminal-green hover:shadow-lg hover:shadow-terminal-green/10',
    ghost: isSelected
      ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/50'
      : 'bg-transparent text-terminal-dim border border-transparent hover:bg-terminal-bg-secondary hover:text-terminal-text hover:border-terminal-border',
    danger: isSelected
      ? 'bg-terminal-red text-white border border-terminal-red shadow-lg shadow-terminal-red/20'
      : 'bg-terminal-bg-secondary text-terminal-red border border-terminal-border hover:bg-terminal-red/10 hover:border-terminal-red hover:shadow-lg hover:shadow-terminal-red/10'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2'
  }
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.button>
  )
}

export default TerminalButton
