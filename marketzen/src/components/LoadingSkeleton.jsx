import { motion } from 'framer-motion'

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-surface"
          />
          <div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-32 h-6 rounded bg-surface mb-2"
            />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              className="w-20 h-4 rounded bg-surface"
            />
          </div>
        </div>

        {/* Price Skeleton */}
        <div className="flex items-baseline gap-4 mb-6">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            className="w-48 h-12 rounded bg-surface"
          />
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            className="w-24 h-8 rounded-lg bg-surface"
          />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="glass p-4 rounded-xl"
            >
              <div className="w-20 h-3 rounded bg-surface mb-2" />
              <div className="w-28 h-6 rounded bg-surface" />
            </motion.div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              className="w-28 h-6 rounded bg-surface"
            />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 + i * 0.05 }}
                  className="w-10 h-8 rounded-lg bg-surface"
                />
              ))}
            </div>
          </div>
          
          <div className="h-80 flex items-center justify-center">
            <div className="w-full h-full flex items-end justify-around px-4 pb-4 gap-1">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.03 }}
                  className="w-3 rounded-t bg-surface"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingSkeleton
