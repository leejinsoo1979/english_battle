
import React, { useState, useEffect, useRef } from 'react';
import { QuizLevel, Player } from '../types';
import robotImage from './images/robot.png';

interface Props {
  level: QuizLevel;
  players: [Player, Player];
  onAnswer: (playerId: 1 | 2, answer: string) => void;
  onNextLevel: () => void;
  roundWinner: 1 | 2 | null;
  currentRound: number;
  totalRounds: number;
  onHealthUpdate?: (playerId: 1 | 2, damage: number) => void;
  isPlayer2Connected?: boolean;
  onInvite?: () => void;
  onPlayer2Join?: () => void;
  inviteLink?: string;
}

// 에너지 게이지 컴포넌트 (라이트 스타일)
const HealthBar: React.FC<{
  health: number;
  maxHealth: number;
  isLeft: boolean;
  playerName: string;
  showDamage: boolean;
}> = ({ health, maxHealth, isLeft, playerName, showDamage }) => {
  const percentage = (health / maxHealth) * 100;

  // 라이트 스타일 색상
  const getBarGradient = () => {
    if (percentage > 50) {
      return isLeft
        ? 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)'
        : 'linear-gradient(270deg, #ef4444, #f87171, #fca5a5)';
    } else if (percentage > 25) {
      return 'linear-gradient(90deg, #f59e0b, #fbbf24, #fcd34d)';
    }
    return 'linear-gradient(90deg, #ef4444, #f87171, #fca5a5)';
  };

  return (
    <div className={`flex-1 ${isLeft ? 'pr-3' : 'pl-3'}`}>
      <div className={`flex items-center gap-2 mb-1.5 ${isLeft ? '' : 'flex-row-reverse'}`}>
        <span className={`font-bold text-sm ${isLeft ? 'text-blue-600' : 'text-red-600'}`}>
          {playerName}
        </span>
        <span className="text-xs text-gray-400 tabular-nums">{health}</span>
      </div>
      <div className={`relative h-6 bg-gray-100 rounded-full overflow-hidden border ${isLeft ? 'border-blue-200' : 'border-red-200'}`}>
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-gray-300"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>
        {/* 체력바 */}
        <div
          className={`absolute top-0 bottom-0 transition-all duration-500 rounded-full ${isLeft ? 'left-0' : 'right-0'}`}
          style={{
            width: `${percentage}%`,
            background: getBarGradient(),
            boxShadow: percentage <= 25 ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
          }}
        >
          {/* 광택 효과 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/10 rounded-full" />
        </div>
        {/* 데미지 효과 */}
        {showDamage && (
          <div className="absolute inset-0 bg-white/80 animate-pulse rounded-full" />
        )}
      </div>
    </div>
  );
};

