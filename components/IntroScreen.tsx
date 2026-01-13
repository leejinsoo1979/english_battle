
import React from 'react';
import robotVideo from './images/robot_dance.mp4';

interface Props {
  onStart: () => void;
  onVersus: () => void;
  onCreateRoom: () => void;
  onAdmin: () => void;
  onAIQuiz: () => void;
  onQuizShow: () => void;
}

const IntroScreen: React.FC<Props> = ({ onStart, onVersus, onCreateRoom, onAdmin, onAIQuiz, onQuizShow }) => {
  return (
    <div className="h-full w-full relative overflow-hidden" style={{ backgroundColor: '#fef8ed' }}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl" />
      </div>

      {/* Admin Button */}
      <button
        onClick={onAdmin}
        className="absolute top-6 right-6 z-20 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-orange-500 hover:bg-white transition-all hover:scale-110"
        title="레벨 관리"
      >
        <i className="fa-solid fa-gear text-lg"></i>
      </button>

      {/* Content */}
      <div className="h-full flex flex-col items-center justify-center px-6">
        {/* Title - Top */}
        <div className="text-center z-10">
          <h1 className="text-5xl md:text-6xl font-fredoka bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-500 drop-shadow-sm">
            Phonics Master
          </h1>
          <p className="mt-4 text-gray-500 text-base md:text-lg font-medium">
            빈칸에 알맞은 글자를 넣어 단어를 완성하세요
          </p>
        </div>

        {/* Robot Video - Center */}
        <div className="my-6 md:my-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-400/20 to-transparent rounded-full blur-2xl scale-110" />
            <video
              src={robotVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-56 md:w-72 object-cover relative z-10"
              style={{ aspectRatio: '1/1', objectPosition: 'center' }}
            />
          </div>
        </div>

        {/* Buttons - Bottom */}
        <div className="flex flex-col gap-3 z-10 w-full max-w-sm">
          {/* 혼자 하기 - Primary Button */}
          <button
            onClick={onStart}
            className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400" />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative px-8 py-4 flex items-center justify-center gap-3">
              <i className="fa-solid fa-user text-white/90 text-lg"></i>
              <span className="text-white font-bold text-lg tracking-wide">혼자 하기</span>
            </div>
            <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
          </button>

          {/* AI 퀴즈 - AI Generated Button */}
          <button
            onClick={onAIQuiz}
            className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-400" />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative px-8 py-4 flex items-center justify-center gap-3">
              <i className="fa-solid fa-robot text-white/90 text-lg"></i>
              <span className="text-white font-bold text-lg tracking-wide">AI 퀴즈</span>
              <span className="text-white/70 text-sm font-medium">(무한 생성)</span>
            </div>
            <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
            {/* AI Badge */}
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
              AI
            </div>
          </button>

          {/* 1 vs 1 대전 - Secondary Button */}
          <button
            onClick={onVersus}
            className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-400" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative px-8 py-4 flex items-center justify-center gap-3">
              <i className="fa-solid fa-users text-white/90 text-lg"></i>
              <span className="text-white font-bold text-lg tracking-wide">1 vs 1 대전</span>
              <span className="text-white/70 text-sm font-medium">(같은 기기)</span>
            </div>
            <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
          </button>

          {/* 온라인 대전 - Tertiary Button */}
          <button
            onClick={onCreateRoom}
            className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-400" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative px-8 py-4 flex items-center justify-center gap-3">
              <i className="fa-solid fa-globe text-white/90 text-lg"></i>
              <span className="text-white font-bold text-lg tracking-wide">온라인 대전</span>
            </div>
            <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
            {/* Coming Soon Badge */}
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              NEW
            </div>
          </button>

          {/* 퀴즈쇼 모드 - Premium Button */}
          <button
            onClick={onQuizShow}
            className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Animated Glow */}
            <div className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            <div className="relative px-8 py-4 flex items-center justify-center gap-3">
              <i className="fa-solid fa-tv text-white/90 text-lg"></i>
              <span className="text-white font-bold text-lg tracking-wide">퀴즈쇼</span>
              <span className="text-white/70 text-sm font-medium">(4인 대전)</span>
            </div>
            <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
            {/* Hot Badge */}
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
              🔥 HOT
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 text-gray-400 text-xs">
          © 2024 Phonics Master
        </p>
      </div>
    </div>
  );
};

export default IntroScreen;
