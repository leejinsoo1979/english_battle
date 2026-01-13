
import React from 'react';
import { Player } from '../types';
import confetti from 'canvas-confetti';

interface Props {
  players: [Player, Player];
  winner: 1 | 2 | 'draw';
  onRestart: () => void;
  onHome: () => void;
}

const VersusResultScreen: React.FC<Props> = ({ players, winner, onRestart, onHome }) => {
  React.useEffect(() => {
    if (winner !== 'draw') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: winner === 1 ? ['#3b82f6', '#60a5fa', '#93c5fd'] : ['#ef4444', '#f87171', '#fca5a5']
      });
    }
  }, [winner]);

  const getWinnerName = () => {
    if (winner === 'draw') return '무승부!';
    return winner === 1 ? players[0].name : players[1].name;
  };

  const getWinnerColor = () => {
    if (winner === 'draw') return 'text-gray-600';
    return winner === 1 ? 'text-blue-600' : 'text-red-600';
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center" style={{ backgroundColor: '#fef8ed' }}>
      <div className="text-center">
        {/* Trophy Icon */}
        <div className="text-8xl mb-6">
          {winner === 'draw' ? '🤝' : '🏆'}
        </div>

        {/* Winner Announcement */}
        <h1 className={`text-4xl md:text-5xl font-fredoka ${getWinnerColor()} mb-4`}>
          {winner === 'draw' ? '무승부!' : `${getWinnerName()} 승리!`}
        </h1>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-8 my-8">
          <div className="text-center p-6 bg-blue-100 rounded-2xl min-w-32">
            <div className="text-lg font-bold text-blue-600 mb-2">{players[0].name}</div>
            <div className="text-4xl font-bold text-blue-800">{players[0].score}</div>
          </div>
          <div className="text-2xl font-bold text-gray-400">:</div>
          <div className="text-center p-6 bg-red-100 rounded-2xl min-w-32">
            <div className="text-lg font-bold text-red-600 mb-2">{players[1].name}</div>
            <div className="text-4xl font-bold text-red-800">{players[1].score}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={onRestart}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            다시 대전
          </button>
          <button
            onClick={onHome}
            className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersusResultScreen;
