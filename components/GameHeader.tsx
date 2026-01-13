
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  unitName: string;
  currentStep: number;
  totalSteps: number;
  timeLeft: number;
}

const GameHeader: React.FC<Props> = ({ unitName, currentStep, totalSteps, timeLeft }) => {
  const progressPercent = (currentStep / totalSteps) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="w-full max-w-2xl px-4 pt-4 pb-2">
      {/* Compact Header Bar */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-gray-100">

        {/* Left: Progress Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < currentStep
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm shadow-emerald-200'
                    : i === currentStep
                    ? 'bg-gradient-to-r from-orange-400 to-amber-500 shadow-sm shadow-orange-200 scale-125'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-400">
            {currentStep}/{totalSteps}
          </span>
        </div>

        {/* Center: Title */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700 tracking-wide">
            {unitName}
          </span>
        </div>

        {/* Right: Timer */}
        <motion.div
          animate={isLowTime ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: isLowTime ? Infinity : 0, duration: 0.5 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
            isLowTime
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200'
              : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600'
          }`}
        >
          <i className={`fa-solid fa-bolt text-xs ${isLowTime ? 'animate-pulse' : ''}`}></i>
          <span className="text-sm font-bold tabular-nums">{timeLeft}s</span>
        </motion.div>
      </div>

      {/* Thin Progress Bar */}
      <div className="mt-2 mx-2">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
