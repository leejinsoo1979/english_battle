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

interface Balloon {
  id: string;
  char: string;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  color: string;
}

const COLORS = [
  'from-pink-500 to-rose-600',
  'from-purple-500 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-green-500 to-emerald-600',
  'from-yellow-500 to-orange-600',
];

const WordShooterGame: React.FC<Props> = ({
  level,
  onPlayer1Answer,
  onPlayer2Answer,
  disabled,
}) => {
  const [player1Balloons, setPlayer1Balloons] = useState<Balloon[]>([]);
  const [player2Balloons, setPlayer2Balloons] = useState<Balloon[]>([]);
  const [player1Progress, setPlayer1Progress] = useState<string[]>([]);
  const [player2Progress, setPlayer2Progress] = useState<string[]>([]);
  const [player1Crosshair, setPlayer1Crosshair] = useState({ x: 50, y: 50 });
  const [player2Crosshair, setPlayer2Crosshair] = useState({ x: 50, y: 50 });
  const [gameStarted, setGameStarted] = useState(false);
  const [explosions, setExplosions] = useState<{ id: string; x: number; y: number; color: string }[]>([]);
  const gameLoopRef = useRef<number>();
  const player1AreaRef = useRef<HTMLDivElement>(null);
  const player2AreaRef = useRef<HTMLDivElement>(null);

  const targetWord = level.targetWord.toUpperCase();

  // 풍선 생성
  const generateBalloons = useCallback(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const balloons: Balloon[] = [];

    // 정답 글자들
    targetWord.split('').forEach((char, i) => {
      balloons.push({
        id: `correct-${i}-${Date.now()}`,
        char,
        x: Math.random() * 70 + 15,
        y: Math.random() * 60 + 20,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        color: COLORS[i % COLORS.length],
      });
    });

    // 오답 글자들 추가
    for (let i = 0; i < 5; i++) {
      let randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
      while (targetWord.includes(randomChar)) {
        randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      balloons.push({
        id: `wrong-${i}-${Date.now()}`,
        char: randomChar,
        x: Math.random() * 70 + 15,
        y: Math.random() * 60 + 20,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        color: 'from-gray-500 to-gray-700',
      });
    }

    return balloons.sort(() => Math.random() - 0.5);
  }, [targetWord]);

  // 게임 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      setGameStarted(true);
      setPlayer1Balloons(generateBalloons());
      setPlayer2Balloons(generateBalloons());
      playSound('fight', 0.5);
    }, 1000);
    return () => clearTimeout(timer);
  }, [generateBalloons]);

  // 풍선 이동 게임 루프
  useEffect(() => {
    if (!gameStarted || disabled) return;

    const gameLoop = () => {
      const moveBalloon = (balloon: Balloon): Balloon => {
        let newX = balloon.x + balloon.speedX;
        let newY = balloon.y + balloon.speedY;
        let newSpeedX = balloon.speedX;
        let newSpeedY = balloon.speedY;

        // 벽 충돌
        if (newX < 5 || newX > 95) {
          newSpeedX = -newSpeedX;
          newX = Math.max(5, Math.min(95, newX));
        }
        if (newY < 5 || newY > 85) {
          newSpeedY = -newSpeedY;
          newY = Math.max(5, Math.min(85, newY));
        }

        return { ...balloon, x: newX, y: newY, speedX: newSpeedX, speedY: newSpeedY };
      };

      setPlayer1Balloons(prev => prev.map(moveBalloon));
      setPlayer2Balloons(prev => prev.map(moveBalloon));
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, disabled]);

  // 키보드 조작
  useEffect(() => {
    if (!gameStarted || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 5;

      // Player 1: WASD + Space
      if (e.key === 'w' || e.key === 'W') {
        setPlayer1Crosshair(prev => ({ ...prev, y: Math.max(5, prev.y - speed) }));
      }
      if (e.key === 's' || e.key === 'S') {
        setPlayer1Crosshair(prev => ({ ...prev, y: Math.min(95, prev.y + speed) }));
      }
      if (e.key === 'a' || e.key === 'A') {
        setPlayer1Crosshair(prev => ({ ...prev, x: Math.max(5, prev.x - speed) }));
      }
      if (e.key === 'd' || e.key === 'D') {
        setPlayer1Crosshair(prev => ({ ...prev, x: Math.min(95, prev.x + speed) }));
      }
      if (e.key === ' ' || e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        shootBalloon(1);
      }

      // Player 2: Arrow keys + Enter
      if (e.key === 'ArrowUp') {
        setPlayer2Crosshair(prev => ({ ...prev, y: Math.max(5, prev.y - speed) }));
      }
      if (e.key === 'ArrowDown') {
        setPlayer2Crosshair(prev => ({ ...prev, y: Math.min(95, prev.y + speed) }));
      }
      if (e.key === 'ArrowLeft') {
        setPlayer2Crosshair(prev => ({ ...prev, x: Math.max(5, prev.x - speed) }));
      }
      if (e.key === 'ArrowRight') {
        setPlayer2Crosshair(prev => ({ ...prev, x: Math.min(95, prev.x + speed) }));
      }
      if (e.key === 'Enter' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        shootBalloon(2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, disabled, player1Crosshair, player2Crosshair, player1Balloons, player2Balloons, player1Progress, player2Progress]);

  // 풍선 쏘기
  const shootBalloon = (player: 1 | 2) => {
    const crosshair = player === 1 ? player1Crosshair : player2Crosshair;
    const balloons = player === 1 ? player1Balloons : player2Balloons;
    const setBalloons = player === 1 ? setPlayer1Balloons : setPlayer2Balloons;
    const progress = player === 1 ? player1Progress : player2Progress;
    const setProgress = player === 1 ? setPlayer1Progress : setPlayer2Progress;

    // 조준점 근처 풍선 찾기
    const hitBalloon = balloons.find(
      balloon =>
        Math.abs(balloon.x - crosshair.x) < 12 &&
        Math.abs(balloon.y - crosshair.y) < 12
    );

    if (!hitBalloon) {
      playSound('pop', 0.1);
      return;
    }

    const nextIndex = progress.length;
    const nextChar = targetWord[nextIndex];

    // 폭발 효과
    setExplosions(prev => [...prev, { id: hitBalloon.id, x: hitBalloon.x, y: hitBalloon.y, color: hitBalloon.color }]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== hitBalloon.id));
    }, 500);

    if (hitBalloon.char === nextChar) {
      // 정답!
      playSound('pop', 0.4);
      setProgress(prev => [...prev, hitBalloon.char]);
      setBalloons(prev => prev.filter(b => b.id !== hitBalloon.id));

      // 단어 완성
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
      setBalloons(prev => prev.filter(b => b.id !== hitBalloon.id));
    }
  };

  // 레벨 변경 시 리셋
  useEffect(() => {
    setPlayer1Balloons([]);
    setPlayer2Balloons([]);
    setPlayer1Progress([]);
    setPlayer2Progress([]);
    setPlayer1Crosshair({ x: 50, y: 50 });
    setPlayer2Crosshair({ x: 50, y: 50 });
    setGameStarted(false);
    setExplosions([]);
  }, [level]);

  return (
    <div className="relative w-full h-full flex">
      {/* Player 1 영역 */}
      <div ref={player1AreaRef} className="w-2/5 h-full relative bg-blue-950/30 overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="text-blue-400 font-bold text-lg text-center">Player 1</div>
          <div className="text-xs text-blue-300 mt-1">WASD 이동 / Space 발사</div>
        </div>

        {/* 진행도 */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {targetWord.split('').map((char, i) => (
            <div
              key={i}
              className={`w-8 h-10 flex items-center justify-center rounded-lg border-2 font-bold text-lg ${
                player1Progress[i]
                  ? 'border-green-500 bg-green-500/30 text-green-400'
                  : i === player1Progress.length
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400 animate-pulse'
                    : 'border-blue-500/50 bg-gray-800/50 text-gray-500'
              }`}
            >
              {player1Progress[i] || (i === player1Progress.length ? '?' : '_')}
            </div>
          ))}
        </div>

        {/* 풍선들 */}
        <AnimatePresence>
          {player1Balloons.map(balloon => (
            <motion.div
              key={balloon.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`absolute w-14 h-16 flex items-center justify-center rounded-full font-fredoka text-xl text-white shadow-lg bg-gradient-to-br ${balloon.color}`}
              style={{
                left: `${balloon.x}%`,
                top: `${balloon.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {balloon.char}
              {/* 풍선 꼬리 */}
              <div className="absolute -bottom-3 w-1 h-4 bg-gray-400 rounded-full" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 조준점 */}
        <motion.div
          className="absolute w-12 h-12 pointer-events-none z-30"
          style={{
            left: `${player1Crosshair.x}%`,
            top: `${player1Crosshair.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-full h-full border-4 border-blue-400 rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-400" />
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-blue-400" />
        </motion.div>

        {/* 폭발 효과 */}
        <AnimatePresence>
          {explosions.filter(e => e.id.includes('correct') || player1Balloons.some(b => b.id === e.id) || true).map(exp => (
            <motion.div
              key={`exp-${exp.id}`}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute w-8 h-8 rounded-full bg-gradient-to-br ${exp.color}`}
              style={{
                left: `${exp.x}%`,
                top: `${exp.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 중앙 힌트 */}
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-black/40 border-x border-gray-700/50">
        <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">Shoot Balloons!</div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-yellow-500/30"
        >
          <img src={level.imageHint} alt="hint" className="w-full h-full object-cover" />
        </motion.div>

        <div className="mt-6 text-2xl font-fredoka text-yellow-400 tracking-wider">
          {targetWord.length}글자
        </div>

        <div className="mt-6 text-gray-400 text-sm text-center">
          <div className="text-yellow-500">순서대로 쏴라!</div>
        </div>
      </div>

      {/* Player 2 영역 */}
      <div ref={player2AreaRef} className="w-2/5 h-full relative bg-red-950/30 overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="text-red-400 font-bold text-lg text-center">Player 2</div>
          <div className="text-xs text-red-300 mt-1">화살표 이동 / Enter 발사</div>
        </div>

        {/* 진행도 */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {targetWord.split('').map((char, i) => (
            <div
              key={i}
              className={`w-8 h-10 flex items-center justify-center rounded-lg border-2 font-bold text-lg ${
                player2Progress[i]
                  ? 'border-green-500 bg-green-500/30 text-green-400'
                  : i === player2Progress.length
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400 animate-pulse'
                    : 'border-red-500/50 bg-gray-800/50 text-gray-500'
              }`}
            >
              {player2Progress[i] || (i === player2Progress.length ? '?' : '_')}
            </div>
          ))}
        </div>

        {/* 풍선들 */}
        <AnimatePresence>
          {player2Balloons.map(balloon => (
            <motion.div
              key={balloon.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`absolute w-14 h-16 flex items-center justify-center rounded-full font-fredoka text-xl text-white shadow-lg bg-gradient-to-br ${balloon.color}`}
              style={{
                left: `${balloon.x}%`,
                top: `${balloon.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {balloon.char}
              <div className="absolute -bottom-3 w-1 h-4 bg-gray-400 rounded-full" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 조준점 */}
        <motion.div
          className="absolute w-12 h-12 pointer-events-none z-30"
          style={{
            left: `${player2Crosshair.x}%`,
            top: `${player2Crosshair.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-full h-full border-4 border-red-400 rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-400" />
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-red-400" />
        </motion.div>
      </div>
    </div>
  );
};

export default WordShooterGame;
