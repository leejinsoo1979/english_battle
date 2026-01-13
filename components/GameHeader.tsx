
import React from 'react';

interface Props {
  unitName: string;
  currentStep: number;
  totalSteps: number;
  timeLeft: number;
}

const GameHeader: React.FC<Props> = ({ unitName, currentStep, totalSteps, timeLeft }) => {
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-2xl px-6 pt-6 pb-2 space-y-4">
      <div className="flex items-center justify-between text-gray-600 font-bold">
        <div className="flex items-center space-x-2">
           <img src="https://api.dicebear.com/7.x/bottts/svg?seed=monkey" alt="Monkeys" className="w-8 h-8 rounded-full bg-orange-100 p-1" />
           <span className="text-sm font-semibold text-orange-600">Monkeys</span>
        </div>
        <h1 className="text-xl font-fredoka uppercase tracking-wide">Fill in the Blank 2</h1>
        <div className="w-8"></div>
      </div>

      <div className="flex items-center justify-between text-sm font-bold text-gray-500">
        <div>{unitName} {currentStep}/{totalSteps}</div>
        <div className="flex items-center space-x-1">
          <i className="fa-regular fa-clock"></i>
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-orange-400 transition-all duration-500" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default GameHeader;
