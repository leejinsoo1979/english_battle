import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizLevel } from '../../types';
import { playSound } from '../../utils/sounds';

interface Props {
  level: QuizLevel;
  onPlayer1Answer: (answer: string) => void;
  onPlayer2Answer: (answer: string) => void;
  disabled: boolean;
}

const SpeedTypingGame: React.FC<Props> = ({
  level,
  onPlayer1Answer,
  onPlayer2Answer,
  disabled,
}) => {
  const [player1Input, setPlayer1Input] = useState('');
  const [player2Input, setPlayer2Input] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const player1Ref = useRef<HTMLInputElement>(null);
  const player2Ref = useRef<HTMLInputElement>(null);

  // 카운트다운 후 게임 시작
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 1) {
          playSound('fight', 0.5);
        } else {
          playSound('pop', 0.3);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!gameStarted) {
      setGameStarted(true);
      setShowWord(true);
    }
  }, [countdown, gameStarted]);

  // 입력 처리
  useEffect(() => {
    if (!gameStarted || disabled) return;

    // Player 1 정답 체크
    if (player1Input.toLowerCase() === level.targetWord.toLowerCase()) {
      playSound('fanfare', 0.5);
      onPlayer1Answer(player1Input);
    }

    // Player 2 정답 체크
    if (player2Input.toLowerCase() === level.targetWord.toLowerCase()) {
      playSound('fanfare', 0.5);
      onPlayer2Answer(player2Input);
    }
  }, [player1Input, player2Input, level.targetWord, gameStarted, disabled, onPlayer1Answer, onPlayer2Answer]);

  // 키보드 포커스
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || !gameStarted) return;

      if ((e.key === 'q' || e.key === 'Q') && document.activeElement !== player1Ref.current) {
        e.preventDefault();
        player1Ref.current?.focus();
      }
      if ((e.key === 'p' || e.key === 'P') && document.activeElement !== player2Ref.current) {
        e.preventDefault();
        player2Ref.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, gameStarted]);

  // 레벨 변경 시 리셋
  useEffect(() => {
    setPlayer1Input('');
    setPlayer2Input('');
    setCountdown(3);
    setGameStarted(false);
    setShowWord(false);
  }, [level]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* 카운트다운 */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 z-50"
          >
            <motion.span
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-9xl font-fredoka text-yellow-400"
              style={{ textShadow: '0 0 40px rgba(250, 204, 21, 0.8)' }}
            >
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 게임 영역 */}
      <div className="flex w-full h-full">
        {/* Player 1 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-sm text-blue-300 mb-2">Q키로 입력</div>
          <input
            ref={player1Ref}
            type="text"
            value={player1Input}
            onChange={(e) => setPlayer1Input(e.target.value)}
            disabled={disabled || !gameStarted}
            placeholder="단어를 입력하세요"
            className="w-full max-w-xs px-4 py-3 text-xl text-center border-2 border-blue-500 rounded-xl focus:border-blue-400 focus:outline-none disabled:bg-gray-700 bg-gray-800 text-white placeholder-gray-500"
            autoComplete="off"
          />
          {/* 진행도 표시 */}
          {gameStarted && (
            <div className="mt-4 flex gap-1">
              {level.targetWord.split('').map((char, i) => (
                <div
                  key={i}
                  className={`w-8 h-10 flex items-center justify-center rounded border-2 font-bold text-lg ${
                    player1Input[i]?.toLowerCase() === char.toLowerCase()
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : player1Input[i]
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-gray-600 bg-gray-800 text-gray-500'
                  }`}
                >
                  {player1Input[i] || '_'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 중앙 - 타이핑할 단어 */}
        <div className="flex-1 flex flex-col items-center justify-center border-x border-gray-700/30 bg-black/20">
          <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">Type this word!</div>

          <AnimatePresence>
            {showWord && (
              <motion.div
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="relative"
              >
                {/* 이미지 힌트 */}
                <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl mb-6 ring-4 ring-yellow-500/30 mx-auto">
                  <img
                    src={level.imageHint}
                    alt="hint"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 단어 표시 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl md:text-6xl font-fredoka text-yellow-400 text-center tracking-wider"
                  style={{
                    textShadow: '0 0 30px rgba(250, 204, 21, 0.6), 4px 4px 0 rgba(180, 83, 9, 0.8)',
                  }}
                >
                  {level.targetWord.toUpperCase()}
                </motion.div>

                {/* 글자 수 */}
                <div className="text-center mt-4 text-gray-400">
                  {level.targetWord.length}글자
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player 2 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-sm text-red-300 mb-2">P키로 입력</div>
          <input
            ref={player2Ref}
            type="text"
            value={player2Input}
            onChange={(e) => setPlayer2Input(e.target.value)}
            disabled={disabled || !gameStarted}
            placeholder="단어를 입력하세요"
            className="w-full max-w-xs px-4 py-3 text-xl text-center border-2 border-red-500 rounded-xl focus:border-red-400 focus:outline-none disabled:bg-gray-700 bg-gray-800 text-white placeholder-gray-500"
            autoComplete="off"
          />
          {/* 진행도 표시 */}
          {gameStarted && (
            <div className="mt-4 flex gap-1">
              {level.targetWord.split('').map((char, i) => (
                <div
                  key={i}
                  className={`w-8 h-10 flex items-center justify-center rounded border-2 font-bold text-lg ${
                    player2Input[i]?.toLowerCase() === char.toLowerCase()
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : player2Input[i]
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-gray-600 bg-gray-800 text-gray-500'
                  }`}
                >
                  {player2Input[i] || '_'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeedTypingGame;
