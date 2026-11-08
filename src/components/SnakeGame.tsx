import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Point,
  Direction,
  FoodItem,
  FoodType,
  Particle,
  FloatingText,
  GameSpeed,
} from '../types';
import { audioEngine } from '../audio/synthEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  Gauge,
  Sparkles,
  Terminal,
  AlertTriangle,
} from 'lucide-react';

const GRID_SIZE = 22; // 22x22 cells

interface SnakeGameProps {
  isPlayingMusic: boolean;
  musicBpm: number;
  trackAccentColor: string;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({
  isPlayingMusic,
  musicBpm,
  trackAccentColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('neon_snake_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [combo, setCombo] = useState(1);
  const [comboTimer, setComboTimer] = useState(0);
  const [applesEaten, setApplesEaten] = useState(0);
  const [gameSpeedMode, setGameSpeedMode] = useState<GameSpeed>('cyber');
  const [glitchTear, setGlitchTear] = useState(false);

  // Snake coordinates and motion refs
  const snakeRef = useRef<Point[]>([
    { x: 11, y: 11 },
    { x: 10, y: 11 },
    { x: 9, y: 11 },
  ]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodsRef = useRef<FoodItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const lastTickTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(1);
  const lastEatTimeRef = useRef(0);

  const updateScore = useCallback((newScore: number) => {
    scoreRef.current = newScore;
    setScore(newScore);
    setHighScore((prev) => {
      if (newScore > prev) {
        localStorage.setItem('neon_snake_high_score', newScore.toString());
        return newScore;
      }
      return prev;
    });
  }, []);

  const getTickDelay = useCallback(() => {
    switch (gameSpeedMode) {
      case 'chill':
        return 140;
      case 'overdrive':
        return 65;
      case 'beat-sync': {
        const bps = musicBpm / 60;
        const beatMs = (1 / bps) * 1000;
        return Math.max(70, Math.min(150, Math.floor(beatMs / 4)));
      }
      case 'cyber':
      default:
        return 95;
    }
  }, [gameSpeedMode, musicBpm]);

  const spawnFood = useCallback((forceType?: FoodType): FoodItem => {
    const snake = snakeRef.current;
    let newX = 0;
    let newY = 0;
    let collision = true;

    while (collision) {
      newX = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
      newY = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
      // eslint-disable-next-line no-loop-func
      collision = snake.some((seg) => seg.x === newX && seg.y === newY);
    }

    let type: FoodType = forceType || 'regular';
    if (!forceType) {
      const rand = Math.random();
      if (rand < 0.15) {
        type = 'multiplier';
      } else if (rand < 0.35) {
        type = 'cyber';
      } else {
        type = 'regular';
      }
    }

    let points = 10;
    let color = '#00f0ff'; // Cyan
    let glowColor = '#00f0ff';

    if (type === 'cyber') {
      points = 25;
      color = '#ff0055'; // Magenta
      glowColor = '#ff0055';
    } else if (type === 'multiplier') {
      points = 40;
      color = '#ffff00'; // Stark Glitch Yellow
      glowColor = '#ffff00';
    }

    return {
      x: newX,
      y: newY,
      type,
      points,
      color,
      glowColor,
      spawnTime: performance.now(),
      duration: type === 'regular' ? undefined : 8000,
    };
  }, []);

  const initFoods = useCallback(() => {
    foodsRef.current = [spawnFood('regular'), spawnFood('cyber')];
  }, [spawnFood]);

  // Pixel particle debris
  const triggerParticles = (x: number, y: number, color: string) => {
    const cellSize = (canvasRef.current ? canvasRef.current.width : 500) / GRID_SIZE;
    const px = x * cellSize + cellSize / 2;
    const py = y * cellSize + cellSize / 2;

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 2.0 + Math.random() * 3.5;
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? color : '#ff0055',
        size: 3 + Math.random() * 2,
        life: 1.0,
        maxLife: 1.0,
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    const cellSize = (canvasRef.current ? canvasRef.current.width : 500) / GRID_SIZE;
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x: x * cellSize + cellSize / 2,
      y: y * cellSize,
      text,
      color,
      life: 1.0,
    });
  };

  const startGame = useCallback(() => {
    audioEngine.playStartSound();
    snakeRef.current = [
      { x: 11, y: 11 },
      { x: 10, y: 11 },
      { x: 9, y: 11 },
    ];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    particlesRef.current = [];
    floatingTextsRef.current = [];
    updateScore(0);
    setApplesEaten(0);
    comboRef.current = 1;
    setCombo(1);
    setComboTimer(0);
    initFoods();
    setGameState('PLAYING');
    lastTickTimeRef.current = performance.now();
  }, [initFoods, updateScore]);

  const pauseGame = useCallback(() => {
    setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
  }, []);

  const changeDirection = useCallback((newDir: Direction) => {
    const current = directionRef.current;
    if (
      (newDir === 'UP' && current !== 'DOWN') ||
      (newDir === 'DOWN' && current !== 'UP') ||
      (newDir === 'LEFT' && current !== 'RIGHT') ||
      (newDir === 'RIGHT' && current !== 'LEFT')
    ) {
      if (nextDirectionRef.current !== newDir) {
        audioEngine.playTurnSound();
      }
      nextDirectionRef.current = newDir;
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.code === 'Space') {
        if (gameState === 'IDLE' || gameState === 'GAME_OVER') {
          startGame();
        } else {
          pauseGame();
        }
        return;
      }

      if (gameState === 'IDLE' || gameState === 'GAME_OVER') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
          startGame();
        }
      }

      if (gameState !== 'PLAYING') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          changeDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame, pauseGame, changeDirection]);

