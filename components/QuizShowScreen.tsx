
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/sounds';

// 퀴즈 문제 타입
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
}

// 플레이어 타입
interface QuizPlayer {
  id: number;
  name: string;
  score: number;
  avatar: string;
  color: string;
  isAnswering: boolean;
  lastAnswer: number | null;
  isCorrect: boolean | null;
  streak: number;
}

// 샘플 퀴즈 문제
const SAMPLE_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2,
    category: "Geography",
    difficulty: "easy"
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    category: "Science",
    difficulty: "easy"
  },
  {
    id: 3,
    question: "What is 15 × 8?",
    options: ["100", "110", "120", "130"],
    correctIndex: 2,
    category: "Math",
    difficulty: "medium"
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"],
    correctIndex: 2,
    category: "Art",
    difficulty: "easy"
  },
  {
    id: 5,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctIndex: 3,
    category: "Geography",
    difficulty: "easy"
  },
];

// 아바타 옵션
const AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffd5dc",
];

const PLAYER_COLORS = [
  { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)', name: 'blue' },
  { primary: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)', name: 'red' },
  { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.6)', name: 'green' },
  { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)', name: 'yellow' },
];

// 스튜디오 조명 효과
const StudioLights: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 메인 스포트라이트 */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
        style={{
          background: 'conic-gradient(from 180deg at 50% 0%, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
          filter: 'blur(20px)',
        }}
      />

      {/* 좌측 컬러 라이트 */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -left-20 top-1/4 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 우측 컬러 라이트 */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        className="absolute -right-20 top-1/4 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 움직이는 스캔 라이트 */}
      <motion.div
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 w-40 h-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />
    </div>
  );
};

// LED 스크린 배경
const LEDBackground: React.FC<{ isCorrect: boolean | null; isWrong: boolean }> = ({ isCorrect, isWrong }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
    }> = [];

    // 파티클 생성
    const createParticles = () => {
      const baseColor = isCorrect ? '16, 185, 129' : isWrong ? '239, 68, 68' : '99, 102, 241';
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          opacity: Math.random() * 0.5 + 0.2,
          color: baseColor,
        });
      }
    };

    createParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();

        // 연결선
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p.color}, ${0.1 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isCorrect, isWrong]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
};

