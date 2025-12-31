import { motion } from 'framer-motion'

function TimeframeSelector({ timeframes, selected, onSelect }) {
  return (
    <div className="flex items-center gap-1 p-1 glass rounded-lg">
      {timeframes.map((tf) => (
        <motion.button
          key={tf.label}
          onClick={() => onSelect(tf)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            selected.label === tf.label
              ? 'bg-primary text-white shadow-lg'
              : 'text-textSecondary hover:text-text hover:bg-surface'
          }`}
        >
          {tf.label}
        </motion.button>
      ))}
    </div>
  )
}

export default TimeframeSelector
