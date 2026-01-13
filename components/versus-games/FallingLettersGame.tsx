import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizLevel } from '../../types';
import { playSound } from '../../utils/sounds';

interface Props {
  level: QuizLevel;
  onPlayer1Answer: (answer: string) => void;
  onPlayer2Answer: (answer: string) => void;
  disabled: boolean;
}

interface FallingLetter {
  id: string;
  char: string;
  x: number;
  y: number;
  speed: number;
  isCorrect: boolean;
  targetIndex: number;
}

const FallingLettersGame: React.FC<Props> = ({
  level,
  onPlayer1Answer,
  onPlayer2Answer,
  disabled,
}) => {
  const [player1Letters, setPlayer1Letters] = useState<FallingLetter[]>([]);
  const [player2Letters, setPlayer2Letters] = useState<FallingLetter[]>([]);
  const [player1Progress, setPlayer1Progress] = useState<string[]>([]);
  const [player2Progress, setPlayer2Progress] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();
  const spawnIntervalRef = useRef<number>();

  const targetWord = level.targetWord.toUpperCase();

  // 랜덤 글자 생성 (정답 + 오답 혼합)
  const generateLetter = useCallback((player: 1 | 2): FallingLetter => {
    const progress = player === 1 ? player1Progress : player2Progress;
    const nextIndex = progress.length;
    const isCorrect = Math.random() < 0.4; // 40% 확률로 정답

    let char: string;
    if (isCorrect && nextIndex < targetWord.length) {
      char = targetWord[nextIndex];
    } else {
      // 랜덤 오답 글자
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      char = alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return {
      id: `${player}-${Date.now()}-${Math.random()}`,
      char,
      x: Math.random() * 80 + 10, // 10% ~ 90%
      y: -10,
      speed: 1 + Math.random() * 1.5,
      isCorrect: nextIndex < targetWord.length && char === targetWord[nextIndex],
      targetIndex: nextIndex,
    };
  }, [targetWord, player1Progress, player2Progress]);

  // 게임 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      setGameStarted(true);
      playSound('fight', 0.5);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 글자 스폰
  useEffect(() => {
    if (!gameStarted || disabled) return;

    spawnIntervalRef.current = window.setInterval(() => {
      setPlayer1Letters(prev => [...prev, generateLetter(1)]);
      setPlayer2Letters(prev => [...prev, generateLetter(2)]);
    }, 800);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [gameStarted, disabled, generateLetter]);

  // 게임 루프 - 글자 이동
  useEffect(() => {
    if (!gameStarted || disabled) return;

    const gameLoop = () => {
      setPlayer1Letters(prev =>
        prev
          .map(letter => ({ ...letter, y: letter.y + letter.speed }))
          .filter(letter => letter.y < 110)
      );
      setPlayer2Letters(prev =>
        prev
          .map(letter => ({ ...letter, y: letter.y + letter.speed }))
          .filter(letter => letter.y < 110)
      );
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, disabled]);

  // 글자 클릭 처리
  const handleLetterClick = (letterId: string, player: 1 | 2) => {
    if (disabled) return;

    const letters = player === 1 ? player1Letters : player2Letters;
    const setLetters = player === 1 ? setPlayer1Letters : setPlayer2Letters;
    const progress = player === 1 ? player1Progress : player2Progress;
    const setProgress = player === 1 ? setPlayer1Progress : setPlayer2Progress;

    const letter = letters.find(l => l.id === letterId);
    if (!letter) return;

    const nextIndex = progress.length;

    if (letter.char === targetWord[nextIndex]) {
      // 정답!
      playSound('pop', 0.3);
      setProgress(prev => [...prev, letter.char]);
      setLetters(prev => prev.filter(l => l.id !== letterId));

      // 단어 완성 체크
      if (nextIndex + 1 === targetWord.length) {
        playSound('fanfare', 0.5);
        if (player === 1) {
          onPlayer1Answer(targetWord);
        } else {
          onPlayer2Answer(targetWord);
        }
      }
    } else {
      // 오답
      playSound('wrong', 0.3);
      setLetters(prev => prev.filter(l => l.id !== letterId));
    }
  };

  // 레벨 변경 시 리셋
  useEffect(() => {
    setPlayer1Letters([]);
    setPlayer2Letters([]);
    setPlayer1Progress([]);
    setPlayer2Progress([]);
    setGameStarted(false);
  }, [level]);

  return (
    <div className="relative w-full h-full flex">
      {/* Player 1 영역 */}
      <div className="w-2/5 h-full relative bg-blue-950/30 overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-blue-400 font-bold text-lg z-10">
          Player 1
        </div>

        {/* 진행도 표시 */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {targetWord.split('').map((char, i) => (
            <div
              key={i}
              className={`w-10 h-12 flex items-center justify-center rounded-lg border-2 font-bold text-xl ${
                player1Progress[i]
                  ? 'border-green-500 bg-green-500/30 text-green-400'
                  : 'border-blue-500/50 bg-gray-800/50 text-gray-500'
              }`}
            >
              {player1Progress[i] || '_'}
            </div>
          ))}
        </div>

        {/* 떨어지는 글자들 */}
        <AnimatePresence>
          {player1Letters.map(letter => (
            <motion.button
              key={letter.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => handleLetterClick(letter.id, 1)}
              className="absolute w-14 h-14 flex items-center justify-center rounded-xl font-fredoka text-2xl cursor-pointer bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform border-2 border-blue-400"
              style={{
                left: `${letter.x}%`,
                top: `${letter.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {letter.char}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* 바닥 경고선 */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-red-500/50 to-transparent" />
      </div>

      {/* 중앙 - 힌트 */}
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-black/40 border-x border-gray-700/50">
        <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">Catch Letters!</div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-yellow-500/30"
        >
          <img
            src={level.imageHint}
            alt="hint"
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="mt-6 text-3xl font-fredoka text-yellow-400 tracking-wider">
          {targetWord.split('').map((char, i) => (
            <span key={i} className="mx-1">_</span>
          ))}
        </div>
        <div className="mt-2 text-gray-500">{targetWord.length}글자</div>

        <div className="mt-8 text-gray-400 text-sm text-center">
          <div>떨어지는 글자를 순서대로 클릭!</div>
          <div className="text-yellow-500 mt-1">틀린 글자 주의!</div>
        </div>
      </div>

      {/* Player 2 영역 */}
      <div className="w-2/5 h-full relative bg-red-950/30 overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-red-400 font-bold text-lg z-10">
          Player 2
        </div>

        {/* 진행도 표시 */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {targetWord.split('').map((char, i) => (
            <div
              key={i}
              className={`w-10 h-12 flex items-center justify-center rounded-lg border-2 font-bold text-xl ${
                player2Progress[i]
                  ? 'border-green-500 bg-green-500/30 text-green-400'
                  : 'border-red-500/50 bg-gray-800/50 text-gray-500'
              }`}
            >
              {player2Progress[i] || '_'}
            </div>
          ))}
        </div>

        {/* 떨어지는 글자들 */}
        <AnimatePresence>
          {player2Letters.map(letter => (
            <motion.button
              key={letter.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => handleLetterClick(letter.id, 2)}
              className="absolute w-14 h-14 flex items-center justify-center rounded-xl font-fredoka text-2xl cursor-pointer bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 hover:scale-110 transition-transform border-2 border-red-400"
              style={{
                left: `${letter.x}%`,
                top: `${letter.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {letter.char}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* 바닥 경고선 */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-red-500/50 to-transparent" />
      </div>
    </div>
  );
};

export default FallingLettersGame;
