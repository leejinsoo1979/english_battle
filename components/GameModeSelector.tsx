import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VersusGameType } from '../types';

interface GameModeOption {
  type: VersusGameType | 'random';
  name: string;
  description: string;
  icon: string;
  color: string;
}

const GAME_MODES: GameModeOption[] = [
  {
    type: 'random',
    name: '랜덤 모드',
    description: '매 라운드 다른 게임이 랜덤으로!',
    icon: 'fa-dice',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    type: 'fill-blank',
    name: '빈칸 채우기',
    description: '문장의 빈칸에 들어갈 단어를 맞추세요',
    icon: 'fa-pen',
    color: 'from-orange-500 to-red-500',
  },
  {
    type: 'speed-typing',
    name: '스피드 타이핑',
    description: '화면에 보이는 단어를 빠르게 타이핑!',
    icon: 'fa-keyboard',
    color: 'from-green-500 to-emerald-500',
  },
  {
    type: 'scramble',
    name: '단어 스크램블',
    description: '섞인 글자를 드래그해서 단어 완성',
    icon: 'fa-shuffle',
    color: 'from-purple-500 to-pink-500',
  },
  {
    type: 'listening',
    name: '듣고 맞추기',
    description: '영어 발음을 듣고 단어를 입력하세요',
    icon: 'fa-headphones',
    color: 'from-cyan-500 to-blue-500',
  },
];

interface Props {
  onSelect: (mode: VersusGameType | 'random') => void;
  onBack: () => void;
}

const GameModeSelector: React.FC<Props> = ({ onSelect, onBack }) => {
  const [selectedMode, setSelectedMode] = useState<VersusGameType | 'random' | null>(null);

  const handleStart = () => {
    if (selectedMode) {
      onSelect(selectedMode);
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden" style={{ backgroundColor: '#0f0f1a' }}>
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all hover:scale-110"
      >
        <i className="fa-solid fa-arrow-left text-xl"></i>
      </button>

      {/* 메인 컨텐츠 */}
      <div className="h-full flex flex-col items-center justify-center px-6 py-12">
        {/* 제목 */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-fredoka text-white mb-2">
            게임 모드 선택
          </h1>
          <p className="text-gray-400 text-lg">
            원하는 게임 모드를 선택하세요
          </p>
        </motion.div>

        {/* 게임 모드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full mb-8">
          {GAME_MODES.map((mode, index) => (
            <motion.button
              key={mode.type}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedMode(mode.type)}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                selectedMode === mode.type
                  ? 'border-white bg-white/10 scale-105 shadow-2xl'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
              }`}
            >
              {/* 선택 표시 */}
              {selectedMode === mode.type && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <i className="fa-solid fa-check text-white text-sm"></i>
                </motion.div>
              )}

              {/* 아이콘 */}
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br ${mode.color}`}
              >
                <i className={`fa-solid ${mode.icon} text-2xl text-white`}></i>
              </div>

              {/* 제목 */}
              <h3 className="text-xl font-bold text-white mb-2">{mode.name}</h3>

              {/* 설명 */}
              <p className="text-gray-400 text-sm">{mode.description}</p>

              {/* 랜덤 모드 뱃지 */}
              {mode.type === 'random' && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
                  추천
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* 시작 버튼 */}
        <motion.button
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleStart}
          disabled={!selectedMode}
          className={`w-full max-w-md py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
            selectedMode
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 hover:scale-105 shadow-lg shadow-orange-500/30'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedMode ? (
            <>
              <i className="fa-solid fa-play mr-3"></i>
              게임 시작!
            </>
          ) : (
            '게임 모드를 선택하세요'
          )}
        </motion.button>

        {/* 안내 텍스트 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-gray-500 text-sm text-center"
        >
          <i className="fa-solid fa-gamepad mr-2"></i>
          Player 1: Q키 | Player 2: P키로 입력
        </motion.p>
      </div>
    </div>
  );
};

export default GameModeSelector;
