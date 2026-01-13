import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizLevel } from '../../types';
import { playSound } from '../../utils/sounds';

interface Props {
  level: QuizLevel;
  onPlayer1Answer: (answer: string) => void;
  onPlayer2Answer: (answer: string) => void;
  disabled: boolean;
}

interface DraggableLetter {
  id: string;
  char: string;
  originalIndex: number;
}

const ScrambleGame: React.FC<Props> = ({
  level,
  onPlayer1Answer,
  onPlayer2Answer,
  disabled,
}) => {
  // 섞인 글자들 생성
  const scrambledLetters = useMemo(() => {
    const letters = level.targetWord.split('').map((char, i) => ({
      id: `letter-${i}-${Date.now()}`,
      char,
      originalIndex: i,
    }));
    // 셔플
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  }, [level]);

  const [player1Letters, setPlayer1Letters] = useState<DraggableLetter[]>([]);
  const [player1Slots, setPlayer1Slots] = useState<(DraggableLetter | null)[]>([]);

  const [player2Letters, setPlayer2Letters] = useState<DraggableLetter[]>([]);
  const [player2Slots, setPlayer2Slots] = useState<(DraggableLetter | null)[]>([]);

  // 초기화
  useEffect(() => {
    const p1Letters = scrambledLetters.map((l, i) => ({ ...l, id: `p1-${i}-${Date.now()}` }));
    const p2Letters = scrambledLetters.map((l, i) => ({ ...l, id: `p2-${i}-${Date.now()}` }));

    setPlayer1Letters(p1Letters);
    setPlayer1Slots(new Array(level.targetWord.length).fill(null));

    setPlayer2Letters(p2Letters);
    setPlayer2Slots(new Array(level.targetWord.length).fill(null));
  }, [level, scrambledLetters]);

  // 정답 체크
  const checkAnswer = useCallback((slots: (DraggableLetter | null)[], player: 1 | 2) => {
    if (slots.every(s => s !== null)) {
      const answer = slots.map(s => s!.char).join('');
      if (answer.toLowerCase() === level.targetWord.toLowerCase()) {
        playSound('fanfare', 0.5);
        if (player === 1) {
          onPlayer1Answer(answer);
        } else {
          onPlayer2Answer(answer);
        }
      } else {
        playSound('wrong', 0.3);
      }
    }
  }, [level.targetWord, onPlayer1Answer, onPlayer2Answer]);

  // Player 1 드래그 앤 드롭
  const handlePlayer1Drop = (letterId: string, slotIndex: number) => {
    if (disabled) return;

    const letter = player1Letters.find(l => l.id === letterId);
    if (!letter || player1Slots[slotIndex] !== null) return;

    const newSlots = [...player1Slots];
    newSlots[slotIndex] = letter;
    setPlayer1Slots(newSlots);
    setPlayer1Letters(prev => prev.filter(l => l.id !== letterId));
    playSound('snap', 0.3);

    checkAnswer(newSlots, 1);
  };

  const handlePlayer1Return = (slotIndex: number) => {
    if (disabled) return;

    const letter = player1Slots[slotIndex];
    if (!letter) return;

    const newSlots = [...player1Slots];
    newSlots[slotIndex] = null;
    setPlayer1Slots(newSlots);
    setPlayer1Letters(prev => [...prev, letter]);
    playSound('pop', 0.2);
  };

  // Player 2 드래그 앤 드롭
  const handlePlayer2Drop = (letterId: string, slotIndex: number) => {
    if (disabled) return;

    const letter = player2Letters.find(l => l.id === letterId);
    if (!letter || player2Slots[slotIndex] !== null) return;

    const newSlots = [...player2Slots];
    newSlots[slotIndex] = letter;
    setPlayer2Slots(newSlots);
    setPlayer2Letters(prev => prev.filter(l => l.id !== letterId));
    playSound('snap', 0.3);

    checkAnswer(newSlots, 2);
  };

  const handlePlayer2Return = (slotIndex: number) => {
    if (disabled) return;

    const letter = player2Slots[slotIndex];
    if (!letter) return;

    const newSlots = [...player2Slots];
    newSlots[slotIndex] = null;
    setPlayer2Slots(newSlots);
    setPlayer2Letters(prev => [...prev, letter]);
    playSound('pop', 0.2);
  };

  // 드래그 가능한 글자 블록 컴포넌트
  const LetterBlock: React.FC<{
    letter: DraggableLetter;
    color: 'blue' | 'red';
  }> = ({ letter, color }) => (
    <motion.div
      layoutId={letter.id}
      draggable
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', letter.id);
        playSound('pop', 0.2);
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl font-fredoka text-2xl cursor-grab active:cursor-grabbing select-none ${
        color === 'blue'
          ? 'bg-blue-600 border-2 border-blue-400 text-white shadow-lg shadow-blue-500/30'
          : 'bg-red-600 border-2 border-red-400 text-white shadow-lg shadow-red-500/30'
      }`}
    >
      {letter.char.toUpperCase()}
    </motion.div>
  );

  // 드롭 슬롯 컴포넌트
  const DropSlot: React.FC<{
    index: number;
    content: DraggableLetter | null;
    onDrop: (letterId: string, index: number) => void;
    onReturn: (index: number) => void;
    color: 'blue' | 'red';
  }> = ({ index, content, onDrop, onReturn, color }) => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const letterId = e.dataTransfer.getData('text/plain');
        onDrop(letterId, index);
      }}
      onClick={() => content && onReturn(index)}
      className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl border-2 border-dashed transition-all ${
        content
          ? color === 'blue'
            ? 'bg-blue-600 border-blue-400 cursor-pointer'
            : 'bg-red-600 border-red-400 cursor-pointer'
          : 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
      }`}
    >
      {content ? (
        <span className="font-fredoka text-2xl text-white">{content.char.toUpperCase()}</span>
      ) : (
        <span className="text-gray-600 text-xl">_</span>
      )}
    </div>
  );

  return (
    <div className="flex w-full h-full">
      {/* Player 1 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-blue-400 font-bold text-lg">Player 1</div>

        {/* 드롭 슬롯 */}
        <div className="flex gap-2 p-3 bg-gray-800/50 rounded-xl">
          {player1Slots.map((slot, i) => (
            <DropSlot
              key={i}
              index={i}
              content={slot}
              onDrop={handlePlayer1Drop}
              onReturn={handlePlayer1Return}
              color="blue"
            />
          ))}
        </div>

        {/* 사용 가능한 글자들 */}
        <div className="flex flex-wrap gap-2 justify-center max-w-xs">
          <AnimatePresence>
            {player1Letters.map((letter) => (
              <LetterBlock key={letter.id} letter={letter} color="blue" />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 중앙 - 힌트 */}
      <div className="flex-1 flex flex-col items-center justify-center border-x border-gray-700/30 bg-black/20">
        <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">Unscramble!</div>

        {/* 이미지 힌트 */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-purple-500/30"
        >
          <img
            src={level.imageHint}
            alt="hint"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* 섞인 글자 표시 */}
        <div className="mt-6 flex gap-2">
          {scrambledLetters.map((letter, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="w-10 h-10 flex items-center justify-center bg-purple-600/30 border-2 border-purple-500 rounded-lg text-xl font-fredoka text-purple-300"
            >
              {letter.char.toUpperCase()}
            </motion.div>
          ))}
        </div>

        <div className="mt-4 text-gray-500 text-sm">
          {level.targetWord.length}글자 단어를 만드세요!
        </div>
      </div>

      {/* Player 2 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-red-400 font-bold text-lg">Player 2</div>

        {/* 드롭 슬롯 */}
        <div className="flex gap-2 p-3 bg-gray-800/50 rounded-xl">
          {player2Slots.map((slot, i) => (
            <DropSlot
              key={i}
              index={i}
              content={slot}
              onDrop={handlePlayer2Drop}
              onReturn={handlePlayer2Return}
              color="red"
            />
          ))}
        </div>

        {/* 사용 가능한 글자들 */}
        <div className="flex flex-wrap gap-2 justify-center max-w-xs">
          <AnimatePresence>
            {player2Letters.map((letter) => (
              <LetterBlock key={letter.id} letter={letter} color="red" />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ScrambleGame;
