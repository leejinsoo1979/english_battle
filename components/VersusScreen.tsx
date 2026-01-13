
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuizLevel, Player } from '../types';

interface Props {
  level: QuizLevel;
  players: [Player, Player];
  onAnswer: (playerId: 1 | 2, answer: string) => void;
  onNextLevel: () => void;
  roundWinner: 1 | 2 | null;
  currentRound: number;
  totalRounds: number;
}

const VersusScreen: React.FC<Props> = ({
  level,
  players,
  onAnswer,
  onNextLevel,
  roundWinner,
  currentRound,
  totalRounds,
}) => {
  const [player1Input, setPlayer1Input] = useState('');
  const [player2Input, setPlayer2Input] = useState('');
  const [showResult, setShowResult] = useState(false);
  const player1InputRef = useRef<HTMLInputElement>(null);
  const player2InputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlayer1Input('');
    setPlayer2Input('');
    setShowResult(false);
  }, [level]);

  useEffect(() => {
    if (roundWinner !== null) {
      setShowResult(true);
      const timer = setTimeout(() => {
        onNextLevel();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [roundWinner, onNextLevel]);

  const handlePlayer1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player1Input.trim() && !showResult) {
      onAnswer(1, player1Input.trim().toLowerCase());
    }
  };

  const handlePlayer2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player2Input.trim() && !showResult) {
      onAnswer(2, player2Input.trim().toLowerCase());
    }
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResult) return;

      // Player 1: Q키로 포커스
      if (e.key === 'q' || e.key === 'Q') {
        if (document.activeElement !== player1InputRef.current) {
          e.preventDefault();
          player1InputRef.current?.focus();
        }
      }
      // Player 2: P키로 포커스
      if (e.key === 'p' || e.key === 'P') {
        if (document.activeElement !== player2InputRef.current) {
          e.preventDefault();
          player2InputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult]);

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: '#fef8ed' }}>
      {/* Header - Player Names & VS */}
      <div className="flex items-center justify-between px-8 py-4 bg-white/50">
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold text-blue-600">{players[0].name}</span>
          <div className="text-lg text-gray-600">점수: {players[0].score}</div>
        </div>
        <div className="px-8">
          <span className="text-3xl font-fredoka text-orange-500">VS</span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold text-red-600">{players[1].name}</span>
          <div className="text-lg text-gray-600">점수: {players[1].score}</div>
        </div>
      </div>

      {/* Round indicator */}
      <div className="text-center py-2 bg-gray-100">
        <span className="text-gray-600 font-medium">라운드 {currentRound} / {totalRounds}</span>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="flex-1 flex">
        {/* Player 1 Area (Left) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-blue-50/50">
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">Q키를 눌러 입력</span>
          </div>
          <form onSubmit={handlePlayer1Submit} className="w-full max-w-xs">
            <input
              ref={player1InputRef}
              type="text"
              value={player1Input}
              onChange={(e) => setPlayer1Input(e.target.value)}
              placeholder="단어를 입력하세요"
              disabled={showResult}
              className="w-full px-4 py-3 text-xl text-center border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={showResult || !player1Input.trim()}
              className="w-full mt-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
            >
              제출 (Enter)
            </button>
          </form>
          {showResult && players[0].isCorrect !== null && (
            <div className={`mt-4 text-2xl font-bold ${players[0].isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {players[0].isCorrect ? '정답! ✓' : '오답 ✗'}
            </div>
          )}
        </div>

        {/* Center Area - Image & Word */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-x-2 border-gray-200">
          {/* Image */}
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-lg mb-6 bg-white">
            <img
              src={level.imageHint}
              alt="hint"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Word Display */}
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-2">{level.sentence}</p>
            <div className="flex justify-center gap-2">
              {level.targetWord.split('').map((_, index) => (
                <div
                  key={index}
                  className="w-10 h-12 border-b-4 border-gray-400 flex items-center justify-center"
                >
                  <span className="text-2xl text-gray-300">_</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-gray-400 text-sm">
              {level.targetWord.length}글자
            </p>
          </div>

          {/* Round Winner Display */}
          {showResult && roundWinner && (
            <div className="mt-6 p-4 bg-yellow-100 rounded-xl">
              <span className="text-xl font-bold text-yellow-700">
                🎉 {roundWinner === 1 ? players[0].name : players[1].name} 승리!
              </span>
            </div>
          )}
        </div>

        {/* Player 2 Area (Right) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-red-50/50">
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">P키를 눌러 입력</span>
          </div>
          <form onSubmit={handlePlayer2Submit} className="w-full max-w-xs">
            <input
              ref={player2InputRef}
              type="text"
              value={player2Input}
              onChange={(e) => setPlayer2Input(e.target.value)}
              placeholder="단어를 입력하세요"
              disabled={showResult}
              className="w-full px-4 py-3 text-xl text-center border-2 border-red-300 rounded-xl focus:border-red-500 focus:outline-none disabled:bg-gray-100"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={showResult || !player2Input.trim()}
              className="w-full mt-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
            >
              제출 (Enter)
            </button>
          </form>
          {showResult && players[1].isCorrect !== null && (
            <div className={`mt-4 text-2xl font-bold ${players[1].isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {players[1].isCorrect ? '정답! ✓' : '오답 ✗'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersusScreen;
