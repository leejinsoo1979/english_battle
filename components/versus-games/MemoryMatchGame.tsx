import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizLevel } from '../../types';
import { playSound } from '../../utils/sounds';

interface Props {
  level: QuizLevel;
  onPlayer1Answer: (answer: string) => void;
  onPlayer2Answer: (answer: string) => void;
  disabled: boolean;
}

interface Card {
  id: string;
  content: string;
  type: 'letter' | 'position';
  isFlipped: boolean;
  isMatched: boolean;
  letterIndex: number;
}

const MemoryMatchGame: React.FC<Props> = ({
  level,
  onPlayer1Answer,
  onPlayer2Answer,
  disabled,
}) => {
  const targetWord = level.targetWord.toUpperCase();

  // 카드 생성 - 각 글자와 위치 번호 매칭
  const generateCards = useMemo(() => {
    const cards: Card[] = [];

    targetWord.split('').forEach((char, i) => {
      // 글자 카드
      cards.push({
        id: `letter-${i}`,
        content: char,
        type: 'letter',
        isFlipped: false,
        isMatched: false,
        letterIndex: i,
      });
      // 위치 번호 카드
      cards.push({
        id: `position-${i}`,
        content: `${i + 1}`,
        type: 'position',
        isFlipped: false,
        isMatched: false,
        letterIndex: i,
      });
    });

    // 셔플
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
  }, [targetWord]);

  const [player1Cards, setPlayer1Cards] = useState<Card[]>([]);
  const [player2Cards, setPlayer2Cards] = useState<Card[]>([]);
  const [player1Selected, setPlayer1Selected] = useState<Card[]>([]);
  const [player2Selected, setPlayer2Selected] = useState<Card[]>([]);
  const [player1Matches, setPlayer1Matches] = useState(0);
  const [player2Matches, setPlayer2Matches] = useState(0);
  const [player1Turn, setPlayer1Turn] = useState(true);
  const [player2Turn, setPlayer2Turn] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  // 초기화
  useEffect(() => {
    const p1Cards = generateCards.map(c => ({ ...c, id: `p1-${c.id}` }));
    const p2Cards = generateCards.map(c => ({ ...c, id: `p2-${c.id}` }));
    setPlayer1Cards(p1Cards);
    setPlayer2Cards(p2Cards);
    setPlayer1Selected([]);
    setPlayer2Selected([]);
    setPlayer1Matches(0);
    setPlayer2Matches(0);
    setPlayer1Turn(true);
    setPlayer2Turn(true);

    const timer = setTimeout(() => {
      setGameStarted(true);
      playSound('fight', 0.5);
    }, 1000);

    return () => clearTimeout(timer);
  }, [level, generateCards]);

  // 카드 클릭
  const handleCardClick = (cardId: string, player: 1 | 2) => {
    if (disabled || !gameStarted) return;

    const cards = player === 1 ? player1Cards : player2Cards;
    const setCards = player === 1 ? setPlayer1Cards : setPlayer2Cards;
    const selected = player === 1 ? player1Selected : player2Selected;
    const setSelected = player === 1 ? setPlayer1Selected : setPlayer2Selected;
    const turn = player === 1 ? player1Turn : player2Turn;
    const setTurn = player === 1 ? setPlayer1Turn : setPlayer2Turn;
    const matches = player === 1 ? player1Matches : player2Matches;
    const setMatches = player === 1 ? setPlayer1Matches : setPlayer2Matches;

    if (!turn) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // 카드 뒤집기
    playSound('pop', 0.2);
    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newSelected = [...selected, { ...card, isFlipped: true }];
    setSelected(newSelected);

    // 2장 선택 완료
    if (newSelected.length === 2) {
      setTurn(false);

      const [first, second] = newSelected;

      // 매칭 체크 (글자와 위치가 같은 index)
      if (first.letterIndex === second.letterIndex && first.type !== second.type) {
        // 매칭 성공!
        playSound('fanfare', 0.3);
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.letterIndex === first.letterIndex ? { ...c, isMatched: true } : c
            )
          );
          setSelected([]);
          setTurn(true);

          const newMatches = matches + 1;
          setMatches(newMatches);

          // 모든 매칭 완료
          if (newMatches === targetWord.length) {
            playSound('fanfare', 0.5);
            if (player === 1) {
              onPlayer1Answer(targetWord);
            } else {
              onPlayer2Answer(targetWord);
            }
          }
        }, 500);
      } else {
        // 매칭 실패
        playSound('wrong', 0.2);
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              newSelected.some(s => s.id === c.id) ? { ...c, isFlipped: false } : c
            )
          );
          setSelected([]);
          setTurn(true);
        }, 1000);
      }
    }
  };

  // 카드 컴포넌트
  const CardComponent: React.FC<{
    card: Card;
    onClick: () => void;
    color: 'blue' | 'red';
  }> = ({ card, onClick, color }) => (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative w-14 h-16 md:w-16 md:h-20 rounded-xl cursor-pointer perspective-1000 ${
        card.isMatched ? 'opacity-50' : ''
      }`}
      disabled={card.isMatched}
    >
      <motion.div
        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full relative preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 카드 뒷면 */}
        <div
          className={`absolute inset-0 rounded-xl flex items-center justify-center backface-hidden ${
            color === 'blue'
              ? 'bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400'
              : 'bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-2xl">?</span>
        </div>

        {/* 카드 앞면 */}
        <div
          className={`absolute inset-0 rounded-xl flex items-center justify-center backface-hidden ${
            card.type === 'letter'
              ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
              : 'bg-gradient-to-br from-green-500 to-emerald-600'
          } border-2 ${
            card.type === 'letter' ? 'border-yellow-300' : 'border-green-300'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="font-fredoka text-2xl text-white">
            {card.type === 'letter' ? card.content : `#${card.content}`}
          </span>
        </div>
      </motion.div>
    </motion.button>
  );

  // 진행도 표시
  const ProgressDisplay: React.FC<{ cards: Card[]; color: string }> = ({ cards, color }) => (
    <div className="flex gap-1 justify-center">
      {targetWord.split('').map((char, i) => {
        const isMatched = cards.some(c => c.letterIndex === i && c.isMatched);
        return (
          <div
            key={i}
            className={`w-8 h-10 flex items-center justify-center rounded-lg border-2 font-bold text-lg ${
              isMatched
                ? 'border-green-500 bg-green-500/30 text-green-400'
                : `border-${color}-500/50 bg-gray-800/50 text-gray-500`
            }`}
          >
            {isMatched ? char : '_'}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="relative w-full h-full flex">
      {/* Player 1 영역 */}
      <div className="w-2/5 h-full flex flex-col items-center justify-center p-4 bg-blue-950/30">
        <div className="text-blue-400 font-bold text-lg mb-2">Player 1</div>
        <div className="text-sm text-blue-300 mb-4">클릭으로 카드 뒤집기</div>

        <ProgressDisplay cards={player1Cards} color="blue" />

        <div className="mt-4 grid grid-cols-4 gap-2">
          {player1Cards.map(card => (
            <CardComponent
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card.id, 1)}
              color="blue"
            />
          ))}
        </div>

        <div className="mt-4 text-blue-300">
          매칭: {player1Matches} / {targetWord.length}
        </div>
      </div>

      {/* 중앙 힌트 */}
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-black/40 border-x border-gray-700/50">
        <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">Memory Match!</div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-yellow-500/30"
        >
          <img src={level.imageHint} alt="hint" className="w-full h-full object-cover" />
        </motion.div>

        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
          <div className="text-gray-400 text-sm mb-2 text-center">규칙</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>🔤 글자와 위치(#번호)를 매칭</div>
            <div>🎯 1번 글자 = #1 카드</div>
            <div>⚡ 빠르게 모두 매칭하면 승리!</div>
          </div>
        </div>

        <div className="mt-4 text-2xl font-fredoka text-yellow-400">
          {targetWord.length}글자
        </div>
      </div>

      {/* Player 2 영역 */}
      <div className="w-2/5 h-full flex flex-col items-center justify-center p-4 bg-red-950/30">
        <div className="text-red-400 font-bold text-lg mb-2">Player 2</div>
        <div className="text-sm text-red-300 mb-4">클릭으로 카드 뒤집기</div>

        <ProgressDisplay cards={player2Cards} color="red" />

        <div className="mt-4 grid grid-cols-4 gap-2">
          {player2Cards.map(card => (
            <CardComponent
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card.id, 2)}
              color="red"
            />
          ))}
        </div>

        <div className="mt-4 text-red-300">
          매칭: {player2Matches} / {targetWord.length}
        </div>
      </div>
    </div>
  );
};

export default MemoryMatchGame;
