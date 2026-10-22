import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStats, UserSavedData } from '../types';
import { RotateCcw, Home, Trophy, Sparkles, Shirt } from 'lucide-react';

interface GameOverScreenProps {
  stats: GameStats;
  savedData: UserSavedData;
  isNewRecord: boolean;
  onRestart: () => void;
  onHome: () => void;
  onOpenSkins: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  savedData,
  isNewRecord,
  onRestart,
  onHome,
  onOpenSkins,
}) => {
  useEffect(() => {
    if (isNewRecord) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#f59e0b', '#ec4899', '#10b981'],
        });
      } catch {
        // Safe fallback if canvas-confetti fails
      }
    }
  }, [isNewRecord]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center my-auto">
        {/* New record badge or standard crash */}
        {isNewRecord ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-wider mb-2 animate-bounce">
            <Sparkles size={14} />
            <span>NEW HIGH SCORE!</span>
          </div>
        ) : (
          <div className="text-xs uppercase tracking-widest font-bold text-rose-400 mb-1">
            RUN FINISHED
          </div>
        )}

        {/* Score Display */}
        <h2 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mb-1">
          {stats.score.toLocaleString()}
        </h2>
        <p className="text-xs text-slate-400 mb-6">Total Run Score</p>

        {/* Detailed Run Breakdown */}
        <div className="w-full grid grid-cols-2 gap-2.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 mb-5 text-left">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500">Distance</span>
            <span className="text-lg font-black font-mono text-cyan-400">
              {Math.floor(stats.distance)} m
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500">Coins Collected</span>
            <span className="text-lg font-black font-mono text-amber-400">
              +{stats.coins}
            </span>
          </div>

          <div className="flex flex-col pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Trophy size={10} className="text-amber-400" />
              <span>All-time Best</span>
            </span>
            <span className="text-base font-bold font-mono text-white">
              {savedData.highScore.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Banked Coins</span>
            <span className="text-base font-bold font-mono text-amber-300">
              {savedData.totalCoins}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Play Again */}
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-black text-lg flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw size={20} className="stroke-[3]" />
            <span>PLAY AGAIN</span>
          </button>

          {/* Skins Button */}
          <button
            onClick={onOpenSkins}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Shirt size={15} className="text-cyan-400" />
            <span>Customize Suit ({savedData.totalCoins} coins)</span>
          </button>

          {/* Main Menu */}
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
