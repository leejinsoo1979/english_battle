import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VersusGameType } from '../types';

interface GameModeOption {
  type: VersusGameType | 'random';
  name: string;
  description: string;
  gradient: string;
  shadowColor: string;
  thumbnail: React.ReactNode;
}

// 썸네일 SVG 컴포넌트들
const RandomThumbnail = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full">
    <defs>
      <linearGradient id="randGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="25" height="25" rx="4" fill="url(#randGrad)" opacity="0.9" />
    <rect x="45" y="10" width="25" height="25" rx="4" fill="#10b981" opacity="0.9" />
    <rect x="10" y="45" width="25" height="25" rx="4" fill="#8b5cf6" opacity="0.9" />
    <rect x="45" y="45" width="25" height="25" rx="4" fill="#0ea5e9" opacity="0.9" />
    <text x="22" y="28" fontSize="14" fill="white" fontWeight="bold" textAnchor="middle">?</text>
    <text x="57" y="28" fontSize="14" fill="white" fontWeight="bold" textAnchor="middle">!</text>
    <text x="22" y="63" fontSize="14" fill="white" fontWeight="bold" textAnchor="middle">A</text>
    <text x="57" y="63" fontSize="14" fill="white" fontWeight="bold" textAnchor="middle">Z</text>
  </svg>
);

const FillBlankThumbnail = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full">
    <defs>
      <linearGradient id="fillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>
    </defs>
    <rect x="8" y="30" width="15" height="20" rx="3" fill="url(#fillGrad)" />
    <text x="15.5" y="44" fontSize="12" fill="white" fontWeight="bold" textAnchor="middle">C</text>
    <rect x="26" y="30" width="15" height="20" rx="3" fill="url(#fillGrad)" />
    <text x="33.5" y="44" fontSize="12" fill="white" fontWeight="bold" textAnchor="middle">A</text>
    <rect x="44" y="30" width="15" height="20" rx="3" stroke="url(#fillGrad)" strokeWidth="2" strokeDasharray="4 2" fill="none" />
    <text x="51.5" y="44" fontSize="12" fill="#f43f5e" fontWeight="bold" textAnchor="middle">?</text>
    <rect x="62" y="30" width="15" height="20" rx="3" fill="url(#fillGrad)" />
    <text x="69.5" y="44" fontSize="12" fill="white" fontWeight="bold" textAnchor="middle">E</text>
    <path d="M48 58 L55 65 L48 72" stroke="#f43f5e" strokeWidth="2" fill="none" strokeLinecap="round" />
    <text x="40" y="70" fontSize="10" fill="#f43f5e" fontWeight="bold" textAnchor="middle">T</text>
  </svg>
);

