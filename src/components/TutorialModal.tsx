import React from 'react';
import { X, ArrowLeftRight, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { POWER_UP_CONFIG } from '../game/constants';
import { PowerUpType } from '../types';

interface TutorialModalProps {
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const powerUpKeys: PowerUpType[] = ['MAGNET', 'MULTIPLIER', 'SHIELD', 'SUPER_JUMP'];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-400" size={20} />
            <h3 className="text-lg font-black text-white">How to Play DMS RUN</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Controls Sections */}
        <div className="flex flex-col gap-3.5 my-4">
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Controls</div>

          {/* Lane Switching */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Switch Lanes</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Swipe <strong className="text-slate-200">Left / Right</strong> or press <strong className="text-slate-200">A / D</strong> or <strong className="text-slate-200">← / →</strong> keys to dodge trains and hurdles.
              </div>
            </div>
          </div>

          {/* Jump */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ArrowUp size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Jump Over Hurdles & Onto Trains</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Swipe <strong className="text-slate-200">Up</strong> or press <strong className="text-slate-200">Space / W / ↑</strong>. You can run directly across train rooftops to gather sky coins!
              </div>
            </div>
          </div>

          {/* Slide */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ArrowDown size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Slide Under Overhead Barriers</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Swipe <strong className="text-slate-200">Down</strong> or press <strong className="text-slate-200">S / ↓</strong> to duck under overhead laser gantries, or fast-dive when in mid-air.
              </div>
            </div>
          </div>

          {/* Power-ups Section */}
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mt-1">Power-ups</div>

          <div className="grid grid-cols-2 gap-2">
            {powerUpKeys.map((key) => {
              const cfg = POWER_UP_CONFIG[key];
              return (
                <div key={key} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-xs font-bold text-white">{cfg.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">{cfg.description}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-2 py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm tracking-wide transition active:scale-95 cursor-pointer shadow-lg"
        >
          GOT IT, LET'S RUN!
        </button>
      </div>
    </div>
  );
};
