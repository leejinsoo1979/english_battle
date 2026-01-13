import Peer, { DataConnection } from 'peerjs';

export interface GameMessage {
  type: 'join' | 'start' | 'answer' | 'health' | 'next' | 'end' | 'sync';
  payload: any;
}

export interface PeerGameState {
  isConnected: boolean;
  isHost: boolean;
  peerId: string;
  remotePeerId: string | null;
  hostName: string;
  guestName: string;
}

class PeerConnection {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private onMessageCallback: ((message: GameMessage) => void) | null = null;
  private onConnectionCallback: ((connected: boolean) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  // 방 ID로 Peer 생성 (호스트)
  async createRoom(roomId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // 기존 연결 정리
      this.cleanup();

      const peerId = `phonics-${roomId}`;

      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('Host peer opened:', id);
        resolve(roomId);
      });

      this.peer.on('connection', (conn) => {
        console.log('Guest connected:', conn.peer);
        this.connection = conn;
        this.setupConnectionHandlers(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (err.type === 'unavailable-id') {
          reject(new Error('이미 사용 중인 방 코드입니다. 다시 시도해주세요.'));
        } else {
          reject(err);
        }
      });

      // 타임아웃
      setTimeout(() => {
        if (!this.peer?.open) {
          reject(new Error('연결 시간 초과'));
        }
      }, 10000);
    });
  }

  // 방에 참가 (게스트)
  async joinRoom(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 기존 연결 정리
      this.cleanup();

      const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      this.peer = new Peer(guestId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });

      this.peer.on('open', () => {
        console.log('Guest peer opened, connecting to host...');
        const hostPeerId = `phonics-${roomId}`;

        const conn = this.peer!.connect(hostPeerId, {
          reliable: true,
        });

        conn.on('open', () => {
          console.log('Connected to host!');
          this.connection = conn;
          this.setupConnectionHandlers(conn);
          resolve();
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          reject(new Error('방에 연결할 수 없습니다.'));
        });

        // 연결 타임아웃
        setTimeout(() => {
          if (!conn.open) {
            reject(new Error('존재하지 않는 방이거나 연결할 수 없습니다.'));
          }
        }, 10000);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        if (err.type === 'peer-unavailable') {
          reject(new Error('존재하지 않는 방입니다.'));
        } else {
          reject(err);
        }
      });
    });
  }

  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('data', (data) => {
      console.log('Received data:', data);
      if (this.onMessageCallback) {
        this.onMessageCallback(data as GameMessage);
      }
    });

    conn.on('open', () => {
      console.log('Connection opened');
      this.reconnectAttempts = 0;
      if (this.onConnectionCallback) {
        this.onConnectionCallback(true);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed');
      if (this.onConnectionCallback) {
        this.onConnectionCallback(false);
      }
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }

  // 메시지 전송
  send(message: GameMessage): boolean {
    if (this.connection?.open) {
      this.connection.send(message);
      return true;
    }
    console.warn('No open connection to send message');
    return false;
  }

  // 메시지 수신 콜백 설정
  onMessage(callback: (message: GameMessage) => void) {
    this.onMessageCallback = callback;
  }

  // 연결 상태 변경 콜백
  onConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionCallback = callback;
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.connection?.open ?? false;
  }

  // Peer ID 가져오기
  getPeerId(): string | null {
    return this.peer?.id ?? null;
  }

  // 연결 정리
  cleanup() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.onMessageCallback = null;
    this.onConnectionCallback = null;
  }
}

// 싱글톤 인스턴스
export const peerConnection = new PeerConnection();

// 방 코드 생성
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