// 문제 패널
const QuestionPanel: React.FC<{
  question: QuizQuestion;
  selectedOption: number | null;
  correctOption: number | null;
  onSelect: (index: number) => void;
  timeLeft: number;
  disabled: boolean;
}> = ({ question, selectedOption, correctOption, onSelect, timeLeft, disabled }) => {
  const isRevealed = correctOption !== null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative w-full max-w-4xl mx-auto"
    >
      {/* 메인 스크린 프레임 */}
      <div className="relative">
        {/* 외부 프레임 - 메탈릭 효과 */}
        <div
          className="absolute -inset-3 rounded-3xl"
          style={{
            background: 'linear-gradient(145deg, #2a2a3a 0%, #1a1a2a 50%, #0a0a15 100%)',
            boxShadow: '0 0 60px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        />

        {/* LED 테두리 */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(99, 102, 241, 0.5), inset 0 0 20px rgba(99, 102, 241, 0.1)',
              '0 0 40px rgba(99, 102, 241, 0.8), inset 0 0 30px rgba(99, 102, 241, 0.2)',
              '0 0 20px rgba(99, 102, 241, 0.5), inset 0 0 20px rgba(99, 102, 241, 0.1)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-1 rounded-2xl border-2 border-indigo-500/50"
        />

        {/* 메인 컨텐츠 */}
        <div
          className="relative rounded-2xl p-8 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 15, 35, 0.95) 0%, rgba(10, 10, 25, 0.98) 100%)',
          }}
        >
          {/* 카테고리 & 난이도 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              {question.category && (
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium border border-indigo-500/30">
                  {question.category}
                </span>
              )}
              {question.difficulty && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  question.difficulty === 'easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                  question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                  'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {question.difficulty.toUpperCase()}
                </span>
              )}
            </div>

            {/* 타이머 */}
            <motion.div
              animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                timeLeft <= 5 ? 'bg-red-500/30 border-red-500' : 'bg-gray-800/50 border-gray-700'
              } border`}
            >
              <i className={`fa-solid fa-clock ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}></i>
              <span className={`font-mono font-bold text-xl ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </motion.div>
          </div>

          {/* 문제 텍스트 */}
          <motion.h2
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-relaxed"
            style={{
              textShadow: '0 0 40px rgba(255,255,255,0.1)',
            }}
          >
            {question.question}
          </motion.h2>

          {/* 선택지 그리드 */}
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = correctOption === index;
              const isWrongSelection = isRevealed && isSelected && !isCorrectOption;

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!disabled ? { scale: 0.98 } : {}}
                  onClick={() => !disabled && onSelect(index)}
                  disabled={disabled}
                  className={`relative group p-5 rounded-xl text-left transition-all duration-300 ${
                    isCorrectOption
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-green-400'
                      : isWrongSelection
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 border-red-400'
                        : isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400'
                          : 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-600 hover:border-indigo-500'
                  } border-2`}
                  style={{
                    boxShadow: isCorrectOption
                      ? '0 0 30px rgba(16, 185, 129, 0.5)'
                      : isWrongSelection
                        ? '0 0 30px rgba(239, 68, 68, 0.5)'
                        : isSelected
                          ? '0 0 30px rgba(99, 102, 241, 0.5)'
                          : 'none',
                  }}
                >
                  {/* 번호 뱃지 */}
                  <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isCorrectOption
                      ? 'bg-green-500 text-white'
                      : isWrongSelection
                        ? 'bg-red-500 text-white'
                        : isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-700 text-gray-300 group-hover:bg-indigo-500 group-hover:text-white'
                  } transition-colors`}>
                    {index + 1}
                  </div>

                  {/* 선택지 텍스트 */}
                  <span className="text-lg font-medium text-white ml-4">
                    {option}
                  </span>

                  {/* 정답/오답 아이콘 */}
                  <AnimatePresence>
                    {isCorrectOption && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <i className="fa-solid fa-circle-check text-3xl text-green-300"></i>
                      </motion.div>
                    )}
                    {isWrongSelection && (
                      <motion.div
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <i className="fa-solid fa-circle-xmark text-3xl text-red-300"></i>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 키보드 힌트 */}
                  <div className={`absolute bottom-1 right-2 text-xs ${
                    isSelected ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    F{index + 1}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 플레이어 포디움
const PlayerPodium: React.FC<{
  player: QuizPlayer;
  position: number;
  isActive: boolean;
  showResult: boolean;
}> = ({ player, position, isActive, showResult }) => {
  const color = PLAYER_COLORS[position];
  const isCorrectAndRevealed = showResult && player.isCorrect === true;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{
        y: isCorrectAndRevealed ? [0, -30, 0, -20, 0, -10, 0] : 0,
        opacity: 1,
        scale: isCorrectAndRevealed ? [1, 1.2, 1, 1.15, 1, 1.1, 1] : 1,
      }}
      transition={{
        delay: isCorrectAndRevealed ? 0 : position * 0.15,
        duration: isCorrectAndRevealed ? 1 : 0.3,
      }}
      className="flex flex-col items-center"
    >
      {/* 정답자 스포트라이트 */}
      <AnimatePresence>
        {isCorrectAndRevealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-8 -z-10"
            style={{
              background: `radial-gradient(circle, ${color.glow} 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* 캐릭터 영역 */}
      <motion.div
        animate={isActive ? {
          y: [0, -10, 0],
          scale: [1, 1.05, 1],
        } : isCorrectAndRevealed ? {
          rotate: [0, -10, 10, -10, 10, 0],
        } : {}}
        transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
        className="relative mb-2"
      >
        {/* 글로우 효과 */}
        <motion.div
          animate={{
            opacity: isActive ? [0.5, 1, 0.5] : 0.3,
            scale: isActive ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: color.glow }}
        />

        {/* 아바타 */}
        <div
          className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4"
          style={{
            borderColor: color.primary,
            boxShadow: `0 0 20px ${color.glow}`,
          }}
        >
          <img
            src={player.avatar}
            alt={player.name}
            className="w-full h-full object-cover"
          />

          {/* 정답/오답 오버레이 */}
          <AnimatePresence>
            {showResult && player.isCorrect !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center ${
                  player.isCorrect ? 'bg-green-500/70' : 'bg-red-500/70'
                }`}
              >
                <motion.i
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={`fa-solid ${player.isCorrect ? 'fa-check' : 'fa-xmark'} text-3xl text-white`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 연속 정답 뱃지 */}
        {player.streak >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full"
            style={{ boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}
          >
            🔥 {player.streak}
          </motion.div>
        )}

        {/* 정답 시 이모지 파티클 */}
        <AnimatePresence>
          {isCorrectAndRevealed && (
            <>
              {['🎉', '⭐', '🌟', '✨', '🏆'].map((emoji, i) => (
                <motion.div
                  key={`emoji-${i}`}
                  initial={{ opacity: 1, y: 0, x: 0, scale: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    y: -80 - Math.random() * 40,
                    x: (Math.random() - 0.5) * 80,
                    scale: [0, 1.5, 1],
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.1,
                  }}
                  className="absolute top-0 left-1/2 text-2xl pointer-events-none"
                >
                  {emoji}
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 이름 & 점수 패널 */}
      <div
        className="relative px-4 py-2 rounded-xl text-center min-w-[100px]"
        style={{
          background: `linear-gradient(180deg, ${color.primary}20 0%, ${color.primary}10 100%)`,
          border: `2px solid ${color.primary}50`,
          boxShadow: isActive ? `0 0 20px ${color.glow}` : 'none',
        }}
      >
        <div className="text-white font-bold text-sm truncate max-w-[80px]">
          {player.name}
        </div>
        <motion.div
          key={player.score}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          className="text-2xl font-fredoka"
          style={{ color: color.primary }}
        >
          {player.score}
        </motion.div>
      </div>

      {/* 버튼 힌트 */}
      <div
        className="mt-2 px-3 py-1 rounded-lg text-xs font-bold"
        style={{
          background: color.primary,
          boxShadow: `0 0 10px ${color.glow}`,
        }}
      >
        F{position + 1}
      </div>
    </motion.div>
  );
};

// 결과 모달
const ResultModal: React.FC<{
  isVisible: boolean;
  winner: QuizPlayer | null;
  players: QuizPlayer[];
  onPlayAgain: () => void;
  onExit: () => void;
}> = ({ isVisible, winner, players, onPlayAgain, onExit }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 100 }}
            className="relative w-full max-w-lg mx-4 p-8 rounded-3xl"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 30, 50, 0.98) 0%, rgba(15, 15, 30, 0.98) 100%)',
              boxShadow: '0 0 60px rgba(99, 102, 241, 0.3)',
              border: '2px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            {/* 승자 표시 */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-fredoka text-yellow-400 mb-2">
                {winner?.name} Wins!
              </h2>
              <p className="text-gray-400">Final Score: {winner?.score} points</p>
            </div>

            {/* 순위 */}
            <div className="space-y-3 mb-8">
              {sortedPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-3 rounded-xl ${
                    index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-gray-800/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-amber-700 text-white' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full" />
                  <span className="flex-1 text-white font-medium">{player.name}</span>
                  <span className="text-xl font-fredoka" style={{ color: PLAYER_COLORS[player.id - 1].primary }}>
                    {player.score}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* 버튼 */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayAgain}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold"
              >
                Play Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExit}
                className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold"
              >
                Exit
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 정답 임팩트 효과 컴포넌트
const CorrectImpactEffect: React.FC<{
  isVisible: boolean;
  playerName?: string;
  bonusPoints?: number;
}> = ({ isVisible, playerName, bonusPoints }) => {
  // 사운드 효과 재생
  useEffect(() => {
    if (isVisible) {
      // 연속 사운드 효과
      playSound('tada', 0.8);
      setTimeout(() => playSound('applause', 0.6), 200);
      setTimeout(() => playSound('levelUp', 0.5), 400);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 화면 플래시 - 더 강렬하게 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.9, 0.7, 0] }}
            transition={{ duration: 0.6, times: [0, 0.1, 0.2, 0.4, 1] }}
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(255, 255, 255, 1) 0%, rgba(16, 185, 129, 0.9) 30%, rgba(16, 185, 129, 0.5) 60%, transparent 80%)',
            }}
          />

          {/* 골든 링 폭발 */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`ring-${i}`}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 4 + i], opacity: [1, 0] }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99] pointer-events-none w-32 h-32 rounded-full border-8"
              style={{
                borderColor: i === 0 ? '#FFD700' : i === 1 ? '#10B981' : '#F59E0B',
                boxShadow: `0 0 60px ${i === 0 ? '#FFD700' : i === 1 ? '#10B981' : '#F59E0B'}`,
              }}
            />
          ))}

          {/* CORRECT 텍스트 - 더 화려하게 */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{
              scale: [0, 1.8, 1.3, 1.5, 1.3],
              rotate: [-20, 10, -5, 5, 0],
            }}
            exit={{ scale: 0, opacity: 0, y: -100 }}
            transition={{
              duration: 0.8,
              type: "spring",
              stiffness: 300,
              damping: 10,
            }}
            className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none"
          >
            <div className="text-center relative">
              {/* 뒤 글로우 */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 0.5, repeat: 4 }}
                className="absolute inset-0 blur-3xl"
                style={{
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.8) 0%, transparent 70%)',
                }}
              />

              <motion.h1
                animate={{
                  textShadow: [
                    '0 0 20px #10B981, 0 0 40px #10B981, 0 0 60px #10B981',
                    '0 0 40px #FFD700, 0 0 80px #FFD700, 0 0 120px #FFD700',
                    '0 0 20px #10B981, 0 0 40px #10B981, 0 0 60px #10B981',
                  ],
                }}
                transition={{ duration: 0.3, repeat: 5 }}
                className="text-7xl md:text-9xl font-fredoka font-black relative"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #10B981 25%, #34D399 50%, #FFD700 75%, #10B981 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradient-shift 0.5s ease infinite',
                }}
              >
                CORRECT!
              </motion.h1>

              {/* 보너스 포인트 - 더 크게 */}
              <motion.div
                initial={{ y: 30, opacity: 0, scale: 0 }}
                animate={{ y: 0, opacity: 1, scale: [0, 1.5, 1.2] }}
                transition={{ delay: 0.3, type: "spring" }}
                className="mt-6"
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3, repeat: 5 }}
                  className="text-4xl md:text-6xl font-black text-yellow-400 drop-shadow-lg"
                  style={{
                    textShadow: '0 0 30px #FFD700, 0 0 60px #FFD700, 0 4px 0 #B8860B',
                  }}
                >
                  +{bonusPoints || 10} pts
                </motion.span>
              </motion.div>

              {/* 플레이어 이름 */}
              {playerName && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-2xl md:text-3xl font-bold text-white"
                  style={{ textShadow: '0 0 20px rgba(255,255,255,0.8)' }}
                >
                  🎊 {playerName} 🎊
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* 방사형 광선 효과 - 더 많이 */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ scale: [0, 4], opacity: [1, 0], rotate: 45 }}
            transition={{ duration: 1.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99] pointer-events-none"
          >
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-60 origin-bottom"
                style={{
                  transform: `rotate(${i * 15}deg)`,
                  left: '50%',
                  bottom: '50%',
                  background: i % 2 === 0
                    ? 'linear-gradient(to top, #FFD700, transparent)'
                    : 'linear-gradient(to top, #10B981, transparent)',
                }}
              />
            ))}
          </motion.div>

          {/* 별/이모지 폭발 - 더 많이 */}
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              initial={{
                x: '50vw',
                y: '50vh',
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 2, 0],
                opacity: [1, 1, 0],
                rotate: [0, 720],
              }}
              transition={{
                duration: 1.5 + Math.random() * 0.5,
                delay: Math.random() * 0.4,
              }}
              className="fixed z-[102] pointer-events-none text-3xl md:text-5xl"
            >
              {['⭐', '✨', '🌟', '💫', '🎉', '🎊', '🏆', '💯', '🔥'][Math.floor(Math.random() * 9)]}
            </motion.div>
          ))}

          {/* 코인 폭발 효과 */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`coin-${i}`}
              initial={{
                x: '50vw',
                y: '40vh',
                scale: 0,
                rotateY: 0,
              }}
              animate={{
                x: `${30 + Math.random() * 40}vw`,
                y: [`40vh`, `${20 + Math.random() * 20}vh`, `${70 + Math.random() * 20}vh`],
                scale: [0, 1, 1, 0],
                rotateY: [0, 360, 720, 1080],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05,
                times: [0, 0.3, 0.7, 1],
              }}
              className="fixed z-[102] pointer-events-none text-4xl"
              style={{ perspective: '1000px' }}
            >
              🪙
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  );
};

// 오답 임팩트 효과 컴포넌트
const WrongImpactEffect: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      playSound('buzzer', 0.8);
      setTimeout(() => playSound('explosion', 0.5), 100);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 빨간 플래시 - 더 강렬하게 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.7, 0.8, 0] }}
            transition={{ duration: 0.5, times: [0, 0.1, 0.2, 0.3, 1] }}
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.95) 0%, rgba(127, 29, 29, 0.8) 50%, rgba(0,0,0,0.5) 100%)',
            }}
          />

          {/* X 마크 폭발 */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{
              scale: [0, 1.5, 1.2],
              rotate: [-45, 0, 0],
            }}
            transition={{ duration: 0.4, type: "spring" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
          >
            <div className="relative">
              <motion.i
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.2, repeat: 3 }}
                className="fa-solid fa-xmark text-[200px] md:text-[300px] text-red-500"
                style={{
                  filter: 'drop-shadow(0 0 40px rgba(239, 68, 68, 1)) drop-shadow(0 0 80px rgba(239, 68, 68, 0.8))',
                }}
              />
            </div>
          </motion.div>

          {/* WRONG 텍스트 */}
          <motion.div
            initial={{ scale: 3, opacity: 0 }}
            animate={{
              scale: [3, 0.8, 1, 0.95, 1],
              opacity: [0, 1, 1, 1, 1],
              x: [0, -20, 20, -15, 15, -10, 10, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none"
            style={{ marginTop: '200px' }}
          >
            <motion.h1
              animate={{
                textShadow: [
                  '0 0 20px #EF4444, 0 0 40px #EF4444',
                  '0 0 60px #EF4444, 0 0 100px #EF4444',
                  '0 0 20px #EF4444, 0 0 40px #EF4444',
                ],
              }}
              transition={{ duration: 0.2, repeat: 4 }}
              className="text-5xl md:text-7xl font-fredoka font-black text-red-500"
            >
              WRONG!
            </motion.h1>
          </motion.div>

          {/* 깨진 유리 효과 */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`crack-${i}`}
              initial={{
                x: '50vw',
                y: '50vh',
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `${20 + Math.random() * 60}vw`,
                y: `${20 + Math.random() * 60}vh`,
                scale: [0, 1],
                opacity: [1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{ duration: 0.8, delay: Math.random() * 0.2 }}
              className="fixed z-[99] pointer-events-none text-4xl"
            >
              💥
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  );
};

// 스크린 쉐이크 래퍼
const ScreenShake: React.FC<{
  children: React.ReactNode;
  isShaking: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
}> = ({ children, isShaking, intensity = 'medium' }) => {
  const shakeAmounts = {
    light: 3,
    medium: 6,
    heavy: 12,
  };
  const amount = shakeAmounts[intensity];

  return (
    <motion.div
      animate={isShaking ? {
        x: [0, -amount, amount, -amount, amount, 0],
        y: [0, amount/2, -amount/2, amount/2, -amount/2, 0],
      } : {}}
      transition={{ duration: 0.4 }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

// 메인 컴포넌트
interface Props {
  onExit: () => void;
  playerCount?: number;
}

const QuizShowScreen: React.FC<Props> = ({ onExit, playerCount = 4 }) => {
  const [questions] = useState<QuizQuestion[]>(SAMPLE_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [players, setPlayers] = useState<QuizPlayer[]>(() =>
    Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      score: 0,
      avatar: AVATARS[i],
      color: PLAYER_COLORS[i].primary,
      isAnswering: false,
      lastAnswer: null,
      isCorrect: null,
      streak: 0,
    }))
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gamePhase, setGamePhase] = useState<'intro' | 'playing' | 'revealing' | 'result'>('intro');
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [showGameResult, setShowGameResult] = useState(false);
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [showWrongEffect, setShowWrongEffect] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [lastBonusPoints, setLastBonusPoints] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const timerRef = useRef<number | null>(null);

  // 게임 시작
  const startGame = useCallback(() => {
    setGamePhase('playing');
    setTimeLeft(15);
    playSound('round', 0.5);
  }, []);

  // 타이머
  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);

      if (timeLeft <= 5) {
        playSound('tick', 0.3);
      }
    } else if (gamePhase === 'playing' && timeLeft === 0) {
      // 시간 초과
      handleReveal();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gamePhase, timeLeft]);

  // 대형 confetti 폭발 효과
  const triggerMassiveConfetti = useCallback(() => {
    // 중앙 폭발
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#10B981', '#34D399', '#6EE7B7', '#FFD700', '#FFA500'],
      ticks: 200,
      gravity: 0.8,
      scalar: 1.2,
    });

    // 좌측 폭발
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#10B981', '#34D399', '#FFD700'],
      });
    }, 100);

    // 우측 폭발
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#10B981', '#34D399', '#FFD700'],
      });
    }, 200);

    // 상단 폭발
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 270,
        spread: 80,
        origin: { x: 0.5, y: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B'],
        gravity: 1.5,
      });
    }, 300);
  }, []);

  // 정답 공개
  const handleReveal = useCallback(() => {
    setGamePhase('revealing');
    setCorrectOption(currentQuestion.correctIndex);

    const hasCorrectAnswer = players.some(p => p.lastAnswer === currentQuestion.correctIndex);
    const bonusPoints = 10 + timeLeft;
    setLastBonusPoints(bonusPoints);

    // 점수 계산
    setPlayers(prev => prev.map(player => {
      const isCorrect = player.lastAnswer === currentQuestion.correctIndex;
      return {
        ...player,
        isCorrect,
        score: isCorrect ? player.score + bonusPoints : player.score,
        streak: isCorrect ? player.streak + 1 : 0,
      };
    }));

    // 정답/오답 임팩트 효과
    if (hasCorrectAnswer) {
      // 정답 효과들
      playSound('correct', 0.7);
      setShowCorrectEffect(true);
      setIsScreenShaking(true);
      triggerMassiveConfetti();

      // 연속 confetti
      setTimeout(() => triggerMassiveConfetti(), 400);
      setTimeout(() => triggerMassiveConfetti(), 800);

      // 효과 종료
      setTimeout(() => {
        setShowCorrectEffect(false);
        setIsScreenShaking(false);
      }, 2000);
    } else {
      // 오답 효과
      playSound('wrong', 0.6);
      setShowWrongEffect(true);
      setIsScreenShaking(true);

      setTimeout(() => {
        setShowWrongEffect(false);
        setIsScreenShaking(false);
      }, 1000);
    }

    // 다음 문제로
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedOption(null);
        setCorrectOption(null);
        setActivePlayer(null);
        setPlayers(prev => prev.map(p => ({ ...p, lastAnswer: null, isCorrect: null })));
        setTimeLeft(15);
        setGamePhase('playing');
      } else {
        // 게임 종료
        setShowGameResult(true);
        setGamePhase('result');
      }
    }, 3000);
  }, [currentQuestion, currentQuestionIndex, questions.length, players, timeLeft, triggerMassiveConfetti]);

  // 답변 선택
  const handleSelect = useCallback((optionIndex: number) => {
    if (gamePhase !== 'playing') return;

    setSelectedOption(optionIndex);
    setActivePlayer(1); // 임시로 Player 1

    setPlayers(prev => prev.map((p, i) =>
      i === 0 ? { ...p, lastAnswer: optionIndex, isAnswering: true } : p
    ));

    playSound('pop', 0.3);

    // 자동으로 정답 공개 (모든 플레이어가 답했다고 가정)
    setTimeout(() => {
      handleReveal();
    }, 1000);
  }, [gamePhase, handleReveal]);

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gamePhase === 'intro' && e.key === ' ') {
        startGame();
        return;
      }

      if (gamePhase !== 'playing') return;

      const keyMap: { [key: string]: number } = {
        'F1': 0, '1': 0,
        'F2': 1, '2': 1,
        'F3': 2, '3': 2,
        'F4': 3, '4': 3,
      };

      if (e.key in keyMap) {
        e.preventDefault();
        handleSelect(keyMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, handleSelect, startGame]);

  // 게임 재시작
  const handlePlayAgain = () => {
    setCurrentQuestionIndex(0);
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, streak: 0, lastAnswer: null, isCorrect: null })));
    setSelectedOption(null);
    setCorrectOption(null);
    setTimeLeft(15);
    setShowGameResult(false);
    setGamePhase('intro');
  };

  const winner = [...players].sort((a, b) => b.score - a.score)[0];
  const correctPlayerName = players.find(p => p.isCorrect)?.name;

  return (
    <ScreenShake isShaking={isScreenShaking} intensity={showCorrectEffect ? 'heavy' : 'medium'}>
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-[#0a0a15]">
      {/* 임팩트 효과 */}
      <CorrectImpactEffect
        isVisible={showCorrectEffect}
        playerName={correctPlayerName}
        bonusPoints={lastBonusPoints}
      />
      <WrongImpactEffect isVisible={showWrongEffect} />
      {/* 배경 효과 */}
      <LEDBackground isCorrect={correctOption !== null && selectedOption === correctOption} isWrong={correctOption !== null && selectedOption !== correctOption} />
      <StudioLights />

      {/* 인트로 화면 */}
      <AnimatePresence>
        {gamePhase === 'intro' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
          >
            <motion.h1
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl md:text-7xl font-fredoka text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-8"
              style={{ textShadow: '0 0 40px rgba(99, 102, 241, 0.5)' }}
            >
              QUIZ SHOW
            </motion.h1>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold rounded-2xl"
              style={{ boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)' }}
            >
              START GAME
            </motion.button>
            <p className="mt-4 text-gray-500">Press SPACE to start</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상단 바 */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-sm border-b border-gray-800/50">
        <button
          onClick={onExit}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <div className="text-center">
          <span className="text-indigo-400 font-bold">
            Question {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="w-8"></div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <QuestionPanel
          question={currentQuestion}
          selectedOption={selectedOption}
          correctOption={correctOption}
          onSelect={handleSelect}
          timeLeft={timeLeft}
          disabled={gamePhase !== 'playing'}
        />
      </div>

      {/* 하단 플레이어 영역 */}
      <div className="relative z-10 px-4 py-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-center gap-6 md:gap-12">
          {players.map((player, index) => (
            <PlayerPodium
              key={player.id}
              player={player}
              position={index}
              isActive={activePlayer === player.id}
              showResult={gamePhase === 'revealing'}
            />
          ))}
        </div>
      </div>

      {/* 결과 모달 */}
      <ResultModal
        isVisible={showGameResult}
        winner={winner}
        players={players}
        onPlayAgain={handlePlayAgain}
        onExit={onExit}
      />
    </div>
    </ScreenShake>
  );
};

export default QuizShowScreen;
