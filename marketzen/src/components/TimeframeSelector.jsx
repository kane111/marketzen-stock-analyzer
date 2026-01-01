import { motion } from 'framer-motion'

function TimeframeSelector({ timeframes, selected, onSelect }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
      {timeframes.map((tf) => (
        <motion.button
          key={tf.label}
          onClick={() => onSelect(tf)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            selected.label === tf.label
              ? 'bg-terminal-green text-terminal-bg shadow-lg'
              : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-bg-light'
          }`}
        >
          {tf.label}
        </motion.button>
      ))}
    </div>
  )
}

export default TimeframeSelector