const SpeedThumbnail = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full">
    <defs>
      <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#14b8a6" />
      </linearGradient>
    </defs>
    <rect x="10" y="25" width="60" height="30" rx="6" fill="#1f2937" stroke="url(#speedGrad)" strokeWidth="2" />
    <rect x="14" y="32" width="12" height="16" rx="2" fill="url(#speedGrad)" />
    <text x="20" y="44" fontSize="10" fill="white" fontWeight="bold" textAnchor="middle">A</text>
    <rect x="29" y="32" width="12" height="16" rx="2" fill="url(#speedGrad)" />
    <text x="35" y="44" fontSize="10" fill="white" fontWeight="bold" textAnchor="middle">B</text>
    <rect x="44" y="32" width="12" height="16" rx="2" fill="url(#speedGrad)" />
    <text x="50" y="44" fontSize="10" fill="white" fontWeight="bold" textAnchor="middle">C</text>
    <path d="M62 35 L70 40 L62 45" fill="url(#speedGrad)" />
    <path d="M58 35 L66 40 L58 45" fill="url(#speedGrad)" opacity="0.5" />
    <circle cx="65" cy="18" r="8" fill="url(#speedGrad)" />
    <path d="M65 12 L65 18 L69 18" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const ScrambleThumbnail = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full">
    <defs>
      <linearGradient id="scramGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <rect x="8" y="15" width="18" height="18" rx="4" fill="url(#scramGrad)" transform="rotate(-15 17 24)" />
    <text x="17" y="28" fontSize="11" fill="white" fontWeight="bold" textAnchor="middle" transform="rotate(-15 17 24)">P</text>
    <rect x="32" y="12" width="18" height="18" rx="4" fill="url(#scramGrad)" transform="rotate(10 41 21)" />
    <text x="41" y="25" fontSize="11" fill="white" fontWeight="bold" textAnchor="middle" transform="rotate(10 41 21)">L</text>
    <rect x="54" y="18" width="18" height="18" rx="4" fill="url(#scramGrad)" transform="rotate(-8 63 27)" />
    <text x="63" y="31" fontSize="11" fill="white" fontWeight="bold" textAnchor="middle" transform="rotate(-8 63 27)">A</text>
    <path d="M25 45 C30 50, 50 50, 55 45" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="3 2" />
    <path d="M40 42 L40 48 M37 45 L43 45" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
    <rect x="15" y="55" width="16" height="16" rx="3" fill="url(#scramGrad)" />
    <text x="23" y="67" fontSize="10" fill="white" fontWeight="bold" textAnchor="middle">A</text>
    <rect x="33" y="55" width="16" height="16" rx="3" fill="url(#scramGrad)" />
    <text x="41" y="67" fontSize="10" fill="white" fontWeight="bold" textAnchor="middle">P</text>
    <rect x="51" y="55" width="16" height="16" rx="3" fill="url(#scramGrad)" />
    <text x="59" y="67" fontSize="10" fill="white" fontWeight="bold" textAnchor="middle">L</text>
  </svg>
);

