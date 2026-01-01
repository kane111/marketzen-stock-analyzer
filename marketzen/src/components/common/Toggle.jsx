import { motion } from 'framer-motion'
import { useState } from 'react'

// ==========================================
// TERMINAL TOGGLE - Boolean Switch
// ==========================================
export function TerminalToggle({
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <span className={`text-sm font-mono transition-colors ${checked ? 'text-terminal-text' : 'text-terminal-dim group-hover:text-terminal-text'}`}>
        {label}
      </span>
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={disabled ? undefined : onChange}
        disabled={disabled}
        animate={{
          backgroundColor: checked ? 'rgba(51, 255, 0, 0.2)' : 'rgba(31, 34, 35, 1)',
          borderColor: checked ? '#33FF00' : '#3a3f42'
        }}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        className={`relative w-11 h-6 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-terminal-green/50`}
      >
        <motion.div
          animate={{
            x: checked ? 20 : 2,
            backgroundColor: checked ? '#33FF00' : '#666'
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm ${
            checked ? 'shadow-terminal-green/30' : 'shadow-black/20'
          }`}
        />
      </motion.button>
    </label>
  )
}

export default TerminalToggle
