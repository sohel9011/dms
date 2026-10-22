import React from 'react';
import { UserSavedData, PlayerSkin } from '../types';
import { Play, Shirt, HelpCircle, Trophy, Volume2, VolumeX, Smartphone } from 'lucide-react';

interface StartScreenProps {
  savedData: UserSavedData;
  currentSkin: PlayerSkin;
  onPlay: () => void;
  onOpenTutorial: () => void;
  onOpenSkins: () => void;
  onToggleSound: () => void;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  savedData,
  currentSkin,
  onPlay,
  onOpenTutorial,
  onOpenSkins,
  onToggleSound,
  showTouchControls,
  onToggleTouchControls,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4 sm:p-8 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/90 select-none overflow-y-auto">
      {/* Top Header & Settings */}
      <div className="w-full max-w-xl flex items-center justify-between pt-2">
        {/* Total Coins */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-inner">
            $
          </div>
          <span className="font-mono font-bold text-amber-400 text-lg sm:text-xl">
            {savedData.totalCoins}
          </span>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          {/* Touch Buttons Toggle */}
          <button
            onClick={onToggleTouchControls}
            title={showTouchControls ? 'On-screen Touch Buttons: ON' : 'On-screen Touch Buttons: OFF'}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition shadow-md ${
              showTouchControls
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-400'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
            }`}
          >
            <Smartphone size={18} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition shadow-md"
          >
            {savedData.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Main Center Banner: DMS RUN */}
      <div className="flex flex-col items-center text-center my-auto py-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-widest uppercase mb-3 shadow-md">
          <span>⚡ High-Speed 3D Runner</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter leading-none bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-500 bg-clip-text text-transparent drop-shadow-2xl">
          DMS RUN
        </h1>

        <p className="mt-2 text-slate-300 text-sm sm:text-base font-medium max-w-sm">
          Sprint, dodge subway trains, leap hurdles, and harvest high-speed gold!
        </p>

        {/* Equipped Skin Pill */}
        <div
          onClick={onOpenSkins}
          className="mt-4 cursor-pointer inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 hover:border-slate-500 transition text-xs text-slate-200"
        >
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/20"
            style={{ backgroundColor: currentSkin.primaryColor }}
          />
          <span>Suit: <strong className="text-white">{currentSkin.name}</strong></span>
          <span className="text-cyan-400 underline ml-1">Change</span>
        </div>

        {/* Large Play Button */}
        <button
          onClick={onPlay}
          className="mt-8 group relative inline-flex items-center justify-center gap-3 px-10 py-4.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-black text-xl sm:text-2xl tracking-wide shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:shadow-[0_0_55px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Play size={28} className="fill-slate-950 transition-transform group-hover:translate-x-0.5" />
          <span>PLAY NOW</span>
        </button>
      </div>

      {/* Bottom Footer: Stats Card & Secondary Actions */}
      <div className="w-full max-w-xl flex flex-col gap-3 pb-2">
        {/* Record Stats Bar */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 flex items-center justify-around shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy size={16} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">High Score</div>
              <div className="text-base sm:text-lg font-black font-mono text-white">
                {savedData.highScore.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Best Distance</div>
            <div className="text-base sm:text-lg font-black font-mono text-cyan-400">
              {Math.floor(savedData.bestDistance)} m
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Runs</div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-300">
              {savedData.runsPlayed}
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onOpenSkins}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm shadow transition active:scale-95"
          >
            <Shirt size={16} className="text-cyan-400" />
            <span>Runner Suits</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm shadow transition active:scale-95"
          >
            <HelpCircle size={16} className="text-amber-400" />
            <span>How to Play</span>
          </button>
        </div>
      </div>
    </div>
  );
};
