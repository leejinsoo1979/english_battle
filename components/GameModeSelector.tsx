import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VersusGameType } from '../types';

interface GameModeOption {
  type: VersusGameType | 'random';
  name: string;
  description: string;
  icon: string;
  gradient: string;
  shadowColor: string;
}

const GAME_MODES: GameModeOption[] = [
  {
    type: 'random',
    name: 'RANDOM',
    description: '매 라운드 새로운 도전',
    icon: 'fa-random',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    shadowColor: 'rgba(251, 146, 60, 0.4)',
  },
  {
    type: 'fill-blank',
    name: 'FILL IN',
    description: '빈칸을 채워라',
    icon: 'fa-i-cursor',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    shadowColor: 'rgba(236, 72, 153, 0.4)',
  },
  {
    type: 'speed-typing',
    name: 'SPEED',
    description: '빠르게 타이핑',
    icon: 'fa-bolt',
    gradient: 'from-emerald-400 via-green-500 to-teal-500',
    shadowColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    type: 'scramble',
    name: 'SCRAMBLE',
    description: '섞인 글자를 맞춰라',
    icon: 'fa-arrows-rotate',
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    type: 'listening',
    name: 'LISTEN',
    description: '듣고 입력하라',
    icon: 'fa-volume-high',
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
    shadowColor: 'rgba(14, 165, 233, 0.4)',
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