  // Main Canvas & Movement Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tickDelay = getTickDelay();

    const loop = (currentTime: number) => {
      const beatEnergy = audioEngine.getBeatEnergy();
      const hasBeatKick = isPlayingMusic && beatEnergy > 0.28;
      setGlitchTear(hasBeatKick);

      if (comboRef.current > 1 && currentTime - lastEatTimeRef.current > 3500) {
        comboRef.current = 1;
        setCombo(1);
        setComboTimer(0);
      } else if (comboRef.current > 1) {
        const remaining = Math.max(0, 1 - (currentTime - lastEatTimeRef.current) / 3500);
        setComboTimer(remaining);
      }

      // Movement Tick
      if (gameState === 'PLAYING') {
        if (currentTime - lastTickTimeRef.current >= tickDelay) {
          lastTickTimeRef.current = currentTime;

          directionRef.current = nextDirectionRef.current;
          const dir = directionRef.current;

          const head = snakeRef.current[0];
          let nextX = head.x;
          let nextY = head.y;

          if (dir === 'UP') nextY -= 1;
          else if (dir === 'DOWN') nextY += 1;
          else if (dir === 'LEFT') nextX -= 1;
          else if (dir === 'RIGHT') nextX += 1;

          // Wall collision
          if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
            audioEngine.playGameOverSound();
            setGameState('GAME_OVER');
          } else {
            // Self collision
            const selfHit = snakeRef.current.some((seg) => seg.x === nextX && seg.y === nextY);
            if (selfHit) {
              audioEngine.playGameOverSound();
              setGameState('GAME_OVER');
            } else {
              const newHead: Point = { x: nextX, y: nextY };
              const currentFoods = foodsRef.current;
              const eatenFoodIndex = currentFoods.findIndex(
                (f) => f.x === nextX && f.y === nextY
              );

              if (eatenFoodIndex >= 0) {
                const eaten = currentFoods[eatenFoodIndex];
                audioEngine.playEatSound(eaten.type);

                const now = performance.now();
                if (now - lastEatTimeRef.current < 3500) {
                  comboRef.current = Math.min(4, comboRef.current + 1);
                } else {
                  comboRef.current = 1;
                }
                lastEatTimeRef.current = now;
                setCombo(comboRef.current);

                const earnedPoints = eaten.points * comboRef.current;
                updateScore(scoreRef.current + earnedPoints);
                setApplesEaten((prev) => prev + 1);

                triggerParticles(nextX, nextY, eaten.color);
                addFloatingText(
                  nextX,
                  nextY,
                  `+${earnedPoints}${comboRef.current > 1 ? ` [x${comboRef.current}]` : ''}`,
                  eaten.color
                );

                snakeRef.current = [newHead, ...snakeRef.current];

                currentFoods.splice(eatenFoodIndex, 1);
                currentFoods.push(spawnFood('regular'));

                const hasSpecial = currentFoods.some((f) => f.type !== 'regular');
                if (!hasSpecial && Math.random() < 0.45) {
                  currentFoods.push(spawnFood(Math.random() < 0.5 ? 'cyber' : 'multiplier'));
                }
              } else {
                snakeRef.current = [newHead, ...snakeRef.current.slice(0, -1)];
              }
            }
          }
        }
      }

