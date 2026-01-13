
export interface PhonicsRule {
  name: string;
  indices: number[];
  color: string;
  description: string;
}

export interface QuizLevel {
  id: number;
  sentence: string; // e.g., "There is a ____."
  targetWord: string; // e.g., "monkey"
  imageHint: string; // URL or keyword
  distractors: string[];
  phonicsRules?: PhonicsRule[];
}

export interface Player {
  id: 1 | 2;
  name: string;
  score: number;
  currentInput: string;
  isCorrect: boolean | null;
}

export interface GameState {
  currentLevelIndex: number;
  score: number;
  timeLeft: number;
  status: 'playing' | 'level-complete' | 'game-over' | 'intro' | 'versus' | 'versus-result';
  gameMode: 'single' | 'versus';
  players?: [Player, Player];
  winner?: 1 | 2 | 'draw' | null;
}