// 스트리트 파이터 스타일 공격 이펙트 컴포넌트
const AttackEffect: React.FC<{ direction: 'left' | 'right'; onComplete: () => void }> = ({ direction, onComplete }) => {
  const [phase, setPhase] = useState<'charge' | 'attack' | 'impact'>('charge');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const chargeTimer = setTimeout(() => setPhase('attack'), 200);
    const attackTimer = setTimeout(() => setPhase('impact'), 500);
    const completeTimer = setTimeout(onComplete, 1200);

    return () => {
      clearTimeout(chargeTimer);
      clearTimeout(attackTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Canvas 기반 파티클 효과
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isLeft = direction === 'left';
    const attackerColor = isLeft ? { r: 59, g: 130, b: 246 } : { r: 239, g: 68, b: 68 };
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
      color: { r: number; g: number; b: number };
    }> = [];

    const impactX = isLeft ? canvas.width * 0.7 : canvas.width * 0.3;
    const impactY = canvas.height * 0.5;

    let animationId: number;

    const createParticles = () => {
      if (phase === 'impact') {
        // 폭발 파티클
        for (let i = 0; i < 50; i++) {
          const angle = (Math.PI * 2 * i) / 50 + Math.random() * 0.5;
          const speed = 5 + Math.random() * 15;
          particles.push({
            x: impactX,
            y: impactY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 8,
            life: 1,
            maxLife: 1,
            color: Math.random() > 0.5 ? attackerColor : { r: 255, g: 255, b: 255 },
          });
        }
        // 스파크
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: impactX,
            y: impactY,
            vx: Math.cos(angle) * (10 + Math.random() * 20),
            vy: Math.sin(angle) * (10 + Math.random() * 20),
            size: 2 + Math.random() * 3,
            life: 1,
            maxLife: 1,
            color: { r: 255, g: 200 + Math.random() * 55, b: 50 },
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 파티클 업데이트 및 렌더링
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // 중력
        p.vx *= 0.98; // 감속
        p.life -= 0.02;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
        ctx.fill();

        // 글로우 효과
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.3})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    if (phase === 'impact') {
      createParticles();
    }
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [phase, direction]);

  const isLeft = direction === 'left';
  const attackerColor = isLeft ? '#3B82F6' : '#EF4444';
  const impactX = isLeft ? '70%' : '30%';

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* 화면 흔들림 */}
      {phase === 'impact' && (
        <style>{`
          @keyframes screen-shake {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-15px, -10px); }
            20% { transform: translate(15px, 10px); }
            30% { transform: translate(-10px, 15px); }
            40% { transform: translate(10px, -15px); }
            50% { transform: translate(-15px, 5px); }
            60% { transform: translate(15px, -5px); }
            70% { transform: translate(-5px, 15px); }
            80% { transform: translate(5px, -15px); }
            90% { transform: translate(-10px, 10px); }
          }
        `}</style>
      )}

      {/* 차징 이펙트 */}
      {phase === 'charge' && (
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: isLeft ? '15%' : 'auto', right: isLeft ? 'auto' : '15%' }}
        >
          {/* 에너지 코어 */}
          <div
            className="w-24 h-24 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, white 0%, ${attackerColor} 50%, transparent 80%)`,
              boxShadow: `0 0 60px ${attackerColor}, 0 0 120px ${attackerColor}`,
              animation: 'pulse 0.2s ease-in-out infinite',
            }}
          />
          {/* 회전하는 에너지 링 */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                borderColor: `${attackerColor}`,
                borderStyle: 'dashed',
                opacity: 0.8 - i * 0.2,
                animation: `spin ${0.3 + i * 0.1}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
              }}
            />
          ))}
        </div>
      )}

      {/* 에너지 빔 공격 */}
      {phase === 'attack' && (
        <>
          {/* 메인 빔 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-16"
            style={{
              left: isLeft ? '15%' : 'auto',
              right: isLeft ? 'auto' : '15%',
              width: '55%',
              background: `linear-gradient(${isLeft ? '90deg' : '270deg'},
                ${attackerColor} 0%,
                white 30%,
                ${attackerColor} 60%,
                transparent 100%)`,
              boxShadow: `0 0 30px ${attackerColor}, 0 0 60px ${attackerColor}, 0 0 90px white`,
              borderRadius: '8px',
              animation: 'beam-extend 0.3s ease-out forwards',
            }}
          />
          {/* 빔 코어 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-6"
            style={{
              left: isLeft ? '15%' : 'auto',
              right: isLeft ? 'auto' : '15%',
              width: '55%',
              background: 'white',
              boxShadow: '0 0 20px white',
              borderRadius: '4px',
              animation: 'beam-extend 0.25s ease-out forwards',
            }}
          />
          {/* 에너지 파동 */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
              style={{
                left: isLeft ? `${20 + i * 12}%` : 'auto',
                right: isLeft ? 'auto' : `${20 + i * 12}%`,
                background: `radial-gradient(circle, white, ${attackerColor})`,
                boxShadow: `0 0 20px ${attackerColor}`,
                animation: `wave-pulse 0.3s ease-out ${i * 0.05}s forwards`,
                opacity: 1 - i * 0.15,
              }}
            />
          ))}
        </>
      )}

      {/* 임팩트 이펙트 */}
      {phase === 'impact' && (
        <>
          {/* 화면 플래시 */}
          <div
            className="absolute inset-0"
            style={{
              background: 'white',
              animation: 'flash 0.15s ease-out forwards',
            }}
          />

          {/* 폭발 코어 */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: impactX }}
          >
            <div
              className="w-40 h-40 rounded-full"
              style={{
                background: `radial-gradient(circle, white 0%, ${attackerColor} 30%, orange 60%, transparent 80%)`,
                boxShadow: `0 0 80px ${attackerColor}, 0 0 150px orange, 0 0 200px white`,
                animation: 'explosion 0.4s ease-out forwards',
              }}
            />

            {/* 충격파 링 */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: '30px',
                  height: '30px',
                  border: `${4 - i * 0.5}px solid ${i % 2 === 0 ? 'white' : attackerColor}`,
                  animation: `shockwave-ring 0.6s ease-out ${i * 0.1}s forwards`,
                }}
              />
            ))}

            {/* 방사형 라이트 빔 */}
            {[...Array(16)].map((_, i) => {
              const angle = (360 / 16) * i;
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    width: '4px',
                    height: '150px',
                    background: `linear-gradient(to top, ${attackerColor}, white, transparent)`,
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'center top',
                    transform: `translate(-50%, 0) rotate(${angle}deg)`,
                    animation: `light-beam 0.5s ease-out ${i * 0.02}s forwards`,
                    boxShadow: `0 0 10px ${attackerColor}`,
                  }}
                />
              );
            })}
          </div>

          {/* HIT 텍스트 */}
          <div
            className="absolute top-1/4 -translate-x-1/2 font-fredoka text-7xl"
            style={{
              left: impactX,
              color: 'white',
              textShadow: `
                4px 4px 0 ${attackerColor},
                -4px -4px 0 ${attackerColor},
                4px -4px 0 ${attackerColor},
                -4px 4px 0 ${attackerColor},
                0 0 40px ${attackerColor},
                0 0 80px white
              `,
              animation: 'hit-pop 0.4s ease-out forwards',
            }}
          >
            HIT!
          </div>

          {/* 데미지 오버레이 */}
          <div
            className="absolute top-0 bottom-0 w-2/5"
            style={{
              left: isLeft ? 'auto' : 0,
              right: isLeft ? 0 : 'auto',
              background: `linear-gradient(${isLeft ? '270deg' : '90deg'},
                rgba(255, 0, 0, 0.5) 0%,
                rgba(255, 100, 0, 0.3) 50%,
                transparent 100%)`,
              animation: 'damage-flash 0.1s ease-out 3',
            }}
          />
        </>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes beam-extend { from { transform: scaleX(0) translateY(-50%); opacity: 0; } to { transform: scaleX(1) translateY(-50%); opacity: 1; } }
        @keyframes wave-pulse { 0% { transform: scale(0.5) translateY(-50%); opacity: 1; } 100% { transform: scale(2) translateY(-50%); opacity: 0; } }
        @keyframes flash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes explosion { 0% { transform: scale(0.3); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes shockwave-ring { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(15); opacity: 0; } }
        @keyframes light-beam { 0% { transform: translate(-50%, 0) rotate(var(--angle)) scaleY(0); opacity: 1; } 50% { transform: translate(-50%, 0) rotate(var(--angle)) scaleY(1); opacity: 1; } 100% { transform: translate(-50%, 0) rotate(var(--angle)) scaleY(1.5); opacity: 0; } }
        @keyframes hit-pop { 0% { transform: translate(-50%, 0) scale(0) rotate(-10deg); opacity: 0; } 50% { transform: translate(-50%, 0) scale(1.3) rotate(5deg); opacity: 1; } 100% { transform: translate(-50%, 0) scale(1) rotate(0deg); opacity: 1; } }
        @keyframes damage-flash { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
};

const VersusScreen: React.FC<Props> = ({
  level,
  players,
  onAnswer,
  onNextLevel,
  roundWinner,
  currentRound,
  totalRounds,
  onHealthUpdate,
  isPlayer2Connected = true,
  onInvite,
  onPlayer2Join,
  inviteLink,
}) => {
  const [player1Input, setPlayer1Input] = useState('');
  const [player2Input, setPlayer2Input] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [attackEffect, setAttackEffect] = useState<'left' | 'right' | null>(null);
  const [showDamage, setShowDamage] = useState<1 | 2 | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const player1InputRef = useRef<HTMLInputElement>(null);
  const player2InputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlayer1Input('');
    setPlayer2Input('');
    setShowResult(false);
  }, [level]);

  useEffect(() => {
    if (roundWinner !== null) {
      setShowResult(true);
      // 공격 효과 표시
      const attackDirection = roundWinner === 1 ? 'left' : 'right';
      setAttackEffect(attackDirection);
      setShowDamage(roundWinner === 1 ? 2 : 1);

      // 화면 흔들림 효과 (임팩트 시점에)
      setTimeout(() => {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 400);
      }, 500);

      // 데미지 적용
      if (onHealthUpdate) {
        const targetPlayer = roundWinner === 1 ? 2 : 1;
        onHealthUpdate(targetPlayer as 1 | 2, 20); // 20 데미지
      }

      const timer = setTimeout(() => {
        setShowDamage(null);
        onNextLevel();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [roundWinner, onNextLevel, onHealthUpdate]);

  const handlePlayer1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player1Input.trim() && !showResult) {
      onAnswer(1, player1Input.trim().toLowerCase());
    }
  };

  const handlePlayer2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player2Input.trim() && !showResult) {
      onAnswer(2, player2Input.trim().toLowerCase());
    }
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResult) return;

      // Player 1: Q키로 포커스
      if (e.key === 'q' || e.key === 'Q') {
        if (document.activeElement !== player1InputRef.current) {
          e.preventDefault();
          player1InputRef.current?.focus();
        }
      }
      // Player 2: P키로 포커스
      if (e.key === 'p' || e.key === 'P') {
        if (document.activeElement !== player2InputRef.current) {
          e.preventDefault();
          player2InputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult]);

  return (
    <div className={`h-full w-full flex flex-col relative ${screenShake ? 'screen-shake' : ''}`} style={{ backgroundColor: '#fef8ed' }}>
      {/* 공격 이펙트 */}
      {attackEffect && (
        <AttackEffect
          direction={attackEffect}
          onComplete={() => setAttackEffect(null)}
        />
      )}

      {/* 상단 HUD (라이트 스타일) */}
      <div className="bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm border-b border-gray-100">
        {/* 라운드 & 승리 표시 */}
        <div className="flex items-center justify-between mb-2">
          {/* Player 1 승리 표시 */}
          <div className="flex items-center gap-1.5">
            {[...Array(Math.ceil(totalRounds / 2))].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  players[0].score > i
                    ? 'bg-blue-500 border-blue-500 shadow-sm shadow-blue-200'
                    : 'border-gray-300 bg-white'
                }`}
              />
            ))}
          </div>

          {/* 라운드 표시 */}
          <span className="text-orange-500 font-bold text-sm tracking-widest uppercase">
            Round {currentRound}
          </span>

          {/* Player 2 승리 표시 */}
          <div className="flex items-center gap-1.5">
            {[...Array(Math.ceil(totalRounds / 2))].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  players[1].score > i
                    ? 'bg-red-500 border-red-500 shadow-sm shadow-red-200'
                    : 'border-gray-300 bg-white'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 에너지 게이지 바 */}
        <div className="flex items-center gap-3">
          <HealthBar
            health={players[0].health}
            maxHealth={100}
            isLeft={true}
            playerName={players[0].name}
            showDamage={showDamage === 1}
          />
          <div className="flex-shrink-0 px-2">
            <span className="text-2xl font-fredoka text-orange-500">VS</span>
          </div>
          <HealthBar
            health={players[1].health}
            maxHealth={100}
            isLeft={false}
            playerName={players[1].name}
            showDamage={showDamage === 2}
          />
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="flex-1 flex">
        {/* Player 1 Area (Left) */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-blue-50/50">
          {/* Player 1 Character */}
          <div className="mb-4">
            <img
              src={robotImage}
              alt="Player 1"
              className="w-36 h-36 md:w-48 md:h-48 object-contain"
              style={{ filter: 'hue-rotate(200deg)' }}
            />
          </div>
          <div className="text-center mb-2">
            <span className="text-sm text-gray-500">Q키를 눌러 입력</span>
          </div>
          <form onSubmit={handlePlayer1Submit} className="w-full max-w-xs">
            <input
              ref={player1InputRef}
              type="text"
              value={player1Input}
              onChange={(e) => setPlayer1Input(e.target.value)}
              placeholder="단어를 입력하세요"
              disabled={showResult}
              className="w-full px-4 py-3 text-xl text-center border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={showResult || !player1Input.trim()}
              className="w-full mt-3 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
            >
              제출 (Enter)
            </button>
          </form>
          {showResult && players[0].isCorrect !== null && (
            <div className={`mt-3 text-2xl font-bold ${players[0].isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {players[0].isCorrect ? '정답! ✓' : '오답 ✗'}
            </div>
          )}
        </div>

        {/* Center Area - Image & Word */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-x-2 border-gray-200">
          {/* Image */}
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-lg mb-6 bg-white">
            <img
              src={level.imageHint}
              alt="hint"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Word Display */}
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-2">{level.sentence}</p>
            <div className="flex justify-center gap-2">
              {level.targetWord.split('').map((_, index) => (
                <div
                  key={index}
                  className="w-10 h-12 border-b-4 border-gray-400 flex items-center justify-center"
                >
                  <span className="text-2xl text-gray-300">_</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-gray-400 text-sm">
              {level.targetWord.length}글자
            </p>
          </div>

          {/* Round Winner Display */}
          {showResult && roundWinner && (
            <div className="mt-6 p-4 bg-yellow-100 rounded-xl">
              <span className="text-xl font-bold text-yellow-700">
                🎉 {roundWinner === 1 ? players[0].name : players[1].name} 승리!
              </span>
            </div>
          )}
        </div>

        {/* Player 2 Area (Right) */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-red-50/50">
          {!isPlayer2Connected ? (
            /* 초대 대기 화면 */
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-gray-200 flex items-center justify-center mb-4 border-4 border-dashed border-gray-400">
                <i className="fa-solid fa-user-plus text-4xl md:text-5xl text-gray-400"></i>
              </div>
              <p className="text-gray-500 mb-6 text-lg">Player 2 참가 대기중</p>

              {/* 온라인 초대 버튼 */}
              <button
                onClick={onInvite}
                className="w-full max-w-xs px-6 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-share-nodes"></i>
                친구 초대하기
              </button>
            </div>
          ) : (
            /* 기존 Player 2 입력 화면 */
            <>
              {/* Player 2 Character */}
              <div className="mb-4">
                <img
                  src={robotImage}
                  alt="Player 2"
                  className="w-36 h-36 md:w-48 md:h-48 object-contain"
                  style={{ filter: 'hue-rotate(-30deg)' }}
                />
              </div>
              <div className="text-center mb-2">
                <span className="text-sm text-gray-500">P키를 눌러 입력</span>
              </div>
              <form onSubmit={handlePlayer2Submit} className="w-full max-w-xs">
                <input
                  ref={player2InputRef}
                  type="text"
                  value={player2Input}
                  onChange={(e) => setPlayer2Input(e.target.value)}
                  placeholder="단어를 입력하세요"
                  disabled={showResult}
                  className="w-full px-4 py-3 text-xl text-center border-2 border-red-300 rounded-xl focus:border-red-500 focus:outline-none disabled:bg-gray-100"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={showResult || !player2Input.trim()}
                  className="w-full mt-3 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
                >
                  제출 (Enter)
                </button>
              </form>
              {showResult && players[1].isCorrect !== null && (
                <div className={`mt-3 text-2xl font-bold ${players[1].isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {players[1].isCorrect ? '정답! ✓' : '오답 ✗'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersusScreen;
