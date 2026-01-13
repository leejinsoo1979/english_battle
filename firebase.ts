import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update,
  remove,
  push,
  serverTimestamp,
  onDisconnect,
  DatabaseReference
} from 'firebase/database';

// Firebase 설정
// 아래 설정을 실제 Firebase 프로젝트 설정으로 교체해야 합니다.
//
// Firebase 프로젝트 생성 방법:
// 1. https://console.firebase.google.com 에서 새 프로젝트 생성
// 2. Realtime Database 활성화 (테스트 모드로 시작)
// 3. 프로젝트 설정 > 일반 > 웹 앱 추가에서 설정값 복사
// 4. 아래 firebaseConfig에 복사한 값 붙여넣기

const firebaseConfig = {
  // TODO: 실제 Firebase 설정으로 교체하세요
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface OnlinePlayer {
  id: string;
  name: string;
  score: number;
  health: number;
  currentAnswer: string;
  isReady: boolean;
  lastActive: number;
}

export interface OnlineRoom {
  id: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  currentLevel: number;
  currentQuestion?: {
    sentence: string;
    targetWord: string;
    imageHint: string;
    distractors: string[];
  };
  players: {
    host: OnlinePlayer;
    guest?: OnlinePlayer;
  };
  winner?: 'host' | 'guest' | 'draw';
  createdAt: number;
  gameStartedAt?: number;
}

// 랜덤 방 ID 생성 (6자리)
export const generateRoomId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 고유 플레이어 ID 생성
export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 방 생성
export const createOnlineRoom = async (hostName: string): Promise<{ roomId: string; playerId: string }> => {
  const roomId = generateRoomId();
  const playerId = generatePlayerId();
  const roomRef = ref(database, `rooms/${roomId}`);

  const roomData: OnlineRoom = {
    id: roomId,
    hostId: playerId,
    hostName: hostName,
    status: 'waiting',
    currentLevel: 0,
    players: {
      host: {
        id: playerId,
        name: hostName,
        score: 0,
        health: 100,
        currentAnswer: '',
        isReady: true,
        lastActive: Date.now()
      }
    },
    createdAt: Date.now()
  };

  await set(roomRef, roomData);

  // 연결 끊김 시 방 정리 설정
  const hostRef = ref(database, `rooms/${roomId}/players/host`);
  onDisconnect(hostRef).remove();

  return { roomId, playerId };
};

// 방 참가
export const joinOnlineRoom = async (roomId: string, guestName: string): Promise<{ success: boolean; playerId?: string; error?: string }> => {
  const roomRef = ref(database, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return { success: false, error: '존재하지 않는 방입니다.' };
  }

  const room = snapshot.val() as OnlineRoom;

  if (room.guestId) {
    return { success: false, error: '이미 다른 플레이어가 참가했습니다.' };
  }

  if (room.status !== 'waiting') {
    return { success: false, error: '이미 게임이 시작되었습니다.' };
  }

  const playerId = generatePlayerId();

  await update(roomRef, {
    guestId: playerId,
    guestName: guestName,
    status: 'ready',
    'players/guest': {
      id: playerId,
      name: guestName,
      score: 0,
      health: 100,
      currentAnswer: '',
      isReady: true,
      lastActive: Date.now()
    }
  });

  // 연결 끊김 시 게스트 정보 정리
  const guestRef = ref(database, `rooms/${roomId}/players/guest`);
  onDisconnect(guestRef).remove();

  return { success: true, playerId };
};

// 방 상태 실시간 구독
export const subscribeToRoom = (
  roomId: string,
  callback: (room: OnlineRoom | null) => void
): (() => void) => {
  const roomRef = ref(database, `rooms/${roomId}`);

  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as OnlineRoom);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// 게임 시작
export const startOnlineGame = async (roomId: string, question: OnlineRoom['currentQuestion']): Promise<void> => {
  const roomRef = ref(database, `rooms/${roomId}`);
  await update(roomRef, {
    status: 'playing',
    currentQuestion: question,
    gameStartedAt: Date.now()
  });
};

// 플레이어 답변 제출
export const submitAnswer = async (
  roomId: string,
  playerId: string,
  isHost: boolean,
  answer: string
): Promise<void> => {
  const playerPath = isHost ? 'players/host' : 'players/guest';
  const playerRef = ref(database, `rooms/${roomId}/${playerPath}`);

  await update(playerRef, {
    currentAnswer: answer,
    lastActive: Date.now()
  });
};

// 점수 및 체력 업데이트
export const updatePlayerStats = async (
  roomId: string,
  isHost: boolean,
  score: number,
  health: number
): Promise<void> => {
  const playerPath = isHost ? 'players/host' : 'players/guest';
  const playerRef = ref(database, `rooms/${roomId}/${playerPath}`);

  await update(playerRef, {
    score,
    health,
    lastActive: Date.now()
  });
};

// 다음 문제로 이동
export const nextQuestion = async (
  roomId: string,
  levelIndex: number,
  question: OnlineRoom['currentQuestion']
): Promise<void> => {
  const roomRef = ref(database, `rooms/${roomId}`);
  await update(roomRef, {
    currentLevel: levelIndex,
    currentQuestion: question,
    'players/host/currentAnswer': '',
    'players/guest/currentAnswer': ''
  });
};

// 게임 종료
export const endOnlineGame = async (
  roomId: string,
  winner: 'host' | 'guest' | 'draw'
): Promise<void> => {
  const roomRef = ref(database, `rooms/${roomId}`);
  await update(roomRef, {
    status: 'finished',
    winner
  });
};

// 방 삭제
export const deleteRoom = async (roomId: string): Promise<void> => {
  const roomRef = ref(database, `rooms/${roomId}`);
  await remove(roomRef);
};

// 방 나가기
export const leaveRoom = async (roomId: string, isHost: boolean): Promise<void> => {
  if (isHost) {
    // 호스트가 나가면 방 삭제
    await deleteRoom(roomId);
  } else {
    // 게스트가 나가면 게스트 정보만 삭제
    const roomRef = ref(database, `rooms/${roomId}`);
    await update(roomRef, {
      guestId: null,
      guestName: null,
      status: 'waiting',
      'players/guest': null
    });
  }
};

// 활성 방 목록 조회 (로비용)
export const getActiveRooms = async (): Promise<OnlineRoom[]> => {
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: OnlineRoom[] = [];
  const data = snapshot.val();

  Object.keys(data).forEach(key => {
    const room = data[key] as OnlineRoom;
    // 대기 중인 방만 표시
    if (room.status === 'waiting') {
      rooms.push(room);
    }
  });

  // 최신순 정렬
  rooms.sort((a, b) => b.createdAt - a.createdAt);

  return rooms;
};

export { database, ref, onValue, update, get };
