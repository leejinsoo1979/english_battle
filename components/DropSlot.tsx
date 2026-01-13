
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  index: number;
  content: string | null;
  onDrop: (letterId: string, slotIndex: number) => void;
  onClick: () => void;
  highlightColor?: string;
  isLocked?: boolean;
}

const DropSlot: React.FC<Props> = ({ index, content, onDrop, onClick, highlightColor, isLocked }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (content === null && !isLocked) {
      setIsOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDropLocal = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    if (isLocked) return;
    const letterId = e.dataTransfer.getData('text/plain');
    onDrop(letterId, index);
  };

  return (
    <motion.div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropLocal}
      onClick={onClick}
      animate={{ 
        scale: isOver ? 1.2 : 1,
        backgroundColor: isOver ? '#ffedd5' : (content ? '#ffffff' : '#f9fafb')
      }}
      className={`
        w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-200
        ${content ? 'shadow-[0_4px_0_rgba(0,0,0,0.05)] border-2 border-orange-100' : 'border-2 border-dashed border-gray-300'}
        ${content ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <AnimatePresence mode="wait">
        {content ? (
          <motion.span 
            key={content}
            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`text-2xl md:text-3xl font-fredoka ${highlightColor || 'text-gray-800'}`}
          >
            {content}
          </motion.span>
        ) : (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-300 text-xs"
          >
            ●
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DropSlot;
