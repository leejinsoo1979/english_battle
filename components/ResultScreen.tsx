
import React from 'react';

interface Props {
  score: number;
  totalLevels: number;
  onRestart: () => void;
}

const ResultScreen: React.FC<Props> = ({ score, totalLevels, onRestart }) => {
  const maxScore = totalLevels * 10;
  const percentage = (score / maxScore) * 100;
  
  let message = "Good Job!";
  let emoji = "🌟";
  if (percentage >= 90) { message = "Perfect!"; emoji = "🏆"; }
  else if (percentage >= 70) { message = "Excellent!"; emoji = "🔥"; }

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-10 px-6 text-center animate-in slide-in-from-bottom duration-700">
      <div className="space-y-2">
        <div className="text-8xl">{emoji}</div>
        <h2 className="text-5xl font-fredoka text-gray-800">{message}</h2>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl w-full max-w-sm space-y-6 border-b-8 border-gray-100">
        <div className="flex justify-between items-center px-4">
          <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Total Score</span>
          <span className="text-4xl font-fredoka text-orange-500">{score}</span>
        </div>
        
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-400 rounded-full" 
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-2xl">
            <div className="text-xs text-orange-400 font-bold">Accuracy</div>
            <div className="text-xl font-bold text-orange-700">{Math.round(percentage)}%</div>
          </div>
          <div className="bg-teal-50 p-4 rounded-2xl">
            <div className="text-xs text-teal-400 font-bold">Time Bonus</div>
            <div className="text-xl font-bold text-teal-700">+120</div>
          </div>
        </div>
      </div>

      <button 
        onClick={onRestart}
        className="px-10 py-4 bg-gray-800 hover:bg-gray-900 text-white rounded-full font-bold text-xl shadow-lg transition transform active:scale-95"
      >
        Back to Menu
      </button>
    </div>
  );
};

export default ResultScreen;
