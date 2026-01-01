import { motion } from 'framer-motion'
import { useState } from 'react'

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

// ==========================================
// TERMINAL TAB - Tab Navigation
// ==========================================
export function TerminalTab({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-sm font-mono ${
            activeTab === tab.id
              ? 'bg-terminal-green text-terminal-bg border border-terminal-green shadow-lg shadow-terminal-green/10'
              : 'bg-terminal-bg-secondary text-terminal-dim border border-terminal-border hover:bg-terminal-bg-light hover:text-terminal-text hover:border-terminal-border/80'
          }`}
        >
          {tab.icon && <tab.icon className="w-4 h-4" />}
          {tab.label}
        </motion.button>
      ))}
    </div>
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

// ==========================================
// TERMINAL INDICATOR TOGGLE - For Chart Indicators
// ==========================================
export function TerminalIndicatorToggle({
  label,
  isActive,
  onToggle,
  color,
  disabled = false,
  className = ''
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
        isActive
          ? 'bg-terminal-green/20 border-terminal-green text-terminal-green shadow-lg shadow-terminal-green/10'
          : 'bg-terminal-bg-secondary/80 border-terminal-border text-terminal-dim hover:bg-terminal-bg-light hover:text-terminal-text hover:border-terminal-border/80'
      } ${className}`}
    >
      <span 
        className={`w-3 h-3 rounded-full shadow-sm transition-colors ${
          isActive ? 'ring-1 ring-terminal-green/50' : ''
        }`}
        style={{ backgroundColor: isActive ? color : '#4a4f52' }}
      />
      <span className="text-sm font-mono">{label}</span>
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="ml-auto"
        >
          <span className="w-5 h-5 rounded-full bg-terminal-green text-terminal-bg flex items-center justify-center text-xs font-bold">
            ✓
          </span>
        </motion.div>
      )}
    </motion.button>
  )
}

// ==========================================
// TERMINAL RADIO GROUP - Mutually Exclusive Options
// ==========================================
export function TerminalRadioGroup({
  options,
  value,
  onChange,
  className = ''
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <motion.button
          key={option.id}
          onClick={() => onChange(option.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
            value === option.id
              ? 'bg-terminal-green text-terminal-bg border border-terminal-green shadow-lg shadow-terminal-green/10'
              : 'bg-terminal-bg-secondary text-terminal-dim border border-terminal-border hover:bg-terminal-bg-light hover:text-terminal-text hover:border-terminal-border/80'
          }`}
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  )
}

// ==========================================
// TERMINAL ACTION BUTTON - Icon Button
// ==========================================
export function TerminalActionButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  disabled = false,
  className = ''
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`p-2 rounded-lg transition-all ${
        isActive
          ? 'bg-terminal-green text-terminal-bg'
          : 'bg-terminal-bg-light text-terminal-dim hover:bg-terminal-bg hover:text-terminal-text'
      } ${className}`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  )
}

// ==========================================
// TERMINAL TOOLBAR - Button Group Container
// ==========================================
export function TerminalToolbar({
  children,
  className = ''
}) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-terminal-bg-secondary rounded-lg border border-terminal-border ${className}`}>
      {children}
    </div>
  )
}

// ==========================================
// TERMINAL TOOLBAR BUTTON - For Toolbar Groups
// ==========================================
export function TerminalToolbarButton({
  icon: Icon,
  isActive,
  onClick,
  disabled = false,
  className = ''
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`p-2 rounded-md transition-all ${
        isActive
          ? 'bg-terminal-green text-terminal-bg shadow-sm'
          : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg'
      } ${className}`}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  )
}
