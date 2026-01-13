
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { QuizLevel, GameState, Player, GameRoom } from './types';
import { LEVELS as DEFAULT_LEVELS, GAME_DURATION } from './constants';
import GameHeader from './components/GameHeader';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import IntroScreen from './components/IntroScreen';
import AdminScreen from './components/AdminScreen';
import VersusScreen from './components/VersusScreen';
import VersusResultScreen from './components/VersusResultScreen';
import LobbyScreen from './components/LobbyScreen';
import OnlineWaitingRoom from './components/OnlineWaitingRoom';
import confetti from 'canvas-confetti';
import { OnlineRoom, subscribeToRoom, submitAnswer, updatePlayerStats, nextQuestion, endOnlineGame, startOnlineGame as firebaseStartGame } from './firebase';

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
  const [onlinePlayerId, setOnlinePlayerId] = useState<string>('');
  const [isOnlineHost, setIsOnlineHost] = useState(false);
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoom | null>(null);

  const timerRef = useRef<number | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

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

  // 온라인 방 상태 구독
  useEffect(() => {
    if (onlineRoom?.id && gameState.status === 'versus' && gameState.gameMode === 'online') {
      unsubscribeRef.current = subscribeToRoom(onlineRoom.id, (room) => {
        if (room) {
          setOnlineRoom(room);

          // 상대방 답변 업데이트
          if (room.players) {
            setGameState(prev => {
              if (!prev.players) return prev;

              const updatedPlayers = [...prev.players] as [Player, Player];

              // 호스트/게스트에 따라 상대방 정보 업데이트
              if (isOnlineHost && room.players.guest) {
                updatedPlayers[1] = {
                  ...updatedPlayers[1],
                  score: room.players.guest.score,
                  health: room.players.guest.health,
                };
              } else if (!isOnlineHost && room.players.host) {
                updatedPlayers[0] = {
                  ...updatedPlayers[0],
                  score: room.players.host.score,
                  health: room.players.host.health,
                };
              }

              return { ...prev, players: updatedPlayers };
            });
          }

          // 게임 종료 체크
          if (room.status === 'finished' && room.winner) {
            const winner = room.winner === 'host' ? 1 : room.winner === 'guest' ? 2 : 'draw';
            setGameState(prev => ({
              ...prev,
              status: 'versus-result',
              winner,
            }));
          }
        }
      });

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }
  }, [onlineRoom?.id, gameState.status, gameState.gameMode, isOnlineHost]);

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

  // 온라인 방 만들기 (Firebase 기반)
  const createRoom = () => {
    if (levels.length === 0) {
      alert('레벨이 없습니다. 관리자 화면에서 레벨을 추가하세요!');
      return;
    }
    setOnlineRoomId(null);
    setGameState(prev => ({ ...prev, status: 'online-waiting' }));
  };

  // 온라인 게임 시작 콜백
  const handleOnlineGameStart = useCallback((room: OnlineRoom, isHost: boolean, playerId: string) => {
    setOnlineRoom(room);
    setIsOnlineHost(isHost);
    setOnlinePlayerId(playerId);

    const firstQuestion = levels[0];

    // 호스트만 게임 시작 명령
    if (isHost) {
      firebaseStartGame(room.id, {
        sentence: firstQuestion.sentence,
        targetWord: firstQuestion.targetWord,
        imageHint: firstQuestion.imageHint,
        distractors: firstQuestion.distractors,
      });
    }

    const initialPlayers: [Player, Player] = [
      { id: 1, name: room.hostName, score: 0, health: 100, currentInput: '', isCorrect: null },
      { id: 2, name: room.guestName || 'Player 2', score: 0, health: 100, currentInput: '', isCorrect: null },
    ];

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
  }, [levels]);

  // 온라인 대기실에서 돌아가기
  const handleOnlineBack = () => {
    setOnlineRoomId(null);
    setOnlineRoom(null);
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

        // 온라인 게임인 경우 Firebase에 점수 업데이트
        if (gameState.gameMode === 'online' && onlineRoom) {
          const isHostPlayer = (isOnlineHost && playerId === 1) || (!isOnlineHost && playerId === 2);
          if (isHostPlayer || playerId === (isOnlineHost ? 1 : 2)) {
            updatePlayerStats(
              onlineRoom.id,
              isOnlineHost,
              updatedPlayers[isOnlineHost ? 0 : 1].score,
              updatedPlayers[isOnlineHost ? 0 : 1].health
            );
          }
        }
      }

      return {
        ...prev,
        players: updatedPlayers,
      };
    });
  }, [levels, gameState.currentLevelIndex, gameState.gameMode, onlineRoom, isOnlineHost]);

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

      // 온라인 게임인 경우 Firebase에 체력 업데이트
      if (prev.gameMode === 'online' && onlineRoom) {
        // 내 체력이 깎인 경우만 업데이트
        const isMyHealth = (isOnlineHost && playerId === 1) || (!isOnlineHost && playerId === 2);
        if (!isMyHealth) {
          // 상대방 체력 = 내가 공격한 것
          updatePlayerStats(
            onlineRoom.id,
            isOnlineHost,
            updatedPlayers[isOnlineHost ? 0 : 1].score,
            updatedPlayers[isOnlineHost ? 0 : 1].health
          );
        }
      }

      // 체력이 0이 되면 게임 종료
      if (newHealth <= 0) {
        const winner = playerId === 1 ? 2 : 1;

        // 온라인 게임인 경우 Firebase에 게임 종료 알림
        if (prev.gameMode === 'online' && onlineRoom) {
          const firebaseWinner = winner === 1 ? 'host' : 'guest';
          endOnlineGame(onlineRoom.id, firebaseWinner);
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
  }, [onlineRoom, isOnlineHost]);

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

        // 온라인 게임인 경우 Firebase에 게임 종료 알림
        if (prev.gameMode === 'online' && onlineRoom) {
          const firebaseWinner = winner === 1 ? 'host' : winner === 2 ? 'guest' : 'draw';
          endOnlineGame(onlineRoom.id, firebaseWinner);
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

      // 온라인 게임인 경우 다음 문제 Firebase에 업데이트 (호스트만)
      if (prev.gameMode === 'online' && onlineRoom && isOnlineHost) {
        const nextLevel = levels[nextLevelIndex];
        nextQuestion(onlineRoom.id, nextLevelIndex, {
          sentence: nextLevel.sentence,
          targetWord: nextLevel.targetWord,
          imageHint: nextLevel.imageHint,
          distractors: nextLevel.distractors,
        });
      }

      return {
        ...prev,
        currentLevelIndex: nextLevelIndex,
        players: resetPlayers,
      };
    });
  }, [levels, onlineRoom, isOnlineHost]);

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
    setOnlineRoom(null);
    setOnlineRoomId(null);
    setOnlinePlayerId('');
    setIsOnlineHost(false);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
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
