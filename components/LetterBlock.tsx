
import React from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../utils/sounds';

interface Props {
  id: string;
  char: string;
}

const LetterBlock: React.FC<Props> = ({ id, char }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    playSound('pop', 0.2);
  };

  return (
    <motion.div 
      layoutId={id}
      whileHover={{ scale: 1.1, rotate: 2 }}
      whileTap={{ scale: 0.9, rotate: -2 }}
      draggable
      onDragStart={handleDragStart}
      className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border-2 border-orange-200 rounded-xl shadow-[0_4px_0_rgb(254,215,170)] cursor-grab active:cursor-grabbing active:shadow-none active:translate-y-1 transition-all relative"
    >
      <span className="text-2xl md:text-3xl font-fredoka text-orange-600 select-none">
        {char}
      </span>
      {/* Decorative dots for "block" look */}
      <div className="absolute top-1 left-1 flex gap-0.5">
        <div className="w-1.5 h-1.5 bg-orange-100 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-orange-100 rounded-full"></div>
      </div>
    </motion.div>
  );
};

export default LetterBlock;
