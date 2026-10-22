import React from 'react';
import { X, Check, Lock, Shirt } from 'lucide-react';
import { AVAILABLE_SKINS } from '../game/constants';
import { PlayerSkin, UserSavedData } from '../types';

interface SkinsModalProps {
  savedData: UserSavedData;
  onSelectSkin: (skin: PlayerSkin) => void;
  onUnlockSkin: (skin: PlayerSkin) => void;
  onClose: () => void;
}

export const SkinsModal: React.FC<SkinsModalProps> = ({
  savedData,
  onSelectSkin,
  onUnlockSkin,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shirt className="text-cyan-400" size={20} />
            <h3 className="text-lg font-black text-white">Runner Suits & Outfits</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Coin Balance */}
        <div className="my-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Your Coin Balance</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[9px] font-black text-slate-950">
              $
            </div>
            <span className="text-lg font-black font-mono text-amber-400">{savedData.totalCoins}</span>
          </div>
        </div>

        {/* Skins List */}
        <div className="flex flex-col gap-3 my-2">
          {AVAILABLE_SKINS.map((skin) => {
            const isUnlocked = savedData.unlockedSkins.includes(skin.id);
            const isEquipped = savedData.selectedSkinId === skin.id;
            const canAfford = savedData.totalCoins >= skin.price;

            return (
              <div
                key={skin.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isEquipped
                    ? 'bg-cyan-950/30 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Visual Color Palette Badges */}
                    <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: skin.primaryColor }} />
                      <div className="w-6 h-3 rounded-md" style={{ backgroundColor: skin.accentColor }} />
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{skin.name}</span>
                        {isEquipped && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Equipped
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{skin.description}</p>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0">
                    {isEquipped ? (
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 flex items-center justify-center">
                        <Check size={16} />
                      </div>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onSelectSkin(skin)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnlockSkin(skin)}
                        disabled={!canAfford}
                        className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                        }`}
                      >
                        <Lock size={12} />
                        <span>{skin.price} Coins</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm tracking-wide transition active:scale-95 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
