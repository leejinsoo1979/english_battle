import React, { useState, useEffect, useRef } from 'react';
import {
  createOnlineRoom,
  joinOnlineRoom,
  subscribeToRoom,
  leaveRoom,
  OnlineRoom
} from '../firebase';

interface Props {
  roomId?: string; // URL에서 전달받은 방 ID (참가 시)
  onGameStart: (room: OnlineRoom, isHost: boolean, playerId: string) => void;
  onBack: () => void;
}

const OnlineWaitingRoom: React.FC<Props> = ({ roomId: initialRoomId, onGameStart, onBack }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'waiting'>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState(initialRoomId || '');
  const [currentRoom, setCurrentRoom] = useState<OnlineRoom | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // URL 파라미터로 방 ID가 전달되면 자동으로 참가 모드로
  useEffect(() => {
    if (initialRoomId) {
      setMode('join');
      setRoomIdInput(initialRoomId);
    }
  }, [initialRoomId]);

  // 방 상태 구독
  useEffect(() => {
    if (currentRoom?.id && mode === 'waiting') {
      unsubscribeRef.current = subscribeToRoom(currentRoom.id, (room) => {
        if (room) {
          setCurrentRoom(room);

          // 게스트가 참가하고 양쪽 다 준비되면 게임 시작
          if (room.status === 'ready' || room.status === 'playing') {
            if (room.players.host && room.players.guest) {
              // 약간의 딜레이 후 게임 시작
              setTimeout(() => {
                onGameStart(room, isHost, playerId);
              }, 1500);
            }
          }
        } else {
          // 방이 삭제됨
          setError('방이 종료되었습니다.');
          setMode('select');
          setCurrentRoom(null);
        }
      });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentRoom?.id, mode, isHost, playerId, onGameStart]);

  // 방 생성
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { roomId, playerId: newPlayerId } = await createOnlineRoom(playerName.trim());
      setPlayerId(newPlayerId);
      setIsHost(true);
      setCurrentRoom({
        id: roomId,
        hostId: newPlayerId,
        hostName: playerName.trim(),
        status: 'waiting',
        currentLevel: 0,
        players: {
          host: {
            id: newPlayerId,
            name: playerName.trim(),
            score: 0,
            health: 100,
            currentAnswer: '',
            isReady: true,
            lastActive: Date.now()
          }
        },
        createdAt: Date.now()
      });
      setMode('waiting');
    } catch (err) {
      setError('방 생성에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 방 참가
  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!roomIdInput.trim()) {
      setError('방 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await joinOnlineRoom(roomIdInput.trim().toUpperCase(), playerName.trim());

      if (result.success && result.playerId) {
        setPlayerId(result.playerId);
        setIsHost(false);
        // 방 상태 구독 시작
        setCurrentRoom({ id: roomIdInput.trim().toUpperCase() } as OnlineRoom);
        setMode('waiting');
      } else {
        setError(result.error || '참가에 실패했습니다.');
      }
    } catch (err) {
      setError('방 참가에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 나가기
  const handleLeave = async () => {
    if (currentRoom?.id) {
      try {
        await leaveRoom(currentRoom.id, isHost);
      } catch (err) {
        console.error(err);
      }
    }
    setCurrentRoom(null);
    setMode('select');
    onBack();
  };

  // 초대 링크 복사
  const copyInviteLink = () => {
    if (currentRoom?.id) {
      const link = `${window.location.origin}${window.location.pathname}?room=${currentRoom.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 모드 선택 화면
  if (mode === 'select') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
        <h1 className="text-3xl font-fredoka text-white mb-8">온라인 대전</h1>

        <div className="flex flex-col gap-4 w-72">
          <button
            onClick={() => setMode('create')}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            <span>방 만들기</span>
          </button>

          <button
            onClick={() => setMode('join')}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-door-open"></i>
            <span>방 참가하기</span>
          </button>

          <button
            onClick={onBack}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 방 생성 화면
  if (mode === 'create') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
        <h1 className="text-3xl font-fredoka text-white mb-8">방 만들기</h1>

        <div className="flex flex-col gap-4 w-80">
          <div>
            <label className="text-white text-sm mb-2 block">닉네임</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-green-500 focus:outline-none"
              maxLength={10}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="loader w-5 h-5"></div>
                생성 중...
              </span>
            ) : (
              '방 생성'
            )}
          </button>

          <button
            onClick={() => setMode('select')}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 방 참가 화면
  if (mode === 'join') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
        <h1 className="text-3xl font-fredoka text-white mb-8">방 참가하기</h1>

        <div className="flex flex-col gap-4 w-80">
          <div>
            <label className="text-white text-sm mb-2 block">닉네임</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
              maxLength={10}
            />
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">방 코드</label>
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              placeholder="6자리 방 코드"
              className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none text-center tracking-widest text-xl font-mono"
              maxLength={6}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleJoinRoom}
            disabled={isLoading}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="loader w-5 h-5"></div>
                참가 중...
              </span>
            ) : (
              '참가하기'
            )}
          </button>

          <button
            onClick={() => setMode('select')}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg transition-colors shadow-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 대기실 화면
  return (
    <div className="h-full w-full flex flex-col items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl w-96">
        <h1 className="text-2xl font-fredoka text-white mb-6 text-center">대기실</h1>

        {/* 방 코드 */}
        <div className="bg-gray-900 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm mb-2 text-center">방 코드</p>
          <p className="text-4xl font-mono font-bold text-yellow-400 text-center tracking-widest">
            {currentRoom?.id}
          </p>
        </div>

        {/* 초대 링크 복사 버튼 */}
        <button
          onClick={copyInviteLink}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors mb-6 flex items-center justify-center gap-2"
        >
          <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'}`}></i>
          {copied ? '링크가 복사되었습니다!' : '초대 링크 복사'}
        </button>

        {/* 플레이어 목록 */}
        <div className="space-y-3 mb-6">
          {/* 호스트 */}
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-crown text-yellow-300"></i>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">{currentRoom?.hostName || playerName}</p>
              <p className="text-green-400 text-xs">호스트</p>
            </div>
            <span className="text-green-400 text-sm">준비 완료</span>
          </div>

          {/* 게스트 */}
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            {currentRoom?.guestName ? (
              <>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-user text-white"></i>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{currentRoom.guestName}</p>
                  <p className="text-blue-400 text-xs">게스트</p>
                </div>
                <span className="text-green-400 text-sm">준비 완료</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-hourglass-half text-gray-400 animate-pulse"></i>
                </div>
                <div className="flex-1">
                  <p className="text-gray-400">대기 중...</p>
                  <p className="text-gray-500 text-xs">친구를 초대하세요</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 게임 시작 상태 */}
        {currentRoom?.status === 'ready' && (
          <div className="bg-green-600 text-white rounded-lg p-4 text-center mb-4 animate-pulse">
            <i className="fa-solid fa-gamepad mr-2"></i>
            게임을 시작합니다!
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* 나가기 버튼 */}
        <button
          onClick={handleLeave}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
        >
          나가기
        </button>
      </div>
    </div>
  );
};

export default OnlineWaitingRoom;
