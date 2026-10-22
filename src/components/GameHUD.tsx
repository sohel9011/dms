import React from 'react';
import { ActivePowerUp, GameStats } from '../types';
import { POWER_UP_CONFIG } from '../game/constants';
import { Pause, Volume2, VolumeX, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface GameHUDProps {
  stats: GameStats;
  highScore: number;
  powerUps: ActivePowerUp[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  showTouchControls: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  highScore,
  powerUps,
  soundEnabled,
  onToggleSound,
  onPause,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  showTouchControls,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* Top Bar: Stats & Controls */}
      <div className="w-full flex items-start justify-between gap-3">
        {/* Left: Score & Best */}
        <div className="flex flex-col gap-1">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl px-4 py-2 shadow-lg flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Score</span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-amber-400 font-medium flex items-center gap-1.5">
              <span>BEST</span>
              <span className="font-mono font-bold text-white">{Math.max(highScore, stats.score).toLocaleString()}</span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-cyan-400 font-medium font-mono">
              {Math.floor(stats.distance)} m
            </div>
          </div>
        </div>

        {/* Center: Active Multiplier or Power-up status */}
        <div className="flex flex-col items-center gap-1.5">
          {stats.multiplier > 1 && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs sm:text-sm px-3 py-1 rounded-full shadow-md animate-bounce">
              {stats.multiplier}X MULTIPLIER
            </div>
          )}

          {/* Active Power-up timer bars */}
          <div className="flex flex-col gap-1.5">
            {powerUps.map((pup) => {
              const cfg = POWER_UP_CONFIG[pup.type];
              const pct = Math.max(0, Math.min(100, (pup.remaining / pup.duration) * 100));

              return (
                <div
                  key={pup.type}
                  className="bg-slate-900/90 border border-slate-700/70 rounded-full px-2.5 py-1 flex items-center gap-2 shadow-md min-w-[120px]"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                      <span>{cfg.name}</span>
                      <span>{Math.ceil(pup.remaining)}s</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1 mt-0.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-100"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cfg.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Coins & Pause/Sound buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coin Badge */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-inner">
              $
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
              {stats.coins}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-md active:scale-95"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-rose-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-md active:scale-95"
          >
            <Pause size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Area: Controls instructions or Touch overlay */}
      <div className="w-full flex items-end justify-between">
        {/* Subtle keyboard hint for desktop users */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400/80 bg-slate-950/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800/60">
          <span>Move: <strong className="text-slate-200">A/D</strong> or <strong className="text-slate-200">←/→</strong></span>
          <span className="text-slate-600">|</span>
          <span>Jump: <strong className="text-slate-200">W/↑/Space</strong></span>
          <span className="text-slate-600">|</span>
          <span>Slide: <strong className="text-slate-200">S/↓</strong></span>
        </div>

        {/* Optional On-screen touch buttons for mobile ease of access */}
        {showTouchControls && (
          <div className="w-full flex items-center justify-between pointer-events-auto pt-4 pb-2 px-1">
            {/* Left / Right lateral switch buttons */}
            <div className="flex gap-3">
              <button
                onTouchStart={(e) => { e.preventDefault(); onMoveLeft(); }}
                onClick={onMoveLeft}
                className="w-14 h-14 rounded-2xl bg-slate-900/75 active:bg-cyan-600/60 border border-slate-700 text-cyan-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Move Left"
              >
                <ArrowLeft size={24} />
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); onMoveRight(); }}
                onClick={onMoveRight}
                className="w-14 h-14 rounded-2xl bg-slate-900/75 active:bg-cyan-600/60 border border-slate-700 text-cyan-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Move Right"
              >
                <ArrowRight size={24} />
              </button>
            </div>

            {/* Jump & Slide vertical action buttons */}
            <div className="flex gap-3">
              <button
                onTouchStart={(e) => { e.preventDefault(); onJump(); }}
                onClick={onJump}
                className="w-14 h-14 rounded-2xl bg-slate-900/75 active:bg-amber-600/60 border border-slate-700 text-amber-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Jump"
              >
                <ArrowUp size={24} />
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); onSlide(); }}
                onClick={onSlide}
                className="w-14 h-14 rounded-2xl bg-slate-900/75 active:bg-rose-600/60 border border-slate-700 text-rose-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                aria-label="Slide"
              >
                <ArrowDown size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