      // Render Canvas (Glitch Art Aesthetics)
      const width = canvas.width;
      const height = canvas.height;
      const cellSize = width / GRID_SIZE;

      // Pitch Black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Harsh Glitch Grid Lines
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID_SIZE; i += 2) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(width, i * cellSize);
        ctx.stroke();
      }

      // Audio-reactive chromatic glitch displacement
      if (hasBeatKick) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 85, 0.15)';
        ctx.fillRect(0, Math.floor(Math.random() * height), width, 12);
        ctx.restore();
      }

      // Food items rendering (Glitch Pixel Blocks)
      foodsRef.current.forEach((food) => {
        const fx = food.x * cellSize;
        const fy = food.y * cellSize;
        const size = cellSize - 2;

        ctx.save();
        if (food.type === 'regular') {
          // Sharp Cyan Pixel Box with Magenta core
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(fx + 1, fy + 1, size, size);
          ctx.fillStyle = '#ff0055';
          ctx.fillRect(fx + 4, fy + 4, size - 8, size - 8);
        } else if (food.type === 'cyber') {
          // Sharp Magenta Diamond Matrix
          ctx.fillStyle = '#ff0055';
          const cx = fx + cellSize / 2;
          const cy = fy + cellSize / 2;
          ctx.beginPath();
          ctx.moveTo(cx, fy + 2);
          ctx.lineTo(fx + cellSize - 2, cy);
          ctx.lineTo(cx, fy + cellSize - 2);
          ctx.lineTo(fx + 2, cy);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (food.type === 'multiplier') {
          // Multiplier Yellow/Cyan Box with crosshairs
          ctx.fillStyle = '#ffff00';
          ctx.fillRect(fx + 2, fy + 2, size - 2, size - 2);
          ctx.fillStyle = '#000000';
          ctx.fillRect(fx + cellSize / 2 - 1, fy + 2, 2, size - 2);
          ctx.fillRect(fx + 2, fy + cellSize / 2 - 1, size - 2, 2);
        }
        ctx.restore();
      });

      // Snake Rendering: Raw Pixelated Segments with Cyan vs Magenta Contrast
      const snake = snakeRef.current;
      const snakeLen = snake.length;

      for (let i = snakeLen - 1; i >= 0; i--) {
        const seg = snake[i];
        const sx = seg.x * cellSize;
        const sy = seg.y * cellSize;
        const isHead = i === 0;

        ctx.save();
        if (isHead) {
          // Head: Solid Cyan with Magenta Optic Line
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);

          // Magenta visor slot pointing towards direction
          ctx.fillStyle = '#ff0055';
          const dir = directionRef.current;
          if (dir === 'RIGHT') {
            ctx.fillRect(sx + cellSize - 5, sy + 4, 3, cellSize - 8);
          } else if (dir === 'LEFT') {
            ctx.fillRect(sx + 2, sy + 4, 3, cellSize - 8);
          } else if (dir === 'UP') {
            ctx.fillRect(sx + 4, sy + 2, cellSize - 8, 3);
          } else if (dir === 'DOWN') {
            ctx.fillRect(sx + 4, sy + cellSize - 5, cellSize - 8, 3);
          }
        } else {
          // Alternating Cyan and Magenta Pixel Blocks
          const isMagenta = i % 2 === 1;
          ctx.fillStyle = isMagenta ? '#ff0055' : '#00f0ff';
          ctx.fillRect(sx + 1.5, sy + 1.5, cellSize - 3, cellSize - 3);

          // Black inner cutout for brutalist mechanical feel
          ctx.fillStyle = '#000000';
          ctx.fillRect(sx + 4, sy + 4, cellSize - 8, cellSize - 8);
        }
        ctx.restore();
      }

      // Particles (Pixel Debris)
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;

        if (p.life <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // Floating Texts (Pixel Typography)
      floatingTextsRef.current.forEach((ft, idx) => {
        ft.y -= 1.0;
        ft.life -= 0.03;

        if (ft.life <= 0) {
          floatingTextsRef.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Screen Tearing Line Drawn onto Canvas
      if (hasBeatKick || Math.random() < 0.04) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        const tearY = Math.floor(Math.random() * height);
        ctx.fillRect(0, tearY, width, 2);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameState, getTickDelay, isPlayingMusic, trackAccentColor, spawnFood, updateScore]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Top Arcade Machine Bezel: Raw Glitch Dashboard */}
      <div className="w-full bg-black border-2 border-[#00f0ff] p-3 sm:p-4 shadow-[6px_6px_0px_#ff0055]">
        <div className="flex items-center justify-between gap-2 border-b-2 border-[#ff0055] pb-2">
          {/* Main Score Display: Glitch Art, Digital, Raw Pixel */}
          <div className="flex flex-col">
            <span className="font-pixel text-[9px] text-[#00f0ff] uppercase flex items-center gap-1.5 font-bold">
              <Terminal className="w-3.5 h-3.5 text-[#ff0055]" />
              SECTOR_SCORE
            </span>
            <div className="digital-score-wrap glitch-anim text-3xl sm:text-5xl font-black tracking-[0.18em] select-none my-0.5">
              <span className="digital-ghost" aria-hidden="true">88888</span>
              <span className="digital-active font-vt323" data-text={score.toString().padStart(5, '0')}>
                {score.toString().padStart(5, '0')}
              </span>
            </div>
          </div>

          {/* Multiplier Signal */}
          {combo > 1 && (
            <div className="flex flex-col items-center px-3 py-1 bg-black border-2 border-[#ffff00] shadow-[3px_3px_0px_#ff0055]">
              <div className="flex items-center gap-1 text-[#ffff00] font-pixel text-xs sm:text-sm">
                <Flame className="w-3.5 h-3.5 fill-[#ffff00]" />
                <span>SURGE_x{combo}</span>
              </div>
              <div className="w-16 h-1 bg-zinc-800 mt-1">
                <div
                  className="h-full bg-[#ffff00] transition-all duration-75"
                  style={{ width: `${comboTimer * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Record Signal */}
          <div className="flex flex-col items-end">
            <span className="font-pixel text-[9px] text-[#ff0055] uppercase flex items-center gap-1.5 font-bold">
              <Trophy className="w-3.5 h-3.5 text-[#00f0ff]" />
              RECORD_SIGNAL
            </span>
            <div className="digital-score-wrap text-2xl sm:text-4xl font-black tracking-[0.18em] select-none my-0.5">
              <span className="text-zinc-800 font-vt323" aria-hidden="true">88888</span>
              <span className="absolute right-0 top-0 text-[#ff0055] font-vt323">
                {highScore.toString().padStart(5, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Speed Clock Selector & Sub-Controls */}
        <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2 text-[10px] font-pixel">
          <div className="flex items-center gap-1 bg-black p-0.5 border border-zinc-800">
            <button
              onClick={() => setGameSpeedMode('chill')}
              className={`px-2 py-1 transition-all ${
                gameSpeedMode === 'chill'
                  ? 'bg-[#00f0ff] text-black font-bold'
                  : 'text-zinc-500 hover:text-[#00f0ff]'
              }`}
            >
              SLOW
            </button>
            <button
              onClick={() => setGameSpeedMode('cyber')}
              className={`px-2 py-1 transition-all ${
                gameSpeedMode === 'cyber'
                  ? 'bg-[#ff0055] text-black font-bold'
                  : 'text-zinc-500 hover:text-[#ff0055]'
              }`}
            >
              CORE
            </button>
            <button
              onClick={() => setGameSpeedMode('overdrive')}
              className={`px-2 py-1 transition-all ${
                gameSpeedMode === 'overdrive'
                  ? 'bg-[#00f0ff] text-black font-bold'
                  : 'text-zinc-500 hover:text-[#00f0ff]'
              }`}
            >
              OVERCLOCK
            </button>
            <button
              onClick={() => setGameSpeedMode('beat-sync')}
              className={`px-2 py-1 transition-all ${
                gameSpeedMode === 'beat-sync'
                  ? 'bg-[#ffff00] text-black font-bold'
                  : 'text-zinc-500 hover:text-[#ffff00]'
              }`}
            >
              BPM_LOCK
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {gameState === 'PLAYING' && (
              <button
                onClick={pauseGame}
                className="px-2.5 py-1 bg-black border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-all flex items-center gap-1"
              >
                <Pause className="w-3 h-3" /> HALT
              </button>
            )}
            {gameState === 'PAUSED' && (
              <button
                onClick={pauseGame}
                className="px-2.5 py-1 bg-[#ff0055] text-black border border-black hover:bg-[#00f0ff] transition-all flex items-center gap-1 font-bold"
              >
                <Play className="w-3 h-3 fill-current" /> RESUME
              </button>
            )}
            <button
              onClick={startGame}
              className="px-2.5 py-1 bg-black border border-[#ff0055] text-[#ff0055] hover:bg-[#ff0055] hover:text-black transition-all flex items-center gap-1"
              title="Reset Vector Matrix"
            >
              <RotateCcw className="w-3 h-3" /> RESET
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Screen Canvas Container with Glitch Tearing */}
      <div
        className={`relative w-full aspect-square bg-black border-2 border-[#00f0ff] border-t-0 shadow-[6px_6px_0px_#ff0055] overflow-hidden ${
          glitchTear ? 'glitch-tear-layer' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          width={528}
          height={528}
          className="w-full h-full block cursor-crosshair"
          onClick={() => {
            if (gameState === 'IDLE' || gameState === 'GAME_OVER') {
              startGame();
            }
          }}
        />

        {/* CRT Static Scanlines & Tearing Line */}
        <div className="absolute inset-0 scanlines pointer-events-none opacity-40" />
        <div className="static-bar" />

        {/* OVERLAYS */}

        {/* 1. Start Screen Overlay */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-5 text-center z-10 glitch-tear-layer">
            <div className="w-12 h-12 bg-black border-2 border-[#ff0055] flex items-center justify-center mb-3 shadow-[3px_3px_0px_#00f0ff]">
              <Terminal className="w-6 h-6 text-[#00f0ff]" />
            </div>

            <h2 className="font-pixel text-sm sm:text-base text-[#00f0ff] uppercase tracking-wider mb-1 text-shadow glitch-text-active">
              PROTOCOL::SNAKE_CYCLE
            </h2>

            <p className="font-silkscreen text-[11px] text-[#ff0055] max-w-xs mb-5 uppercase tracking-wide">
              INGEST DISK SECTORS // EVADE PERIMETER WALL COLLISION
            </p>

            {/* Glowing Neon Start Button */}
            <button
              onClick={startGame}
              className="px-6 py-3 bg-[#00f0ff] text-black font-pixel text-xs tracking-widest uppercase border-2 border-[#ff0055] shadow-[5px_5px_0px_#ff0055] hover:bg-[#ff0055] hover:shadow-[5px_5px_0px_#00f0ff] transition-all transform hover:scale-102 active:translate-x-1 active:translate-y-1 flex items-center gap-2 cursor-pointer font-bold"
            >
              <span className="w-4 h-4 bg-black flex items-center justify-center text-[#00f0ff]">
                <Play className="w-2.5 h-2.5 fill-current" />
              </span>
              <span>EXEC_CYCLE [SPACE]</span>
            </button>

            {/* Glowing Neon Controls Icons */}
            <div className="mt-5 flex flex-col items-center gap-2.5 font-pixel text-[9px]">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Arrow Icons */}
                <div className="flex items-center gap-1 bg-black border border-[#00f0ff] p-1.5 shadow-[2px_2px_0px_#00f0ff]">
                  <span className="text-[#00f0ff] font-bold mr-1 hidden sm:inline">DIR:</span>
                  <div className="flex items-center gap-1">
                    <span className="w-5 h-5 bg-black border border-[#00f0ff] text-[#00f0ff] flex items-center justify-center">
                      <ArrowUp className="w-3 h-3" />
                    </span>
                    <span className="w-5 h-5 bg-black border border-[#00f0ff] text-[#00f0ff] flex items-center justify-center">
                      <ArrowLeft className="w-3 h-3" />
                    </span>
                    <span className="w-5 h-5 bg-black border border-[#00f0ff] text-[#00f0ff] flex items-center justify-center">
                      <ArrowDown className="w-3 h-3" />
                    </span>
                    <span className="w-5 h-5 bg-black border border-[#00f0ff] text-[#00f0ff] flex items-center justify-center">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                <span className="text-[#ff0055] font-bold">OR</span>

                {/* WASD Icons */}
                <div className="flex items-center gap-1 bg-black border border-[#ff0055] p-1.5 shadow-[2px_2px_0px_#ff0055]">
                  <div className="flex items-center gap-1 text-[#ff0055]">
                    <span className="w-5 h-5 bg-black border border-[#ff0055] flex items-center justify-center">W</span>
                    <span className="w-5 h-5 bg-black border border-[#ff0055] flex items-center justify-center">A</span>
                    <span className="w-5 h-5 bg-black border border-[#ff0055] flex items-center justify-center">S</span>
                    <span className="w-5 h-5 bg-black border border-[#ff0055] flex items-center justify-center">D</span>
                  </div>
                </div>

                {/* Space Pause */}
                <div className="flex items-center gap-1 bg-black border border-[#ffff00] px-2 py-1.5 text-[#ffff00]">
                  <span>␣ SPACE</span>
                </div>
              </div>

              {/* Collectible Legend */}
              <div className="flex items-center gap-3 pt-1 text-[8px] font-pixel text-zinc-300">
                <span className="text-[#00f0ff] flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#00f0ff] inline-block" /> +10_CORE
                </span>
                <span className="text-[#ff0055] flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rotate-45 bg-[#ff0055] inline-block" /> +25_MATRIX
                </span>
                <span className="text-[#ffff00] flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-[#ffff00] inline-block" /> +40_SURGE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Paused Screen Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-10">
            <h3 className="font-pixel text-sm text-[#00f0ff] tracking-widest mb-2 glitch-text-active">
              // SUB_ROUTINE_HALTED //
            </h3>
            <p className="font-silkscreen text-[11px] text-[#ff0055] mb-5">
              BACKGROUND AUDIO CYCLE MAINTAINS CONTINUOUS STREAM
            </p>
            <button
              onClick={pauseGame}
              className="px-5 py-2.5 bg-[#00f0ff] text-black font-pixel text-xs border-2 border-[#ff0055] shadow-[4px_4px_0px_#ff0055] hover:bg-[#ff0055]"
            >
              RESUME_EXECUTION
            </button>
          </div>
        )}

        {/* 3. Game Over Screen Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/92 p-5 text-center z-10 animate-in fade-in duration-200">
            <div className="text-[#ff0055] font-pixel text-[10px] tracking-widest uppercase mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff0055]" />
              TERMINAL_INTERRUPT: 0xDEAD
            </div>
            <h2 className="font-pixel text-lg sm:text-xl text-[#ff0055] tracking-widest mb-4 glitch-text-active">
              SIGNAL_CORRUPTED
            </h2>

            <div className="w-full max-w-xs bg-black border-2 border-[#00f0ff] p-3 mb-5 space-y-1.5 font-pixel text-[10px] shadow-[4px_4px_0px_#ff0055]">
              <div className="flex justify-between items-center text-white">
                <span>CYCLE_SCORE:</span>
                <span className="text-[#00f0ff] font-bold text-xs">{score}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>CORES_ABSORBED:</span>
                <span className="text-white">{applesEaten}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>VECTOR_LENGTH:</span>
                <span className="text-white">{snakeRef.current.length}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-zinc-800 text-[#ff0055]">
                <span>RECORD_SIGNAL:</span>
                <span className="text-xs">{highScore}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-3 bg-[#ff0055] text-black font-pixel text-xs tracking-wider uppercase border-2 border-[#00f0ff] shadow-[4px_4px_0px_#00f0ff] hover:bg-[#00f0ff] font-bold"
            >
              REBOOT_CYCLE [SPACE]
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Brutalist Touch / Mouse Controls */}
      <div className="w-full bg-black border-2 border-[#00f0ff] border-t-0 p-3 shadow-[6px_6px_0px_#ff0055]">
        <div className="flex items-center justify-between">
          <div className="font-pixel text-[9px] text-[#00f0ff] hidden sm:block">
            [ TACTILE_DIRECTIVE ]
          </div>

          <div className="flex items-center justify-center w-full sm:w-auto">
            <div className="grid grid-cols-3 gap-1.5 w-36 h-28">
              <div />
              <button
                onClick={() => changeDirection('UP')}
                className="w-11 h-11 bg-black border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black flex items-center justify-center active:translate-y-0.5 shadow-[2px_2px_0px_#ff0055]"
                title="Up"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onClick={() => changeDirection('LEFT')}
                className="w-11 h-11 bg-black border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black flex items-center justify-center active:translate-y-0.5 shadow-[2px_2px_0px_#ff0055]"
                title="Left"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (gameState === 'PLAYING') pauseGame();
                  else startGame();
                }}
                className="w-11 h-11 bg-[#ff0055] text-black font-pixel text-[9px] font-bold flex items-center justify-center active:translate-y-0.5"
                title="Action"
              >
                {gameState === 'PLAYING' ? 'HALT' : 'GO'}
              </button>
              <button
                onClick={() => changeDirection('RIGHT')}
                className="w-11 h-11 bg-black border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black flex items-center justify-center active:translate-y-0.5 shadow-[2px_2px_0px_#ff0055]"
                title="Right"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div />
              <button
                onClick={() => changeDirection('DOWN')}
                className="w-11 h-11 bg-black border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black flex items-center justify-center active:translate-y-0.5 shadow-[2px_2px_0px_#ff0055]"
                title="Down"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>
          </div>

          <div className="font-pixel text-[9px] text-[#ff0055] hidden sm:block">
            [ READY ]
          </div>
        </div>
      </div>
    </div>
  );
};
