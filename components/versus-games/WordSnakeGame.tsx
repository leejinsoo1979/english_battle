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

interface Position {
  x: number;
  y: number;
}

interface LetterItem {
  char: string;
  position: Position;
  isTarget: boolean;
  index: number;
}

const GRID_SIZE = 10;
const CELL_SIZE = 36;

const WordSnakeGame: React.FC<Props> = ({
  level,
  onPlayer1Answer,
  onPlayer2Answer,
  disabled,
}) => {
  const targetWord = level.targetWord.toUpperCase();

  // 글자 아이템 생성
  const generateLetters = useCallback((): LetterItem[] => {
    const letters: LetterItem[] = [];
    const usedPositions = new Set<string>();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 정답 글자들 배치
    targetWord.split('').forEach((char, i) => {
      let pos: Position;
      do {
        pos = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (usedPositions.has(`${pos.x},${pos.y}`));

      usedPositions.add(`${pos.x},${pos.y}`);
      letters.push({ char, position: pos, isTarget: true, index: i });
    });

    // 오답 글자들 추가
    for (let i = 0; i < 8; i++) {
      let pos: Position;
      do {
        pos = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (usedPositions.has(`${pos.x},${pos.y}`));

      usedPositions.add(`${pos.x},${pos.y}`);
      let randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
      letters.push({ char: randomChar, position: pos, isTarget: false, index: -1 });
    }

    return letters;
  }, [targetWord]);

  const [player1Snake, setPlayer1Snake] = useState<Position[]>([{ x: 0, y: 5 }]);
  const [player2Snake, setPlayer2Snake] = useState<Position[]>([{ x: GRID_SIZE - 1, y: 5 }]);
  const [player1Dir, setPlayer1Dir] = useState<Position>({ x: 1, y: 0 });
  const [player2Dir, setPlayer2Dir] = useState<Position>({ x: -1, y: 0 });
  const [player1Letters, setPlayer1Letters] = useState<LetterItem[]>([]);
  const [player2Letters, setPlayer2Letters] = useState<LetterItem[]>([]);
  const [player1Collected, setPlayer1Collected] = useState<string[]>([]);
  const [player2Collected, setPlayer2Collected] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<number>();

  // 초기화
  useEffect(() => {
    setPlayer1Snake([{ x: 0, y: 5 }]);
    setPlayer2Snake([{ x: GRID_SIZE - 1, y: 5 }]);
    setPlayer1Dir({ x: 1, y: 0 });
    setPlayer2Dir({ x: -1, y: 0 });
    setPlayer1Letters(generateLetters());
    setPlayer2Letters(generateLetters());
    setPlayer1Collected([]);
    setPlayer2Collected([]);
    setGameStarted(false);

    const timer = setTimeout(() => {
      setGameStarted(true);
      playSound('fight', 0.5);
    }, 1500);

    return () => clearTimeout(timer);
  }, [level, generateLetters]);

  // 키보드 입력
  useEffect(() => {
    if (!gameStarted || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Player 1: WASD
      if (e.key === 'w' || e.key === 'W') {
        setPlayer1Dir(prev => prev.y !== 1 ? { x: 0, y: -1 } : prev);
      }
      if (e.key === 's' || e.key === 'S') {
        setPlayer1Dir(prev => prev.y !== -1 ? { x: 0, y: 1 } : prev);
      }
      if (e.key === 'a' || e.key === 'A') {
        setPlayer1Dir(prev => prev.x !== 1 ? { x: -1, y: 0 } : prev);
      }
      if (e.key === 'd' || e.key === 'D') {
        setPlayer1Dir(prev => prev.x !== -1 ? { x: 1, y: 0 } : prev);
      }

      // Player 2: Arrow Keys
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPlayer2Dir(prev => prev.y !== 1 ? { x: 0, y: -1 } : prev);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPlayer2Dir(prev => prev.y !== -1 ? { x: 0, y: 1 } : prev);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlayer2Dir(prev => prev.x !== 1 ? { x: -1, y: 0 } : prev);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPlayer2Dir(prev => prev.x !== -1 ? { x: 1, y: 0 } : prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, disabled]);

  // 게임 루프
  useEffect(() => {
    if (!gameStarted || disabled) return;

    const moveSnake = (
      snake: Position[],
      dir: Position,
      letters: LetterItem[],
      setLetters: React.Dispatch<React.SetStateAction<LetterItem[]>>,
      collected: string[],
      setCollected: React.Dispatch<React.SetStateAction<string[]>>,
      onAnswer: (answer: string) => void
    ): Position[] => {
      const head = snake[0];
      const newHead = {
        x: (head.x + dir.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + dir.y + GRID_SIZE) % GRID_SIZE,
      };

      // 글자 먹기 체크
      const eatenLetter = letters.find(
        l => l.position.x === newHead.x && l.position.y === newHead.y
      );

      if (eatenLetter) {
        const nextIndex = collected.length;

        if (eatenLetter.isTarget && eatenLetter.index === nextIndex) {
          // 정답 순서대로 먹음!
          playSound('pop', 0.3);
          setCollected(prev => [...prev, eatenLetter.char]);
          setLetters(prev => prev.filter(l => l !== eatenLetter));

          // 단어 완성 체크
          if (nextIndex + 1 === targetWord.length) {
            setTimeout(() => {
              playSound('fanfare', 0.5);
              onAnswer(targetWord);
            }, 100);
          }

          // 뱀 길이 증가
          return [newHead, ...snake];
        } else {
          // 틀린 글자 또는 순서 오류
          playSound('wrong', 0.2);
          setLetters(prev => prev.filter(l => l !== eatenLetter));
          // 뱀 길이 감소 (최소 1)
          return snake.length > 1 ? [newHead, ...snake.slice(0, -1)] : [newHead];
        }
      }

      // 일반 이동
      return [newHead, ...snake.slice(0, -1)];
    };

    const interval = setInterval(() => {
      setPlayer1Snake(prev =>
        moveSnake(prev, player1Dir, player1Letters, setPlayer1Letters, player1Collected, setPlayer1Collected, onPlayer1Answer)
      );
      setPlayer2Snake(prev =>
        moveSnake(prev, player2Dir, player2Letters, setPlayer2Letters, player2Collected, setPlayer2Collected, onPlayer2Answer)
      );
    }, 200);

    return () => clearInterval(interval);
  }, [gameStarted, disabled, player1Dir, player2Dir, player1Letters, player2Letters, player1Collected, player2Collected, targetWord, onPlayer1Answer, onPlayer2Answer]);

  // 그리드 렌더링
  const renderGrid = (
    snake: Position[],
    letters: LetterItem[],
    collected: string[],
    color: 'blue' | 'red'
  ) => (
    <div
      className="relative bg-gray-900/50 rounded-xl overflow-hidden"
      style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
    >
      {/* 그리드 라인 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      />

      {/* 글자 아이템들 */}
      {letters.map((letter, i) => {
        const nextIndex = collected.length;
        const isNextTarget = letter.isTarget && letter.index === nextIndex;

        return (
          <motion.div
            key={`letter-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute flex items-center justify-center rounded-lg font-fredoka text-lg ${
              isNextTarget
                ? 'bg-yellow-500 text-white animate-pulse shadow-lg shadow-yellow-500/50'
                : letter.isTarget
                  ? 'bg-green-600/80 text-white'
                  : 'bg-gray-600 text-gray-300'
            }`}
            style={{
              left: letter.position.x * CELL_SIZE + 2,
              top: letter.position.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
          >
            {letter.char}
          </motion.div>
        );
      })}

      {/* 뱀 */}
      {snake.map((pos, i) => (
        <motion.div
          key={`snake-${i}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute rounded-lg ${
            i === 0
              ? color === 'blue'
                ? 'bg-blue-500 shadow-lg shadow-blue-500/50'
                : 'bg-red-500 shadow-lg shadow-red-500/50'
              : color === 'blue'
                ? 'bg-blue-700'
                : 'bg-red-700'
          }`}
          style={{
            left: pos.x * CELL_SIZE + 2,
            top: pos.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
          }}
        >
          {i === 0 && (
            <div className="w-full h-full flex items-center justify-center text-white text-lg">
              {color === 'blue' ? '🔵' : '🔴'}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="relative w-full h-full flex">
      {/* Player 1 영역 */}
      <div className="w-2/5 h-full flex flex-col items-center justify-center p-4 bg-blue-950/30">
        <div className="text-blue-400 font-bold text-lg mb-2">Player 1</div>
        <div className="text-xs text-blue-300 mb-3">WASD로 이동</div>

        {/* 진행도 */}
        <div className="flex gap-1 mb-4">
          {targetWord.split('').map((char, i) => (
            <div
              key={i}
              className={`w-8 h-10 flex items-center justify-center rounded-lg border-2 font-bold ${
                player1Collected[i]
                  ? 'border-green-500 bg-green-500/30 text-green-400'
                  : i === player1Collected.length
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400 animate-pulse'
                    : 'border-blue-500/50 bg-gray-800/50 text-gray-500'
              }`}
            >
              {player1Collected[i] || (i === player1Collected.length ? '?' : '_')}
            </div>
          ))}
        </div>

        {renderGrid(player1Snake, player1Letters, player1Collected, 'blue')}
      </div>

      {/* 중앙 힌트 */}
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-black/40 border-x border-gray-700/50">
        <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">Word Snake!</div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-36 h-36 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-yellow-500/30"
        >
          <img src={level.imageHint} alt="hint" className="w-full h-full object-cover" />
        </motion.div>

        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
          <div className="text-gray-400 text-sm mb-2 text-center">규칙</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>🐍 뱀을 움직여 글자를 먹어라</div>
            <div>✨ 노란색 = 다음 글자</div>
            <div>⚠️ 순서 틀리면 길이 감소!</div>
          </div>
        </div>

        <div className="mt-4 text-2xl font-fredoka text-yellow-400">
          {targetWord.length}글자
        </div>
      </div>

      {/* Player 2 영역 */}
      <div className="w-2/5 h-full flex flex-col items-center justify-center p-4 bg-red-950/30">
        <div className="text-red-400 font-bold text-lg mb-2">Player 2</div>
        <div className="text-xs text-red-300 mb-3">화살표로 이동</div>

        {/* 진행도 */}
        <div className="flex gap-1 mb-4">
          {targetWord.split('').map((char, i) => (
            <div
              key={i}
              className={`w-8 h-10 flex items-center justify-center rounded-lg border-2 font-bold ${
                player2Collected[i]
                  ? 'border-green-500 bg-green-500/30 text-green-400'
                  : i === player2Collected.length
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400 animate-pulse'
                    : 'border-red-500/50 bg-gray-800/50 text-gray-500'
              }`}
            >
              {player2Collected[i] || (i === player2Collected.length ? '?' : '_')}
            </div>
          ))}
        </div>

        {renderGrid(player2Snake, player2Letters, player2Collected, 'red')}
      </div>
    </div>
  );
};

export default WordSnakeGame;
