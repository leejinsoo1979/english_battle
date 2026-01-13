
import React, { useState, useEffect } from 'react';
import { GameRoom } from '../types';
import robotImage from './images/robot.png';

interface Props {
  room: GameRoom;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
  onUpdateName: (name: string) => void;
}

const LobbyScreen: React.FC<Props> = ({ room, isHost, onStartGame, onLeave, onUpdateName }) => {
  const [copied, setCopied] = useState(false);
  const [playerName, setPlayerName] = useState(isHost ? room.hostName : (room.guestName || ''));
  const [isEditing, setIsEditing] = useState(false);

  const inviteLink = `${window.location.origin}${window.location.pathname}?room=${room.roomId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onUpdateName(playerName.trim());
      setIsEditing(false);
    }
  };

  const canStart = isHost && room.guestName && room.isReady;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#fef8ed' }}>
      <div className="max-w-md w-full">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-fredoka text-center bg-clip-text text-transparent bg-gradient-to-b from-orange-600 to-orange-400 mb-8">
          대전 대기실
        </h1>

        {/* Room Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Room ID */}
          <div className="text-center mb-6">
            <span className="text-sm text-gray-500">방 코드</span>
            <div className="text-2xl font-bold text-gray-800 font-mono">{room.roomId}</div>
          </div>

          {/* Players */}
          <div className="flex items-center justify-around mb-6">
            {/* Host (Player 1) */}
            <div className="text-center">
              <div className="relative">
                <img
                  src={robotImage}
                  alt="Player 1"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto"
                  style={{ filter: 'hue-rotate(200deg)' }}
                />
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-xs px-2 py-0.5 rounded-full font-bold">
                  HOST
                </div>
              </div>
              {isHost && isEditing ? (
                <form onSubmit={handleNameSubmit} className="mt-2">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-24 text-center text-sm border rounded px-1 py-0.5"
                    autoFocus
                    onBlur={handleNameSubmit}
                  />
                </form>
              ) : (
                <div
                  className="mt-2 font-bold text-blue-600 cursor-pointer hover:underline"
                  onClick={() => isHost && setIsEditing(true)}
                >
                  {room.hostName}
                  {isHost && <i className="fa-solid fa-pen text-xs ml-1 text-gray-400"></i>}
                </div>
              )}
              <div className="text-xs text-green-500 mt-1">
                <i className="fa-solid fa-circle text-[8px] mr-1"></i>준비완료
              </div>
            </div>

            {/* VS */}
            <div className="text-2xl font-fredoka text-orange-500">VS</div>

            {/* Guest (Player 2) */}
            <div className="text-center">
              {room.guestName ? (
                <>
                  <div className="relative">
                    <img
                      src={robotImage}
                      alt="Player 2"
                      className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto"
                      style={{ filter: 'hue-rotate(-30deg)' }}
                    />
                  </div>
                  {!isHost && isEditing ? (
                    <form onSubmit={handleNameSubmit} className="mt-2">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-24 text-center text-sm border rounded px-1 py-0.5"
                        autoFocus
                        onBlur={handleNameSubmit}
                      />
                    </form>
                  ) : (
                    <div
                      className="mt-2 font-bold text-red-600 cursor-pointer hover:underline"
                      onClick={() => !isHost && setIsEditing(true)}
                    >
                      {room.guestName}
                      {!isHost && <i className="fa-solid fa-pen text-xs ml-1 text-gray-400"></i>}
                    </div>
                  )}
                  <div className="text-xs text-green-500 mt-1">
                    <i className="fa-solid fa-circle text-[8px] mr-1"></i>준비완료
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                    <i className="fa-solid fa-user-plus text-2xl text-gray-400"></i>
                  </div>
                  <div className="mt-2 text-gray-400 font-medium">대기 중...</div>
                  <div className="text-xs text-gray-400 mt-1">
                    <i className="fa-solid fa-clock text-[8px] mr-1"></i>친구 초대
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Invite Link Section */}
          {isHost && !room.guestName && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 text-center mb-3">
                아래 링크를 친구에게 공유하세요
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <i className="fa-solid fa-check mr-1"></i>복사됨
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-copy mr-1"></i>복사
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onLeave}
            className="flex-1 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-xl font-semibold transition-colors"
          >
            나가기
          </button>
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                canStart
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canStart ? '게임 시작' : '상대 대기 중...'}
            </button>
          )}
          {!isHost && (
            <div className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold text-center">
              호스트 대기 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;
