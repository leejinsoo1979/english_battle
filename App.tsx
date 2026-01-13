
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
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'phonics-master-levels';
const ROOM_STORAGE_KEY = 'phonics-master-room';

// 방 ID 생성 함수
const generateRoomId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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

  const timerRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // URL에서 방 코드 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');

    if (roomId) {
      // 초대 링크로 접속한 경우
      joinRoom(roomId);
    }
  }, []);

  // 방 상태 폴링 (localStorage 기반 - 같은 브라우저에서만 동작)
  useEffect(() => {
    if (gameState.status === 'lobby' && gameState.room) {
      pollIntervalRef.current = window.setInterval(() => {
        const savedRoom = localStorage.getItem(`${ROOM_STORAGE_KEY}-${gameState.room?.roomId}`);
        if (savedRoom) {
          const room: GameRoom = JSON.parse(savedRoom);
          setGameState(prev => ({
            ...prev,
            room,
          }));

          // 호스트가 게임 시작했는지 확인
          const gameStarted = localStorage.getItem(`${ROOM_STORAGE_KEY}-${gameState.room?.roomId}-started`);
          if (gameStarted === 'true' && !gameState.isHost) {
            startOnlineGame();
          }
        }
      }, 1000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [gameState.status, gameState.room?.roomId, gameState.isHost]);

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

  // 초대 링크 생성 및 복사
  const handleInvite = async () => {
    const roomId = generateRoomId();
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert('초대 링크가 복사되었습니다!\n친구에게 공유하세요.');
    } catch (err) {
      // 클립보드 API 실패 시 대체 방법
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('초대 링크가 복사되었습니다!\n친구에게 공유하세요.');
    }
  };

  // 온라인 방 만들기
  const createRoom = () => {
    if (levels.length === 0) {
      alert('레벨이 없습니다. 관리자 화면에서 레벨을 추가하세요!');
      return;
    }

    const roomId = generateRoomId();
    const room: GameRoom = {
      roomId,
      hostName: 'Player 1',
      isReady: true,
      createdAt: Date.now(),
    };

    // localStorage에 방 정보 저장
    localStorage.setItem(`${ROOM_STORAGE_KEY}-${roomId}`, JSON.stringify(room));

    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'lobby',
      gameMode: 'online',
      room,
      isHost: true,
    });
  };

  // 방 참가하기
  const joinRoom = (roomId: string) => {
    const savedRoom = localStorage.getItem(`${ROOM_STORAGE_KEY}-${roomId}`);

    if (!savedRoom) {
      alert('존재하지 않는 방입니다.');
      // URL에서 room 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const room: GameRoom = JSON.parse(savedRoom);

    if (room.guestName) {
      alert('이미 다른 플레이어가 참가한 방입니다.');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    // 게스트 정보 추가
    room.guestName = 'Player 2';
    room.isReady = true;
    localStorage.setItem(`${ROOM_STORAGE_KEY}-${roomId}`, JSON.stringify(room));

    setGameState({
      currentLevelIndex: 0,
      score: 0,
      timeLeft: GAME_DURATION,
      status: 'lobby',
      gameMode: 'online',
      room,
      isHost: false,
    });

    // URL에서 room 파라미터 제거
    window.history.replaceState({}, '', window.location.pathname);
  };

  // 방 나가기
  const leaveRoom = () => {
    if (gameState.room) {
      if (gameState.isHost) {
        // 호스트가 나가면 방 삭제
        localStorage.removeItem(`${ROOM_STORAGE_KEY}-${gameState.room.roomId}`);
        localStorage.removeItem(`${ROOM_STORAGE_KEY}-${gameState.room.roomId}-started`);
      } else {
        // 게스트가 나가면 게스트 정보만 삭제
        const room = { ...gameState.room };
        delete room.guestName;
        localStorage.setItem(`${ROOM_STORAGE_KEY}-${room.roomId}`, JSON.stringify(room));
      }
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    resetGame();
  };

  // 플레이어 이름 업데이트
  const updatePlayerName = (name: string) => {
    if (!gameState.room) return;

    const room = { ...gameState.room };
    if (gameState.isHost) {
      room.hostName = name;
    } else {
      room.guestName = name;
    }

    localStorage.setItem(`${ROOM_STORAGE_KEY}-${room.roomId}`, JSON.stringify(room));
    setGameState(prev => ({ ...prev, room }));
  };

  // 온라인 게임 시작
  const startOnlineGame = () => {
    if (!gameState.room) return;

    const room = gameState.room;

    // 게임 시작 플래그 설정
    localStorage.setItem(`${ROOM_STORAGE_KEY}-${room.roomId}-started`, 'true');

    const initialPlayers: [Player, Player] = [
      { id: 1, name: room.hostName, score: 0, health: 100, currentInput: '', isCorrect: null },
      { id: 2, name: room.guestName || 'Player 2', score: 0, health: 100, currentInput: '', isCorrect: null },
    ];

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    setGameState(prev => ({
      ...prev,
      status: 'versus',
      players: initialPlayers,
      winner: null,
    }));
    setRoundWinner(null);
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

      // 체력이 0이 되면 게임 종료
      if (newHealth <= 0) {
        const winner = playerId === 1 ? 2 : 1;
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

        return {
          ...prev,
          status: 'versus-result',
          winner,
        };
      }

      // 다음 라운드
      const resetPlayers: [Player, Player] = [
        { ...prev.players[0], currentInput: '', isCorrect: null },
        { ...prev.players[1], currentInput: '', isCorrect: null },
      ];

      setRoundWinner(null);

      return {
        ...prev,
        currentLevelIndex: prev.currentLevelIndex + 1,
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

      {gameState.status === 'lobby' && gameState.room && (
        <LobbyScreen
          room={gameState.room}
          isHost={gameState.isHost || false}
          onStartGame={startOnlineGame}
          onLeave={leaveRoom}
          onUpdateName={updatePlayerName}
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
