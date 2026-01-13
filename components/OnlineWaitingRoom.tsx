import React, { useState, useEffect, useRef } from 'react';
import { peerConnection, generateRoomCode, GameMessage } from '../peerConnection';

interface Props {
  roomId?: string;
  onGameStart: (roomId: string, isHost: boolean, hostName: string, guestName: string) => void;
  onBack: () => void;
}

const OnlineWaitingRoom: React.FC<Props> = ({ roomId: initialRoomId, onGameStart, onBack }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'waiting'>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomIdInput, setRoomIdInput] = useState(initialRoomId || '');
  const [isHost, setIsHost] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [hostName, setHostName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const countdownRef = useRef<number | null>(null);

  // URL 파라미터로 방 ID가 전달되면 자동으로 참가 모드로
  useEffect(() => {
    if (initialRoomId) {
      setMode('join');
      setRoomIdInput(initialRoomId);
    }
  }, [initialRoomId]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // 메시지 핸들러 설정
  useEffect(() => {
    peerConnection.onMessage((message: GameMessage) => {
      console.log('Received message:', message);

      switch (message.type) {
        case 'join':
          // 게스트가 참가함 (호스트가 받음)
          setGuestName(message.payload.name);
          setIsConnected(true);
          // 호스트 이름 게스트에게 전송
          peerConnection.send({
            type: 'sync',
            payload: { hostName: playerName }
          });
          break;

        case 'sync':
          // 호스트 정보 수신 (게스트가 받음)
          if (message.payload.hostName) {
            setHostName(message.payload.hostName);
          }
          break;

        case 'start':
          // 게임 시작 (게스트가 받음)
          startCountdown(() => {
            onGameStart(roomId || roomIdInput, false, message.payload.hostName, playerName);
          });
          break;
      }
    });

    peerConnection.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected && mode === 'waiting') {
        setError('연결이 끊어졌습니다.');
      }
    });
  }, [playerName, roomId, roomIdInput, mode, onGameStart]);

  // 카운트다운 시작
  const startCountdown = (callback: () => void) => {
    setCountdown(3);
    let count = 3;

    countdownRef.current = window.setInterval(() => {
      count--;
      if (count <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        setCountdown(null);
        callback();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  // 방 생성
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newRoomId = generateRoomCode();
      await peerConnection.createRoom(newRoomId);
      setRoomId(newRoomId);
      setHostName(playerName.trim());
      setIsHost(true);
      setMode('waiting');
    } catch (err: any) {
      setError(err.message || '방 생성에 실패했습니다.');
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
      const code = roomIdInput.trim().toUpperCase();
      await peerConnection.joinRoom(code);
      setRoomId(code);
      setIsHost(false);
      setIsConnected(true);
      setMode('waiting');

      // 호스트에게 참가 알림
      setTimeout(() => {
        peerConnection.send({
          type: 'join',
          payload: { name: playerName.trim() }
        });
      }, 500);
    } catch (err: any) {
      setError(err.message || '방 참가에 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 게임 시작 (호스트만)
  const handleStartGame = () => {
    if (!isHost || !guestName) return;

    // 게스트에게 게임 시작 알림
    peerConnection.send({
      type: 'start',
      payload: { hostName: playerName }
    });

    // 호스트도 카운트다운 시작
    startCountdown(() => {
      onGameStart(roomId, true, playerName, guestName);
    });
  };

  // 나가기
  const handleLeave = () => {
    peerConnection.cleanup();
    setRoomId('');
    setGuestName('');
    setHostName('');
    setIsConnected(false);
    setMode('select');
    onBack();
  };

  // 초대 링크 복사
  const copyInviteLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 카운트다운 오버레이
  if (countdown !== null) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="text-center">
          <div className="text-9xl font-fredoka text-yellow-400 animate-bounce">
            {countdown}
          </div>
          <p className="text-2xl text-white mt-4">게임 시작!</p>
        </div>
      </div>
    );
  }

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
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
            {roomId}
          </p>
        </div>

        {/* 초대 링크 복사 버튼 (호스트만) */}
        {isHost && (
          <button
            onClick={copyInviteLink}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors mb-6 flex items-center justify-center gap-2"
          >
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'}`}></i>
            {copied ? '링크가 복사되었습니다!' : '초대 링크 복사'}
          </button>
        )}

        {/* 플레이어 목록 */}
        <div className="space-y-3 mb-6">
          {/* 호스트 */}
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-crown text-yellow-300"></i>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">{isHost ? playerName : hostName || '호스트'}</p>
              <p className="text-green-400 text-xs">호스트</p>
            </div>
            <span className="text-green-400 text-sm">준비 완료</span>
          </div>

          {/* 게스트 */}
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            {(isHost ? guestName : isConnected) ? (
              <>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-user text-white"></i>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{isHost ? guestName : playerName}</p>
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

        {/* 연결 상태 */}
        <div className={`text-center text-sm mb-4 ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
          {isHost ? (
            guestName ? (
              <span><i className="fa-solid fa-circle text-green-400 mr-2"></i>상대방 연결됨</span>
            ) : (
              <span><i className="fa-solid fa-circle text-yellow-400 animate-pulse mr-2"></i>상대방 대기 중...</span>
            )
          ) : (
            isConnected ? (
              <span><i className="fa-solid fa-circle text-green-400 mr-2"></i>호스트에 연결됨</span>
            ) : (
              <span><i className="fa-solid fa-circle text-yellow-400 animate-pulse mr-2"></i>연결 중...</span>
            )
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* 게임 시작 버튼 (호스트만, 게스트 연결 시) */}
        {isHost && guestName && (
          <button
            onClick={handleStartGame}
            className="w-full px-4 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors mb-3 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-play"></i>
            게임 시작!
          </button>
        )}

        {/* 게스트 대기 메시지 */}
        {!isHost && isConnected && (
          <div className="bg-blue-600/30 border border-blue-500 text-blue-300 rounded-lg p-4 text-center mb-3">
            <i className="fa-solid fa-clock mr-2"></i>
            호스트가 게임을 시작하면 자동으로 시작됩니다
          </div>
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
