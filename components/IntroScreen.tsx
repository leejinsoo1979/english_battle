
import React from 'react';
import robotVideo from './images/robot_dance.mp4';

interface Props {
  onStart: () => void;
  onVersus: () => void;
  onCreateRoom: () => void;
  onAdmin: () => void;
}

const IntroScreen: React.FC<Props> = ({ onStart, onVersus, onCreateRoom, onAdmin }) => {
  return (
    <div className="h-full w-full relative overflow-hidden" style={{ backgroundColor: '#fef8ed' }}>
      {/* Admin Button */}
      <button
        onClick={onAdmin}
        className="absolute top-6 right-6 z-20 text-orange-400 hover:text-orange-600 transition-colors"
        title="레벨 관리"
      >
        <i className="fa-solid fa-gear text-lg"></i>
      </button>

      {/* Content */}
      <div className="h-full flex flex-col items-center justify-center">
        {/* Title - Top */}
        <div className="text-center z-10">
          <h1 className="text-4xl md:text-5xl font-fredoka bg-clip-text text-transparent bg-gradient-to-b from-orange-600 to-orange-400">
            Phonics Master
          </h1>
          <p className="mt-3 text-gray-600 text-lg">
            빈칸에 알맞은 글자를 넣어 단어를 완성하세요
          </p>
        </div>

        {/* Robot Video - Center */}
        <div className="my-8 overflow-hidden">
          <video
            src={robotVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-64 md:w-80 object-cover"
            style={{ aspectRatio: '1/1', objectPosition: 'center' }}
          />
        </div>

        {/* Buttons - Bottom */}
        <div className="flex flex-col gap-4 z-10">
          <button
            onClick={onStart}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            혼자 하기
          </button>
          <button
            onClick={onVersus}
            className="px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <span>1 vs 1 대전</span>
            <i className="fa-solid fa-users"></i>
          </button>
          <button
            onClick={onCreateRoom}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <span>친구 초대하기</span>
            <i className="fa-solid fa-link"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
