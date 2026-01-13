
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuizLevel, GameState } from './types';
import { LEVELS as DEFAULT_LEVELS, GAME_DURATION } from './constants';
import GameHeader from './components/GameHeader';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import IntroScreen from './components/IntroScreen';
import AdminScreen from './components/AdminScreen';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'phonics-master-levels';

const App: React.FC = () => {
  const [levels, setLevels] = useState<QuizLevel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_LEVELS;
      }
    }
    return DEFAULT_LEVELS;
  });

  const [gameState, setGameState] = useState<GameState>({
    currentLevelIndex: 0,
    score: 0,
    timeLeft: GAME_DURATION,
    status: 'intro',
  });

  const [showAdmin, setShowAdmin] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Save levels to localStorage
  const saveLevels = (newLevels: QuizLevel[]) => {
    setLevels(newLevels);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLevels));
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { ...prev, status: 'game-over' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  }, []);

  const startGame = () => {
    if (levels.length === 0) {
      alert('레벨이 없습니다. 관리자 화면에서 레벨을 추가하세요!');
      return;
    }
    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'playing',
    });
    startTimer();
  };

  const handleLevelComplete = useCallback((earnedScore: number) => {
    setGameState(prev => {
      const isLastLevel = prev.currentLevelIndex === levels.length - 1;
      if (isLastLevel) {
        if (timerRef.current) clearInterval(timerRef.current);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22d3ee', '#818cf8', '#f472b6']
        });
        return {
          ...prev,
          score: prev.score + earnedScore,
          status: 'game-over'
        };
      }
      return {
        ...prev,
        score: prev.score + earnedScore,
        currentLevelIndex: prev.currentLevelIndex + 1,
      };
    });
  }, [levels.length]);

  const resetGame = () => {
    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'intro',
    });
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const currentLevel = levels[gameState.currentLevelIndex];

  // Show Admin Screen
  if (showAdmin) {
    return (
      <AdminScreen
        levels={levels}
        onSaveLevels={saveLevels}
        onBack={() => setShowAdmin(false)}
      />
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-start relative select-none overflow-hidden">
      {gameState.status === 'intro' && (
        <IntroScreen onStart={startGame} onAdmin={() => setShowAdmin(true)} />
      )}

      {gameState.status === 'playing' && currentLevel && (
        <>
          <GameHeader
            unitName={`Unit 1. Words`}
            currentStep={gameState.currentLevelIndex + 1}
            totalSteps={levels.length}
            timeLeft={gameState.timeLeft}
          />
          <QuizScreen
            level={currentLevel}
            onComplete={handleLevelComplete}
          />
        </>
      )}

      {gameState.status === 'game-over' && (
        <ResultScreen
          score={gameState.score}
          totalLevels={levels.length}
          onRestart={resetGame}
        />
      )}

    </div>
  );
};

export default App;
