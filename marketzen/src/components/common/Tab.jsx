import { motion } from 'framer-motion'

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

export default TerminalTab
