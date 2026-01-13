import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizLevel } from '../../types';
import { playSound } from '../../utils/sounds';

interface Props {
  level: QuizLevel;
  onPlayer1Answer: (answer: string) => void;
  onPlayer2Answer: (answer: string) => void;
  disabled: boolean;
}

const ListeningGame: React.FC<Props> = ({
  level,
  onPlayer1Answer,
  onPlayer2Answer,
  disabled,
}) => {
  const [player1Input, setPlayer1Input] = useState('');
  const [player2Input, setPlayer2Input] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const player1Ref = useRef<HTMLInputElement>(null);
  const player2Ref = useRef<HTMLInputElement>(null);

  const MAX_PLAYS = 3;

  // TTS 발음
  const speak = useCallback((text: string, rate: number = 0.8) => {
    if (isPlaying) return;

    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1;

    utterance.onend = () => {
      setIsPlaying(false);
      setPlayCount(prev => prev + 1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    playSound('pop', 0.2);
  }, [isPlaying]);

  // 레벨 변경 시 자동 재생
  useEffect(() => {
    setPlayer1Input('');
    setPlayer2Input('');
    setPlayCount(0);
    setShowHint(false);

    // 약간의 딜레이 후 자동 재생
    const timer = setTimeout(() => {
      speak(level.targetWord);
    }, 1000);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [level]);

  // 정답 제출 처리
  const handlePlayer1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1Input.trim() || disabled) return;

    if (player1Input.toLowerCase().trim() === level.targetWord.toLowerCase()) {
      playSound('fanfare', 0.5);
      onPlayer1Answer(player1Input.trim());
    } else {
      playSound('wrong', 0.3);
      setPlayer1Input('');
    }
  };

  const handlePlayer2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player2Input.trim() || disabled) return;

    if (player2Input.toLowerCase().trim() === level.targetWord.toLowerCase()) {
      playSound('fanfare', 0.5);
      onPlayer2Answer(player2Input.trim());
    } else {
      playSound('wrong', 0.3);
      setPlayer2Input('');
    }
  };

  // 키보드 포커스
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      if ((e.key === 'q' || e.key === 'Q') && document.activeElement !== player1Ref.current) {
        e.preventDefault();
        player1Ref.current?.focus();
      }
      if ((e.key === 'p' || e.key === 'P') && document.activeElement !== player2Ref.current) {
        e.preventDefault();
        player2Ref.current?.focus();
      }
      // 스페이스바로 다시 듣기
      if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        if (playCount < MAX_PLAYS) {
          speak(level.targetWord);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, playCount, level.targetWord, speak]);

  // 힌트 표시 (3번 다 들으면)
  useEffect(() => {
    if (playCount >= MAX_PLAYS) {
      setShowHint(true);
    }
  }, [playCount]);

  return (
    <div className="flex w-full h-full">
      {/* Player 1 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-sm text-blue-300 mb-2">Q키로 입력</div>
        <form onSubmit={handlePlayer1Submit} className="w-full max-w-xs">
          <input
            ref={player1Ref}
            type="text"
            value={player1Input}
            onChange={(e) => setPlayer1Input(e.target.value)}
            disabled={disabled}
            placeholder="들은 단어를 입력하세요"
            className="w-full px-4 py-3 text-xl text-center border-2 border-blue-500 rounded-xl focus:border-blue-400 focus:outline-none disabled:bg-gray-700 bg-gray-800 text-white placeholder-gray-500"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={disabled || !player1Input.trim()}
            className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/30"
          >
            제출 (Enter)
          </button>
        </form>
      </div>

      {/* 중앙 - 오디오 컨트롤 */}
      <div className="flex-1 flex flex-col items-center justify-center border-x border-gray-700/30 bg-black/20 p-6">
        <div className="text-sm text-gray-400 mb-6 uppercase tracking-widest">Listen & Type!</div>

        {/* 스피커 아이콘 */}
        <motion.button
          onClick={() => playCount < MAX_PLAYS && speak(level.targetWord)}
          disabled={isPlaying || playCount >= MAX_PLAYS}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-40 h-40 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-gradient-to-br from-green-500 to-green-600 animate-pulse'
              : playCount >= MAX_PLAYS
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
          }`}
          style={{
            boxShadow: isPlaying
              ? '0 0 60px rgba(34, 197, 94, 0.5)'
              : playCount < MAX_PLAYS
                ? '0 0 40px rgba(139, 92, 246, 0.4)'
                : 'none',
          }}
        >
          <motion.i
            animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className={`fa-solid text-5xl text-white ${
              isPlaying ? 'fa-volume-high' : 'fa-play'
            }`}
          />
        </motion.button>

        {/* 재생 횟수 표시 */}
        <div className="mt-6 flex gap-2">
          {[...Array(MAX_PLAYS)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < playCount
                  ? 'bg-purple-500 shadow-lg shadow-purple-500/50'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="mt-2 text-gray-500 text-sm">
          {playCount >= MAX_PLAYS
            ? '재생 횟수를 모두 사용했습니다'
            : `남은 횟수: ${MAX_PLAYS - playCount}회`}
        </div>

        {/* 힌트 (글자 수) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-800/50 rounded-xl"
        >
          <div className="text-gray-400 text-sm mb-2">힌트</div>
          <div className="flex gap-1 justify-center">
            {level.targetWord.split('').map((char, i) => (
              <div
                key={i}
                className={`w-8 h-10 flex items-center justify-center rounded border-2 font-bold text-lg ${
                  showHint
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                    : 'border-gray-600 bg-gray-800 text-gray-600'
                }`}
              >
                {showHint ? char.toUpperCase() : '_'}
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-gray-500 text-xs">
            {level.targetWord.length}글자
          </div>
        </motion.div>

        {/* 속도 조절 버튼 */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => speak(level.targetWord, 0.5)}
            disabled={isPlaying || playCount >= MAX_PLAYS}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            <i className="fa-solid fa-turtle mr-1"></i> 느리게
          </button>
          <button
            onClick={() => speak(level.targetWord, 1)}
            disabled={isPlaying || playCount >= MAX_PLAYS}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            <i className="fa-solid fa-rabbit-running mr-1"></i> 빠르게
          </button>
        </div>

        <div className="mt-4 text-gray-600 text-xs">
          스페이스바를 눌러 다시 듣기
        </div>
      </div>

      {/* Player 2 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-sm text-red-300 mb-2">P키로 입력</div>
        <form onSubmit={handlePlayer2Submit} className="w-full max-w-xs">
          <input
            ref={player2Ref}
            type="text"
            value={player2Input}
            onChange={(e) => setPlayer2Input(e.target.value)}
            disabled={disabled}
            placeholder="들은 단어를 입력하세요"
            className="w-full px-4 py-3 text-xl text-center border-2 border-red-500 rounded-xl focus:border-red-400 focus:outline-none disabled:bg-gray-700 bg-gray-800 text-white placeholder-gray-500"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={disabled || !player2Input.trim()}
            className="w-full mt-3 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-red-500/30"
          >
            제출 (Enter)
          </button>
        </form>
      </div>
    </div>
  );
};

export default ListeningGame;