const ListenThumbnail = () => (
  <svg viewBox="0 0 80 80" className="w-full h-full">
    <defs>
      <linearGradient id="listenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    <circle cx="30" cy="40" r="18" fill="url(#listenGrad)" />
    <circle cx="30" cy="40" r="12" fill="#0f172a" />
    <circle cx="30" cy="40" r="6" fill="url(#listenGrad)" />
    <path d="M48 32 Q55 40, 48 48" stroke="url(#listenGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M54 26 Q65 40, 54 54" stroke="url(#listenGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M60 20 Q75 40, 60 60" stroke="url(#listenGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
    <rect x="20" y="60" width="40" height="12" rx="3" fill="#1f2937" />
    <line x1="24" y1="66" x2="56" y2="66" stroke="url(#listenGrad)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4" />
  </svg>
);

const GAME_MODES: GameModeOption[] = [
  {
    type: 'random',
    name: 'RANDOM',
    description: '매 라운드 새로운 도전',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    shadowColor: 'rgba(251, 146, 60, 0.4)',
    thumbnail: <RandomThumbnail />,
  },
  {
    type: 'fill-blank',
    name: 'FILL IN',
    description: '빈칸을 채워라',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    shadowColor: 'rgba(236, 72, 153, 0.4)',
    thumbnail: <FillBlankThumbnail />,
  },
  {
    type: 'speed-typing',
    name: 'SPEED',
    description: '빠르게 타이핑',
    gradient: 'from-emerald-400 via-green-500 to-teal-500',
    shadowColor: 'rgba(16, 185, 129, 0.4)',
    thumbnail: <SpeedThumbnail />,
  },
  {
    type: 'scramble',
    name: 'SCRAMBLE',
    description: '섞인 글자를 맞춰라',
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
    thumbnail: <ScrambleThumbnail />,
  },
  {
    type: 'listening',
    name: 'LISTEN',
    description: '듣고 입력하라',
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
    shadowColor: 'rgba(14, 165, 233, 0.4)',
    thumbnail: <ListenThumbnail />,
  },
];

interface Props {
  onSelect: (mode: VersusGameType | 'random') => void;
  onBack: () => void;
}

const GameModeSelector: React.FC<Props> = ({ onSelect, onBack }) => {
  const [selectedMode, setSelectedMode] = useState<VersusGameType | 'random' | null>(null);
  const [hoveredMode, setHoveredMode] = useState<VersusGameType | 'random' | null>(null);

  const handleStart = () => {
    if (selectedMode) {
      onSelect(selectedMode);
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-[#0a0a12]">
      {/* 배경 그리드 패턴 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* 글로우 효과 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-orange-600/10 rounded-full blur-[100px]" />

      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
      >
        <i className="fa-solid fa-chevron-left text-lg"></i>
      </button>

      {/* 메인 컨텐츠 */}
      <div className="h-full flex flex-col items-center justify-center px-6 py-8">
        {/* 제목 */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-fredoka tracking-tight">
            <span className="text-white">SELECT </span>
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              MODE
            </span>
          </h1>
          <div className="mt-3 h-[2px] w-32 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </motion.div>

        {/* 게임 모드 카드 */}
        <div className="flex flex-wrap justify-center gap-4 max-w-5xl w-full mb-10">
          {GAME_MODES.map((mode, index) => {
            const isSelected = selectedMode === mode.type;
            const isHovered = hoveredMode === mode.type;

            return (
              <motion.button
                key={mode.type}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
                onClick={() => setSelectedMode(mode.type)}
                onMouseEnter={() => setHoveredMode(mode.type)}
                onMouseLeave={() => setHoveredMode(null)}
                className={`relative w-40 h-48 rounded-2xl transition-all duration-300 ${
                  isSelected
                    ? 'scale-105'
                    : 'hover:scale-[1.02]'
                }`}
                style={{
                  boxShadow: isSelected || isHovered
                    ? `0 20px 40px -10px ${mode.shadowColor}, 0 0 60px -20px ${mode.shadowColor}`
                    : 'none',
                }}
              >
                {/* 카드 배경 */}
                <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                  isSelected
                    ? `bg-gradient-to-br ${mode.gradient} opacity-100`
                    : 'bg-white/5 border border-white/10'
                }`} />

                {/* 선택 시 테두리 글로우 */}
                {isSelected && (
                  <div className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-br ${mode.gradient} opacity-50 blur-sm`} />
                )}

                {/* 카드 내용 */}
                <div className="relative h-full flex flex-col items-center justify-center p-4">
                  {/* 아이콘 */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                    isSelected
                      ? 'bg-white/20'
                      : `bg-gradient-to-br ${mode.gradient}`
                  }`}>
                    <i className={`fa-solid ${mode.icon} text-2xl text-white`}></i>
                  </div>

                  {/* 타이틀 */}
                  <h3 className={`text-lg font-bold tracking-wide transition-colors duration-300 ${
                    isSelected ? 'text-white' : 'text-gray-200'
                  }`}>
                    {mode.name}
                  </h3>

                  {/* 설명 */}
                  <p className={`text-xs mt-2 text-center transition-colors duration-300 ${
                    isSelected ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {mode.description}
                  </p>

                  {/* RECOMMENDED 뱃지 */}
                  {mode.type === 'random' && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-white text-[10px] font-bold text-gray-900 rounded-full shadow-lg">
                      HOT
                    </div>
                  )}

                  {/* 선택 체크 */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                    >
                      <i className="fa-solid fa-check text-xs text-gray-900"></i>
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* 시작 버튼 */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleStart}
          disabled={!selectedMode}
          className={`relative w-72 h-14 rounded-xl font-bold text-lg tracking-wider transition-all duration-300 overflow-hidden ${
            selectedMode
              ? 'text-white hover:scale-105'
              : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
          }`}
        >
          {selectedMode && (
            <>
              {/* 버튼 그라데이션 배경 */}
              <div className={`absolute inset-0 bg-gradient-to-r ${
                GAME_MODES.find(m => m.type === selectedMode)?.gradient || 'from-orange-500 to-red-500'
              }`} />
              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors duration-300" />
            </>
          )}
          <span className="relative flex items-center justify-center gap-3">
            {selectedMode ? (
              <>
                START
                <i className="fa-solid fa-arrow-right"></i>
              </>
            ) : (
              'SELECT A MODE'
            )}
          </span>
        </motion.button>

        {/* 하단 안내 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center gap-6 text-gray-600 text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">Q</span>
            <span>Player 1</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">P</span>
            <span>Player 2</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameModeSelector;
