import React from 'react';
import { GameStats } from '../types';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseScreenProps {
  stats: GameStats;
  soundEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onToggleSound: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({
  stats,
  soundEnabled,
  onResume,
  onRestart,
  onHome,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="text-3xl font-black italic tracking-tight text-white mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6">Take a breath and jump back in!</p>

        {/* Current Run Progress */}
        <div className="w-full grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 mb-6">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Score</div>
            <div className="text-base font-black font-mono text-white">
              {stats.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Distance</div>
            <div className="text-base font-black font-mono text-cyan-400">
              {Math.floor(stats.distance)}m
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Coins</div>
            <div className="text-base font-black font-mono text-amber-400">
              {stats.coins}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-lg flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <Play size={20} className="fill-slate-950" />
            <span>RESUME</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Restart Run</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 size={16} className="text-cyan-400" />
                <span>Audio: Enabled</span>
              </>
            ) : (
              <>
                <VolumeX size={16} className="text-rose-400" />
                <span>Audio: Muted</span>
              </>
            )}
          </button>

          {/* Return Home */}
          <button
            onClick={onHome}
            className="w-full py-2.5 px-4 rounded-2xl bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Home size={14} />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
