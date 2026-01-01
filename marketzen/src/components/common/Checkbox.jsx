import { motion } from 'framer-motion'
import { useState } from 'react'

// ==========================================
// TERMINAL CHECKBOX - Custom Checkbox
// ==========================================
export function TerminalCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) {
  return (
    <label className={`inline-flex items-center gap-2.5 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <motion.div
        animate={{
          backgroundColor: checked ? '#33FF00' : 'transparent',
          borderColor: checked ? '#33FF00' : '#3a3f42'
        }}
        whileHover={!disabled ? { borderColor: checked ? '#33FF00' : '#33FF00' } : {}}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-terminal-green/50`}
      >
        {checked && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-3 h-3 text-terminal-bg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </motion.div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span className={`text-sm font-mono transition-colors ${checked ? 'text-terminal-text' : 'text-terminal-dim group-hover:text-terminal-text'}`}>
        {label}
      </span>
    </label>
  )
}

export default TerminalCheckbox
