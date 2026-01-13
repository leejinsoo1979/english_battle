
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { QuizLevel, GameState, Player } from './types';
import { LEVELS as DEFAULT_LEVELS, GAME_DURATION } from './constants';
import GameHeader from './components/GameHeader';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import IntroScreen from './components/IntroScreen';
import AdminScreen from './components/AdminScreen';
import VersusScreen from './components/VersusScreen';
import VersusResultScreen from './components/VersusResultScreen';
import OnlineWaitingRoom from './components/OnlineWaitingRoom';
import confetti from 'canvas-confetti';
import { peerConnection, GameMessage } from './peerConnection';

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

  // 온라인 게임 상태
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [isOnlineHost, setIsOnlineHost] = useState(false);

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
    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'playing',
      gameMode: 'single',
    });
    startTimer();
  };

  const [isPlayer2Connected, setIsPlayer2Connected] = useState(false);

  const startVersusGame = () => {
    if (levels.length === 0) {
      alert('레벨이 없습니다. 관리자 화면에서 레벨을 추가하세요!');
      return;
    }
    const initialPlayers: [Player, Player] = [
      { id: 1, name: 'Player 1', score: 0, health: 100, currentInput: '', isCorrect: null },
      { id: 2, name: 'Player 2', score: 0, health: 100, currentInput: '', isCorrect: null },
    ];
    setIsPlayer2Connected(false); // 초기에는 Player 2 미연결
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
    // 온라인 상태 초기화
    peerConnection.cleanup();
    setOnlineRoomId(null);
    setIsOnlineHost(false);

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
      {gameState.status === 'intro' && (
        <IntroScreen
          onStart={startGame}
          onVersus={startVersusGame}
          onCreateRoom={createRoom}
          onAdmin={() => setShowAdmin(true)}
        />
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
