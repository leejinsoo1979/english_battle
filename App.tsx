
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { QuizLevel, GameState, Player, VersusGameType } from './types';
import { LEVELS as DEFAULT_LEVELS, GAME_DURATION } from './constants';
import GameHeader from './components/GameHeader';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import IntroScreen from './components/IntroScreen';
import AdminScreen from './components/AdminScreen';
import VersusScreen from './components/VersusScreen';
import VersusResultScreen from './components/VersusResultScreen';
import OnlineWaitingRoom from './components/OnlineWaitingRoom';
import GameModeSelector from './components/GameModeSelector';
import confetti from 'canvas-confetti';
import { peerConnection, GameMessage } from './peerConnection';
import { generateQuizWithAI, isAIConfigured } from './services/aiQuizGenerator';

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
    gameMode: 'single',
  });

  const [showAdmin, setShowAdmin] = useState(false);
  const [roundWinner, setRoundWinner] = useState<1 | 2 | null>(null);
  const [isAIMode, setIsAIMode] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // 온라인 게임 상태
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [isOnlineHost, setIsOnlineHost] = useState(false);

  // 대전 게임 모드 상태
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<VersusGameType | 'random'>('random');

  const timerRef = useRef<number | null>(null);

  // URL에서 방 코드 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');

    if (roomId) {
      setOnlineRoomId(roomId);
      setGameState(prev => ({ ...prev, status: 'online-waiting' }));
      // URL에서 room 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // PeerJS 메시지 핸들러 (온라인 게임 중)
  useEffect(() => {
    if (gameState.status === 'versus' && gameState.gameMode === 'online') {
      peerConnection.onMessage((message: GameMessage) => {
        console.log('Game message received:', message);

        switch (message.type) {
          case 'answer':
            // 상대방이 정답을 맞춤
            const { playerId, isCorrect, score } = message.payload;
            if (isCorrect) {
              setGameState(prev => {
                if (!prev.players) return prev;
                const updatedPlayers = [...prev.players] as [Player, Player];
                const playerIndex = playerId - 1;
                updatedPlayers[playerIndex] = {
                  ...updatedPlayers[playerIndex],
                  score,
                  isCorrect: true,
                };
                setRoundWinner(playerId);
                return { ...prev, players: updatedPlayers };
              });
            }
            break;

          case 'health':
            // 상대방 체력 업데이트
            const { targetPlayerId, newHealth } = message.payload;
            setGameState(prev => {
              if (!prev.players) return prev;
              const updatedPlayers = [...prev.players] as [Player, Player];
              const playerIndex = targetPlayerId - 1;
              updatedPlayers[playerIndex] = {
                ...updatedPlayers[playerIndex],
                health: newHealth,
              };

              // 체력이 0이 되면 게임 종료
              if (newHealth <= 0) {
                const winner = targetPlayerId === 1 ? 2 : 1;
                return {
                  ...prev,
                  players: updatedPlayers,
                  status: 'versus-result',
                  winner,
                };
              }

              return { ...prev, players: updatedPlayers };
            });
            break;

          case 'next':
            // 다음 라운드
            setGameState(prev => {
              if (!prev.players) return prev;
              const resetPlayers: [Player, Player] = [
                { ...prev.players[0], currentInput: '', isCorrect: null },
                { ...prev.players[1], currentInput: '', isCorrect: null },
              ];
              setRoundWinner(null);
              return {
                ...prev,
                currentLevelIndex: message.payload.levelIndex,
                players: resetPlayers,
              };
            });
            break;

          case 'end':
            // 게임 종료
            setGameState(prev => ({
              ...prev,
              status: 'versus-result',
              winner: message.payload.winner,
            }));
            break;
        }
      });
    }
  }, [gameState.status, gameState.gameMode]);

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
    setIsAIMode(false);
    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'playing',
      gameMode: 'single',
    });
    startTimer();
  };

  // AI 퀴즈 모드 시작
  const startAIQuiz = async () => {
    if (!isAIConfigured()) {
      alert('Gemini API 키가 설정되지 않았습니다.\n.env 파일에 VITE_GEMINI_API_KEY를 추가해주세요.');
      return;
    }

    setIsLoadingAI(true);
    setIsAIMode(true);

    try {
      const aiLevel = await generateQuizWithAI();
      if (aiLevel) {
        setLevels([aiLevel]);
        setGameState({
          currentLevelIndex: 0,
          score: 0,
          timeLeft: GAME_DURATION,
          status: 'playing',
          gameMode: 'single',
        });
        startTimer();
      } else {
        alert('AI 퀴즈 생성에 실패했습니다. 다시 시도해주세요.');
        setIsAIMode(false);
      }
    } catch (error) {
      console.error('AI Quiz error:', error);
      alert('AI 퀴즈 생성 중 오류가 발생했습니다.');
      setIsAIMode(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const [isPlayer2Connected, setIsPlayer2Connected] = useState(false);

  // 대전 모드 선택 화면 표시
  const showVersusSelector = () => {
    if (levels.length === 0) {
      alert('레벨이 없습니다. 관리자 화면에서 레벨을 추가하세요!');
      return;
    }
    setShowModeSelector(true);
  };

  // 게임 모드 선택 후 대전 시작
  const startVersusGame = (mode: VersusGameType | 'random') => {
    setSelectedGameMode(mode);
    setShowModeSelector(false);

    const initialPlayers: [Player, Player] = [
      { id: 1, name: 'Player 1', score: 0, health: 100, currentInput: '', isCorrect: null },
      { id: 2, name: 'Player 2', score: 0, health: 100, currentInput: '', isCorrect: null },
    ];
    setIsPlayer2Connected(true); // 같은 기기 대전이므로 바로 연결
    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'versus',
      gameMode: 'versus',
      players: initialPlayers,
      winner: null,
    });
    setRoundWinner(null);
  };

  // 게임 모드 선택 화면에서 뒤로가기
  const handleModeSelectorBack = () => {
    setShowModeSelector(false);
  };

  // Player 2 참가 (로컬 대전)
  const handlePlayer2Join = () => {
    setIsPlayer2Connected(true);
  };

  // 초대 링크 생성 및 복사 (로컬 대전용)
  const handleInvite = async () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert('이 모드는 같은 기기에서만 대전 가능합니다.\n다른 기기와 대전하려면 "친구 초대하기"를 사용하세요.');
    } catch (err) {
      alert('이 모드는 같은 기기에서만 대전 가능합니다.\n다른 기기와 대전하려면 "친구 초대하기"를 사용하세요.');
    }
  };

  // 온라인 방 만들기 (PeerJS 기반)
  const createRoom = () => {
    if (levels.length === 0) {
      alert('레벨이 없습니다. 관리자 화면에서 레벨을 추가하세요!');
      return;
    }
    setOnlineRoomId(null);
    setGameState(prev => ({ ...prev, status: 'online-waiting' }));
  };

  // 온라인 게임 시작 콜백 (PeerJS)
  const handleOnlineGameStart = useCallback((roomId: string, isHost: boolean, hostName: string, guestName: string) => {
    setIsOnlineHost(isHost);
    setOnlineRoomId(roomId);

    const initialPlayers: [Player, Player] = [
      { id: 1, name: hostName, score: 0, health: 100, currentInput: '', isCorrect: null },
      { id: 2, name: guestName, score: 0, health: 100, currentInput: '', isCorrect: null },
    ];

    setIsPlayer2Connected(true); // 온라인에서는 이미 연결됨

    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'versus',
      gameMode: 'online',
      players: initialPlayers,
      winner: null,
    });
    setRoundWinner(null);
  }, []);

  // 온라인 대기실에서 돌아가기
  const handleOnlineBack = () => {
    peerConnection.cleanup();
    setOnlineRoomId(null);
    setGameState(prev => ({ ...prev, status: 'intro' }));
  };

  const handleVersusAnswer = useCallback((playerId: 1 | 2, answer: string) => {
    const currentLevel = levels[gameState.currentLevelIndex];
    const isCorrect = answer.toLowerCase() === currentLevel.targetWord.toLowerCase();

    setGameState(prev => {
      if (!prev.players) return prev;

      const updatedPlayers = [...prev.players] as [Player, Player];
      const playerIndex = playerId - 1;
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        currentInput: answer,
        isCorrect,
      };

      if (isCorrect) {
        updatedPlayers[playerIndex].score += 1;
        setRoundWinner(playerId);

        // 온라인 게임인 경우 PeerJS로 상대방에게 전송
        if (prev.gameMode === 'online') {
          peerConnection.send({
            type: 'answer',
            payload: {
              playerId,
              isCorrect: true,
              score: updatedPlayers[playerIndex].score,
            }
          });
        }
      }

      return {
        ...prev,
        players: updatedPlayers,
      };
    });
  }, [levels, gameState.currentLevelIndex]);

  // 체력 업데이트 핸들러
  const handleHealthUpdate = useCallback((playerId: 1 | 2, damage: number) => {
    setGameState(prev => {
      if (!prev.players) return prev;

      const updatedPlayers = [...prev.players] as [Player, Player];
      const playerIndex = playerId - 1;
      const newHealth = Math.max(0, updatedPlayers[playerIndex].health - damage);
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        health: newHealth,
      };

      // 온라인 게임인 경우 PeerJS로 상대방에게 체력 업데이트 전송
      if (prev.gameMode === 'online') {
        peerConnection.send({
          type: 'health',
          payload: {
            targetPlayerId: playerId,
            newHealth,
          }
        });
      }

      // 체력이 0이 되면 게임 종료
      if (newHealth <= 0) {
        const winner = playerId === 1 ? 2 : 1;

        // 온라인 게임인 경우 PeerJS로 게임 종료 알림
        if (prev.gameMode === 'online') {
          peerConnection.send({
            type: 'end',
            payload: { winner }
          });
        }

        return {
          ...prev,
          players: updatedPlayers,
          status: 'versus-result',
          winner,
        };
      }

      return {
        ...prev,
        players: updatedPlayers,
      };
    });
  }, []);

  const handleVersusNextLevel = useCallback(() => {
    setGameState(prev => {
      if (!prev.players) return prev;

      // 체력이 0인 플레이어가 있으면 이미 게임 종료
      if (prev.players[0].health <= 0 || prev.players[1].health <= 0) {
        return prev;
      }

      const isLastLevel = prev.currentLevelIndex === levels.length - 1;

      if (isLastLevel) {
        // 게임 종료 - 체력이 더 많은 쪽이 승리
        const player1Health = prev.players[0].health;
        const player2Health = prev.players[1].health;
        let winner: 1 | 2 | 'draw';
        if (player1Health > player2Health) winner = 1;
        else if (player2Health > player1Health) winner = 2;
        else winner = 'draw';

        // 온라인 게임인 경우 PeerJS로 게임 종료 알림
        if (prev.gameMode === 'online') {
          peerConnection.send({
            type: 'end',
            payload: { winner }
          });
        }

        return {
          ...prev,
          status: 'versus-result',
          winner,
        };
      }

      // 다음 라운드
      const nextLevelIndex = prev.currentLevelIndex + 1;
      const resetPlayers: [Player, Player] = [
        { ...prev.players[0], currentInput: '', isCorrect: null },
        { ...prev.players[1], currentInput: '', isCorrect: null },
      ];

      setRoundWinner(null);

      // 온라인 게임인 경우 PeerJS로 다음 라운드 알림
      if (prev.gameMode === 'online') {
        peerConnection.send({
          type: 'next',
          payload: { levelIndex: nextLevelIndex }
        });
      }

      return {
        ...prev,
        currentLevelIndex: nextLevelIndex,
        players: resetPlayers,
      };
    });
  }, [levels.length]);

  const handleLevelComplete = useCallback(async (earnedScore: number) => {
    // AI 모드일 때는 새로운 퀴즈 생성
    if (isAIMode) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + earnedScore,
      }));

      setIsLoadingAI(true);
      try {
        const newLevel = await generateQuizWithAI();
        if (newLevel) {
          setLevels([newLevel]);
          setGameState(prev => ({
            ...prev,
            currentLevelIndex: 0,
          }));
        } else {
          // 생성 실패 시 게임 종료
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState(prev => ({ ...prev, status: 'game-over' }));
        }
      } catch (error) {
        console.error('AI Quiz generation error:', error);
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState(prev => ({ ...prev, status: 'game-over' }));
      } finally {
        setIsLoadingAI(false);
      }
      return;
    }

    // 일반 모드
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
  }, [levels.length, isAIMode]);

  const resetGame = () => {
    // 온라인 상태 초기화
    peerConnection.cleanup();
    setOnlineRoomId(null);
    setIsOnlineHost(false);
    setIsAIMode(false);

    // 기본 레벨로 복원
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLevels(JSON.parse(saved));
      } catch {
        setLevels(DEFAULT_LEVELS);
      }
    } else {
      setLevels(DEFAULT_LEVELS);
    }

    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'intro',
      gameMode: 'single',
    });
    setRoundWinner(null);
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
      {gameState.status === 'intro' && !showModeSelector && (
        <IntroScreen
          onStart={startGame}
          onVersus={showVersusSelector}
          onCreateRoom={createRoom}
          onAdmin={() => setShowAdmin(true)}
          onAIQuiz={startAIQuiz}
        />
      )}

      {/* 게임 모드 선택 화면 */}
      {showModeSelector && (
        <GameModeSelector
          onSelect={startVersusGame}
          onBack={handleModeSelectorBack}
        />
      )}

      {/* AI 로딩 오버레이 */}
      {isLoadingAI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-bold text-gray-700">AI가 퀴즈를 생성 중...</p>
            <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {gameState.status === 'online-waiting' && (
        <OnlineWaitingRoom
          roomId={onlineRoomId || undefined}
          onGameStart={handleOnlineGameStart}
          onBack={handleOnlineBack}
        />
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

      {gameState.status === 'versus' && currentLevel && gameState.players && (
        <VersusScreen
          level={currentLevel}
          players={gameState.players}
          onAnswer={handleVersusAnswer}
          onNextLevel={handleVersusNextLevel}
          roundWinner={roundWinner}
          currentRound={gameState.currentLevelIndex + 1}
          totalRounds={levels.length}
          onHealthUpdate={handleHealthUpdate}
          isPlayer2Connected={isPlayer2Connected}
          onInvite={handleInvite}
          onPlayer2Join={handlePlayer2Join}
          gameMode={selectedGameMode}
        />
      )}

      {gameState.status === 'versus-result' && gameState.players && gameState.winner && (
        <VersusResultScreen
          players={gameState.players}
          winner={gameState.winner}
          onRestart={startVersusGame}
          onHome={resetGame}
        />
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
