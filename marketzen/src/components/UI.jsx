import { motion } from 'framer-motion'
import { useState } from 'react'

// ==========================================
// TERMINAL BUTTON - Primary CTA Component
// UX Improvements:
// - Better touch targets (min 44px height)
// - Clearer active/hover states
// - Consistent sizing across variants
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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out rounded-lg focus:outline-none focus:ring-2 focus:ring-terminal-green/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
  
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
// UX Improvements:
// - Better contrast for checked state
// - Clearer visual feedback
// - Improved accessibility
// ==========================================
export function TerminalToggle({
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
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
          backgroundColor: checked ? 'rgba(51, 255, 0, 0.15)' : 'rgba(31, 34, 35, 1)',
          borderColor: checked ? '#33FF00' : '#3a3f42'
        }}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        className={`relative w-11 h-6 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-terminal-green/50 cursor-pointer`}
      >
        <motion.div
          animate={{
            x: checked ? 20 : 2,
            backgroundColor: checked ? '#33FF00' : '#6b7280'
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-colors ${
            checked ? 'shadow-terminal-green/30' : 'shadow-black/20'
          }`}
        />
      </motion.button>
    </label>
  )
}

// ==========================================
// TERMINAL CHECKBOX - Custom Checkbox
// UX Improvements:
// - Larger hit area
// - Better visual feedback
// - Clear checked state
// ==========================================
export function TerminalCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <motion.div
        animate={{
          backgroundColor: checked ? '#33FF00' : 'transparent',
          borderColor: checked ? '#33FF00' : '#3a3f42'
        }}
        whileHover={!disabled ? { borderColor: checked ? '#33FF00' : '#33FF00' } : {}}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-terminal-green/50 cursor-pointer`}
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
// UX Improvements:
// - Better spacing between tabs
// - Clearer active state
// - Improved hover feedback
// ==========================================
export function TerminalTab({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) {
  return (
    <div className={`flex gap-1.5 overflow-x-auto ${className}`}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs font-mono ${
            activeTab === tab.id
              ? 'bg-terminal-green text-terminal-bg border border-terminal-green shadow-lg shadow-terminal-green/10'
              : 'bg-terminal-bg-secondary text-terminal-dim border border-terminal-border hover:bg-terminal-bg-light hover:text-terminal-text hover:border-terminal-border/80'
          }`}
        >
          {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
          {tab.label}
        </motion.button>
      ))}
    </div>
  )
}

// ==========================================
// TERMINAL CHIP - Filter Chip / Tag
// UX Improvements:
// - Better sizing
// - Clear selection state
// - Improved hover effects
// ==========================================

// ==========================================
// TERMINAL INDICATOR TOGGLE - For Chart Indicators
// UX Improvements:
// - Better spacing
// - Clearer active state
// - Improved color visibility
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
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
        isActive
          ? 'bg-terminal-green/20 border-terminal-green text-terminal-green shadow-lg shadow-terminal-green/10'
          : 'bg-terminal-bg-secondary/80 border-terminal-border text-terminal-dim hover:bg-terminal-bg-light hover:text-terminal-text hover:border-terminal-border/80'
      } ${className}`}
    >
      <span 
        className={`w-3 h-3 rounded-full shadow-sm transition-all ${
          isActive ? 'ring-1.5 ring-terminal-green/50' : ''
        }`}
        style={{ backgroundColor: isActive ? color : '#4a4f52' }}
      />
      <span className="text-sm font-mono">{label}</span>
      {isActive && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="ml-auto w-5 h-5 rounded-full bg-terminal-green text-terminal-bg flex items-center justify-center text-xs font-bold"
        >
          ✓
        </motion.span>
      )}
    </button>
  )
}

// ==========================================
// TERMINAL RADIO GROUP - Mutually Exclusive Options
// UX Improvements:
// - Better gap between options
// - Clearer active state
// - Improved hover feedback
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
// UX Improvements:
// - Better touch target
// - Clearer active state
// - Better hover feedback
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
// UX Improvements:
// - Better internal padding
// - Consistent gap
// - Subtle border
// ==========================================
export function TerminalToolbar({
  children,
  className = ''
}) {
  return (
    <div className={`flex items-center gap-1 p-1.5 bg-terminal-bg-secondary rounded-lg border border-terminal-border ${className}`}>
      {children}
    </div>
  )
}

// ==========================================
// TERMINAL TOOLBAR BUTTON - For Toolbar Groups
// UX Improvements:
// - Better sizing
// - Clear active state
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

// ==========================================
// TERMINAL CARD - Generic Card Container
// UX Improvements:
// - Consistent padding
// - Subtle hover state
// - Clear borders
// ==========================================
export function TerminalCard({
  children,
  className = '',
  hover = false,
  onClick
}) {
  const Component = onClick ? motion.div : 'div'
  const motionProps = onClick ? {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 }
  } : {}

  return (
    <Component
      className={`
        bg-terminal-bg-secondary 
        border border-terminal-border 
        rounded-xl 
        p-4 
        ${hover ? 'cursor-pointer hover:border-terminal-dim' : ''}
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </Component>
  )
}

// ==========================================
// TERMINAL SECTION - Section Container
// UX Improvements:
// - Clear separation
// - Consistent spacing
// ==========================================
export function TerminalSection({
  title,
  children,
  className = '',
  action
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="text-sm font-semibold text-terminal-text uppercase tracking-wide">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
