import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Timer, Check, X, RotateCw } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { MINIGAME_IMAGES } from '@/assets/items';

interface Props {
  difficulty: number; // 1-3, affects grid and time
  brainsBonus: number; // extra seconds
  hasHacker: boolean; // crew hacker bonus
  onComplete: (success: boolean) => void;
}

// Tile types: straight, corner, t-junction, cross
type TileType = 'straight' | 'corner' | 'tee' | 'cross';

interface Tile {
  type: TileType;
  rotation: number; // 0, 90, 180, 270
  correctRotation: number;
}

function getConnections(type: TileType, rotation: number): boolean[] {
  // [top, right, bottom, left]
  const base: Record<TileType, boolean[]> = {
    straight: [true, false, true, false],
    corner: [true, true, false, false],
    tee: [true, true, true, false],
    cross: [true, true, true, true],
  };
  const b = [...base[type]];
  const steps = (rotation / 90) % 4;
  for (let i = 0; i < steps; i++) {
    b.unshift(b.pop()!);
  }
  return b;
}

function generateGrid(size: number): Tile[][] {
  const types: TileType[] = ['straight', 'corner', 'tee', 'cross'];
  const grid: Tile[][] = [];
  for (let r = 0; r < size; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < size; c++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const correctRotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      // Scramble rotation
      let rotation = correctRotation;
      while (rotation === correctRotation) {
        rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
      }
      row.push({ type, rotation, correctRotation });
    }
    grid.push(row);
  }
  return grid;
}

function checkSolved(grid: Tile[][]): boolean {
  return grid.every(row => row.every(tile => tile.rotation === tile.correctRotation));
}

export function HackingGame({ difficulty, brainsBonus, hasHacker, onComplete }: Props) {
  const gridSize = difficulty <= 1 ? 3 : difficulty <= 2 ? 4 : 4;
  const baseTime = difficulty <= 1 ? 30 : difficulty <= 2 ? 25 : 20;
  const bonusTime = brainsBonus * 2 + (hasHacker ? 5 : 0);
  const totalTime = baseTime + bonusTime;

  const [grid, setGrid] = useState<Tile[][]>(() => generateGrid(gridSize));
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (solved || failed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setFailed(true);
          clearInterval(timerRef.current);
          setTimeout(() => onComplete(false), 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [solved, failed, onComplete]);

  const rotateTile = useCallback((r: number, c: number) => {
    if (solved || failed) return;
    setGrid(prev => {
      const next = prev.map(row => row.map(t => ({ ...t })));
      next[r][c].rotation = (next[r][c].rotation + 90) % 360;
      if (checkSolved(next)) {
        setSolved(true);
        clearInterval(timerRef.current);
        setTimeout(() => onComplete(true), 800);
      }
      return next;
    });
  }, [solved, failed, onComplete]);

  const cancel = () => {
    clearInterval(timerRef.current);
    onComplete(false);
  };

  const timePct = (timeLeft / totalTime) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
    >
      <div className="w-full max-w-xs bg-card border border-border rounded-lg p-4 space-y-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-game-purple" />
          <h3 className="font-display text-sm uppercase tracking-wider">HACK SYSTEEM</h3>
          <div className="ml-auto flex items-center gap-1">
            <Timer size={12} className={timeLeft < 10 ? 'text-blood animate-pulse' : 'text-muted-foreground'} />
            <span className={`text-xs font-mono font-bold ${timeLeft < 10 ? 'text-blood' : 'text-foreground'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${timeLeft < 10 ? 'bg-blood' : 'bg-game-purple'}`}
            animate={{ width: `${timePct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <p className="text-[0.55rem] text-muted-foreground text-center">
          Roteer de tegels om het circuit te verbinden
        </p>

        {/* Grid */}
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            maxWidth: `${gridSize * 56}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((tile, c) => {
              const isCorrect = tile.rotation === tile.correctRotation;
              return (
                <motion.button
                  key={`${r}-${c}`}
                  onClick={() => rotateTile(r, c)}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded border-2 flex items-center justify-center transition-colors ${
                    isCorrect
                      ? 'border-emerald bg-emerald/10'
                      : 'border-border bg-muted/30 hover:border-game-purple/50'
                  }`}
                >
                  <motion.div
                    animate={{ rotate: tile.rotation }}
                    transition={{ duration: 0.15 }}
                    className="text-[0.5rem] font-mono text-foreground"
                  >
                    {tile.type === 'straight' && '┃'}
                    {tile.type === 'corner' && '┏'}
                    {tile.type === 'tee' && '┣'}
                    {tile.type === 'cross' && '╋'}
                  </motion.div>
                </motion.button>
              );
            })
          )}
        </div>

        {solved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-emerald font-bold text-sm flex items-center justify-center gap-1">
            <Check size={16} /> SYSTEEM GEHACKT!
          </motion.div>
        )}

        {failed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-blood font-bold text-sm flex items-center justify-center gap-1">
            <X size={16} /> TIJD OP — DETECTIE!
          </motion.div>
        )}

        {!solved && !failed && (
          <GameButton variant="muted" fullWidth onClick={cancel} icon={<X size={12} />}>
            ANNULEREN
          </GameButton>
        )}
      </div>
    </motion.div>
  );
}
