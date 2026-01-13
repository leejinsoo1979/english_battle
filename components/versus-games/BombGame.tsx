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

const BombGame: React.FC<Props> = ({
  level,
  onPlayer1Answer,
  onPlayer2Answer,
  disabled,
}) => {
  const targetWord = level.targetWord.toUpperCase();
  const INITIAL_TIME = 15; // 15초

  const [player1Input, setPlayer1Input] = useState('');
  const [player2Input, setPlayer2Input] = useState('');
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [gameStarted, setGameStarted] = useState(false);
  const [player1Exploded, setPlayer1Exploded] = useState(false);
  const [player2Exploded, setPlayer2Exploded] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const player1Ref = useRef<HTMLInputElement>(null);
  const player2Ref = useRef<HTMLInputElement>(null);

  // 카운트다운
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        playSound('pop', 0.3);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown) {
      setShowCountdown(false);
      setGameStarted(true);
      playSound('fight', 0.5);
    }
  }, [countdown, showCountdown]);

  // 타이머
  useEffect(() => {
    if (!gameStarted || disabled) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 시간 초과 - 폭발!
          if (!player1Exploded && player1Input.toUpperCase() !== targetWord) {
            setPlayer1Exploded(true);
          }
          if (!player2Exploded && player2Input.toUpperCase() !== targetWord) {
            setPlayer2Exploded(true);
          }
          playSound('wrong', 0.5);
          return 0;
        }
        // 긴박한 틱 사운드
        if (prev <= 5) {
          playSound('pop', 0.1);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, disabled, player1Input, player2Input, targetWord, player1Exploded, player2Exploded]);

  // 입력 체크
  useEffect(() => {
    if (!gameStarted || disabled) return;

    // Player 1 정답 체크
    if (player1Input.toUpperCase() === targetWord && !player1Exploded) {
      playSound('fanfare', 0.5);
      onPlayer1Answer(targetWord);
    }

    // Player 2 정답 체크
    if (player2Input.toUpperCase() === targetWord && !player2Exploded) {
      playSound('fanfare', 0.5);
      onPlayer2Answer(targetWord);
    }
  }, [player1Input, player2Input, targetWord, gameStarted, disabled, player1Exploded, player2Exploded, onPlayer1Answer, onPlayer2Answer]);

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
    setTimeLeft(INITIAL_TIME);
    setGameStarted(false);
    setPlayer1Exploded(false);
    setPlayer2Exploded(false);
    setShowCountdown(true);
    setCountdown(3);
  }, [level]);

  // 타이머 색상
  const getTimerColor = () => {
    if (timeLeft <= 3) return 'text-red-500';
    if (timeLeft <= 7) return 'text-orange-500';
    return 'text-yellow-400';
  };

  // 폭탄 애니메이션 강도
  const getBombShake = () => {
    if (timeLeft <= 3) return { x: [-5, 5, -5, 5, 0], transition: { repeat: Infinity, duration: 0.2 } };
    if (timeLeft <= 7) return { x: [-2, 2, -2, 2, 0], transition: { repeat: Infinity, duration: 0.3 } };
    return {};
  };

  return (
    <div className="relative w-full h-full flex">
      {/* 카운트다운 오버레이 */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
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

      {/* Player 1 영역 */}
      <div className={`w-2/5 h-full flex flex-col items-center justify-center p-6 ${
        player1Exploded ? 'bg-red-900/50' : 'bg-blue-950/30'
      }`}>
        <div className="text-blue-400 font-bold text-lg mb-2">Player 1</div>
        <div className="text-xs text-blue-300 mb-4">Q키로 포커스</div>

        {player1Exploded ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl"
          >
            💥
          </motion.div>
        ) : (
          <>
            <input
              ref={player1Ref}
              type="text"
              value={player1Input}
              onChange={(e) => setPlayer1Input(e.target.value)}
              disabled={disabled || !gameStarted || player1Exploded}
              placeholder="단어 입력!"
              className="w-full max-w-[220px] px-4 py-3 text-2xl text-center border-3 border-blue-500 rounded-xl focus:border-blue-400 focus:outline-none disabled:bg-gray-700 bg-gray-900 text-white placeholder-gray-500 font-fredoka"
              autoComplete="off"
            />

            {/* 진행도 */}
            <div className="mt-6 flex gap-1 flex-wrap justify-center">
              {targetWord.split('').map((char, i) => (
                <div
                  key={i}
                  className={`w-10 h-12 flex items-center justify-center rounded-lg border-2 font-bold text-xl ${
                    player1Input[i]?.toUpperCase() === char
                      ? 'border-green-500 bg-green-500/30 text-green-400'
                      : player1Input[i]
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-blue-600/50 bg-gray-800/50 text-gray-500'
                  }`}
                >
                  {player1Input[i]?.toUpperCase() || '_'}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 중앙 - 폭탄 & 타이머 */}
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-black/40 border-x border-gray-700/50">
        <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">Beat the Bomb!</div>

        {/* 이미지 힌트 */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-36 h-36 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-yellow-500/30 mb-6"
        >
          <img src={level.imageHint} alt="hint" className="w-full h-full object-cover" />
        </motion.div>

        {/* 폭탄 */}
        <motion.div
          animate={getBombShake()}
          className="relative"
        >
          <div className={`text-8xl ${timeLeft <= 3 ? 'animate-pulse' : ''}`}>
            💣
          </div>

          {/* 심지 불꽃 */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{ repeat: Infinity, duration: 0.3 }}
            className="absolute -top-2 right-2 text-3xl"
          >
            🔥
          </motion.div>
        </motion.div>

        {/* 타이머 */}
        <motion.div
          animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className={`mt-6 text-7xl font-fredoka ${getTimerColor()}`}
          style={{
            textShadow: timeLeft <= 5 ? '0 0 30px rgba(239, 68, 68, 0.8)' : 'none',
          }}
        >
          {timeLeft}
        </motion.div>

        <div className="mt-2 text-gray-500 text-lg">초</div>

        {/* 긴급 경고 */}
        <AnimatePresence>
          {timeLeft <= 5 && timeLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 px-4 py-2 bg-red-600/30 border border-red-500 rounded-lg"
            >
              <span className="text-red-400 font-bold animate-pulse">⚠️ 서둘러!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player 2 영역 */}
      <div className={`w-2/5 h-full flex flex-col items-center justify-center p-6 ${
        player2Exploded ? 'bg-red-900/50' : 'bg-red-950/30'
      }`}>
        <div className="text-red-400 font-bold text-lg mb-2">Player 2</div>
        <div className="text-xs text-red-300 mb-4">P키로 포커스</div>

        {player2Exploded ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl"
          >
            💥
          </motion.div>
        ) : (
          <>
            <input
              ref={player2Ref}
              type="text"
              value={player2Input}
              onChange={(e) => setPlayer2Input(e.target.value)}
              disabled={disabled || !gameStarted || player2Exploded}
              placeholder="단어 입력!"
              className="w-full max-w-[220px] px-4 py-3 text-2xl text-center border-3 border-red-500 rounded-xl focus:border-red-400 focus:outline-none disabled:bg-gray-700 bg-gray-900 text-white placeholder-gray-500 font-fredoka"
              autoComplete="off"
            />

            {/* 진행도 */}
            <div className="mt-6 flex gap-1 flex-wrap justify-center">
              {targetWord.split('').map((char, i) => (
                <div
                  key={i}
                  className={`w-10 h-12 flex items-center justify-center rounded-lg border-2 font-bold text-xl ${
                    player2Input[i]?.toUpperCase() === char
                      ? 'border-green-500 bg-green-500/30 text-green-400'
                      : player2Input[i]
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-red-600/50 bg-gray-800/50 text-gray-500'
                  }`}
                >
                  {player2Input[i]?.toUpperCase() || '_'}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BombGame;
