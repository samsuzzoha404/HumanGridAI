import { motion } from 'framer-motion';

export function Web3Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(217 91% 60% / 0.4) 0%, transparent 70%)',
          top: '-20%',
          right: '-10%',
          filter: 'blur(100px)',
        }}
      />
      
      <motion.div
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 20, -30, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, hsl(258 90% 66% / 0.5) 0%, transparent 70%)',
          bottom: '-10%',
          left: '-5%',
          filter: 'blur(80px)',
        }}
      />

      {/* Hexagon grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
            <polygon 
              points="25,0 50,14.4 50,43.4 25,57.7 0,43.4 0,14.4" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="0.5"
              className="text-primary"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>

      {/* Floating blockchain nodes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/30"
          style={{
            top: `${15 + i * 15}%`,
            left: `${10 + (i % 3) * 30}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <motion.line
          x1="10%"
          y1="20%"
          x2="30%"
          y2="40%"
          stroke="hsl(217 91% 60%)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.line
          x1="30%"
          y1="40%"
          x2="70%"
          y2="30%"
          stroke="hsl(258 90% 66%)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", delay: 1 }}
        />
        <motion.line
          x1="70%"
          y1="30%"
          x2="90%"
          y2="60%"
          stroke="hsl(160 84% 39%)"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
        />
      </svg>
    </div>
  );
}