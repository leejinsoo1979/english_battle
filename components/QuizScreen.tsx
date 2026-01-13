
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizLevel } from '../types';
import LetterBlock from './LetterBlock';
import DropSlot from './DropSlot';
import { playSound } from '../utils/sounds';
import confetti from 'canvas-confetti';

interface Props {
  level: QuizLevel;
  onComplete: (score: number) => void;
}

const QuizScreen: React.FC<Props> = ({ level, onComplete }) => {
  const [placedLetters, setPlacedLetters] = useState<(string | null)[]>(
    new Array(level.targetWord.length).fill(null)
  );
  const [availableLetters, setAvailableLetters] = useState<{ id: string, char: string }[]>([]);
  const [isWordCorrect, setIsWordCorrect] = useState(false);
  const [showPhonics, setShowPhonics] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  useEffect(() => {
    const wordLetters = level.targetWord.split('');
    const allChars = [...wordLetters, ...level.distractors].sort(() => Math.random() - 0.5);
    setAvailableLetters(allChars.map((char, idx) => ({ id: `letter-${idx}-${Date.now()}`, char })));
    setPlacedLetters(new Array(level.targetWord.length).fill(null));
    setIsWordCorrect(false);
    setShowPhonics(false);
    setScreenShake(false);
  }, [level]);

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const triggerWin = useCallback(() => {
    setIsWordCorrect(true);
    setScreenShake(true);
    playSound('fanfare', 0.5);
    speak(level.targetWord);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f87171', '#34d399']
    });

    setTimeout(() => setScreenShake(false), 500);

    setTimeout(() => {
      setShowPhonics(true);
      speak(level.sentence.replace('____', level.targetWord));
    }, 800);

    setTimeout(() => {
      onComplete(10);
    }, 4500);
  }, [level, speak, onComplete]);

  const handleDrop = useCallback((letterId: string, slotIndex: number) => {
    const letterObj = availableLetters.find(l => l.id === letterId);
    if (!letterObj) return;

    if (placedLetters[slotIndex] === null) {
      const newPlaced = [...placedLetters];
      newPlaced[slotIndex] = letterObj.char;
      setPlacedLetters(newPlaced);
      setAvailableLetters(prev => prev.filter(l => l.id !== letterId));
      playSound('snap', 0.3);

      if (newPlaced.every(l => l !== null)) {
        const currentWord = newPlaced.join('');
        if (currentWord === level.targetWord) {
          setTimeout(triggerWin, 300);
        } else {
          setTimeout(() => {
            playSound('wrong', 0.3);
            setScreenShake(true);
            setTimeout(() => {
               setScreenShake(false);
            }, 400);
          }, 300);
        }
      }
    }
  }, [availableLetters, placedLetters, level.targetWord, triggerWin]);

  const handleReturnLetter = (char: string, slotIndex: number) => {
    if (isWordCorrect) return;
    const newPlaced = [...placedLetters];
    newPlaced[slotIndex] = null;
    setPlacedLetters(newPlaced);
    setAvailableLetters(prev => [...prev, { id: `letter-ret-${Date.now()}`, char }]);
    playSound('pop', 0.2);
  };

  // Keyboard Support logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWordCorrect) return;
      const pressedKey = e.key.toLowerCase();

      // Check if the key is an alphabet
      if (!/^[a-z]$/.test(pressedKey)) return;

      // Find if this letter is available in the pool
      const availableLetter = availableLetters.find(l => l.char.toLowerCase() === pressedKey);
      if (!availableLetter) return;

      // Find the first empty slot
      const firstEmptyIndex = placedLetters.indexOf(null);
      if (firstEmptyIndex !== -1) {
        handleDrop(availableLetter.id, firstEmptyIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availableLetters, placedLetters, isWordCorrect, handleDrop]);

  return (
    <div className={`flex flex-col items-center w-full max-w-2xl px-4 h-full transition-transform ${screenShake ? 'animate-shake' : ''}`}>
      {/* Title */}
      <h2 className="text-lg font-bold text-gray-800 font-fredoka flex items-center gap-2 mb-2">
        Fill in the blank
        {isWordCorrect && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            className="text-orange-500"
          >
            ✨
          </motion.span>
        )}
      </h2>

      {/* Main Card */}
      <div className={`relative w-full bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center border-b-4 ${isWordCorrect ? 'border-teal-100' : 'border-gray-100'} transition-colors`}>

        {/* Floating Success Badge */}
        <AnimatePresence>
          {isWordCorrect && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0 }}
              animate={{ y: -35, opacity: 1, scale: 1.1 }}
              className="absolute top-0 z-10 bg-teal-400 text-white px-4 py-1 rounded-full font-fredoka shadow-lg text-sm"
            >
              EXCELLENT!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center space-y-2 w-full">
          {/* Image */}
          <div className="relative group">
            <motion.div
              animate={isWordCorrect ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <img
                src={level.imageHint}
                alt="Hint"
                className={`w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl border-3 ${isWordCorrect ? 'border-teal-400' : 'border-orange-100'} shadow-lg transition-all`}
              />
            </motion.div>
            <button
              onClick={() => { playSound('pop'); speak(level.targetWord); }}
              className="absolute -bottom-2 -right-2 bg-orange-400 hover:bg-orange-500 text-white w-8 h-8 rounded-lg shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90"
            >
              <i className="fa-solid fa-volume-high text-sm"></i>
            </button>
          </div>

          {/* Sentence with Drop Slots */}
          <div className="flex flex-wrap items-center justify-center gap-1 text-base md:text-xl font-bold text-gray-700">
            {level.sentence.split(' ').map((word, idx) => {
              if (word.includes('____')) {
                return (
                  <div key={idx} className="flex gap-1 mx-1 p-1 bg-gray-50 rounded-lg border-2 border-gray-100">
                    {level.targetWord.split('').map((_, charIdx) => {
                      const phonicsRule = level.phonicsRules?.find(rule => rule.indices.includes(charIdx));
                      return (
                        <DropSlot
                          key={charIdx}
                          index={charIdx}
                          content={placedLetters[charIdx]}
                          onDrop={handleDrop}
                          onClick={() => placedLetters[charIdx] && handleReturnLetter(placedLetters[charIdx]!, charIdx)}
                          highlightColor={showPhonics && phonicsRule ? phonicsRule.color : (isWordCorrect ? 'animate-rainbow' : undefined)}
                          isLocked={isWordCorrect}
                        />
                      );
                    })}
                  </div>
                );
              }
              return <span key={idx}>{word}</span>;
            })}
          </div>
        </div>

        {/* Phonics Rule Animation */}
        <AnimatePresence>
          {showPhonics && level.phonicsRules && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-2 bg-orange-50 border-2 border-orange-200 rounded-lg text-center w-full shadow-inner"
            >
              <p className="text-orange-700 font-fredoka text-sm">
                ✨ {level.phonicsRules[0].name} ✨
              </p>
              <p className="text-gray-600 text-xs font-medium">{level.phonicsRules[0].description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Available Letters Pool */}
      <div className="flex flex-wrap justify-center gap-2 w-full py-3 mt-2">
        <AnimatePresence>
          {availableLetters.map((l) => (
            <LetterBlock
              key={l.id}
              id={l.id}
              char={l.char}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className={`w-full py-3 rounded-xl text-white font-fredoka text-base text-center shadow-lg transition-all mt-4 ${
          isWordCorrect ? 'bg-teal-400 scale-105' : 'bg-gray-300'
        }`}>
        {isWordCorrect ? 'AMAZING! GOING TO NEXT...' : 'TYPE OR DRAG BLOCKS!'}
      </div>
    </div>
  );
};

export default QuizScreen;
