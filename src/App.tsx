/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { PauseScreen } from './components/PauseScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { TutorialModal } from './components/TutorialModal';
import { SkinsModal } from './components/SkinsModal';
import { soundManager } from './audio/SoundEffects';
import { AVAILABLE_SKINS, INITIAL_SPEED } from './game/constants';
import { ActivePowerUp, GameState, GameStats, PlayerSkin, UserSavedData } from './types';

const STORAGE_KEY = 'dms_run_saved_data_v1';

const DEFAULT_SAVED_DATA: UserSavedData = {
  highScore: 0,
  bestDistance: 0,
  totalCoins: 0,
  runsPlayed: 0,
  selectedSkinId: 'cyber-runner',
  unlockedSkins: ['cyber-runner'],
  soundEnabled: true,
  musicEnabled: true,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Saved player data
  const [savedData, setSavedData] = useState<UserSavedData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SAVED_DATA, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore localStorage error
    }
    return DEFAULT_SAVED_DATA;
  });

  // UI state
  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    speed: INITIAL_SPEED,
    multiplier: 1,
  });
  const [powerUps, setPowerUps] = useState<ActivePowerUp[]>([]);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSkins, setShowSkins] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Save changes to localStorage
  const updateSavedData = useCallback((updater: (prev: UserSavedData) => UserSavedData) => {
    setSavedData((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Fallback
      }
      return updated;
    });
  }, []);

  const currentSkin = AVAILABLE_SKINS.find((s) => s.id === savedData.selectedSkinId) || AVAILABLE_SKINS[0];

  // Touch gesture coordinates
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize GameEngine once
  useEffect(() => {
    if (!mountRef.current) return;

    soundManager.setSoundEnabled(savedData.soundEnabled);
    soundManager.setMusicEnabled(savedData.musicEnabled);

    try {
      const engine = new GameEngine(mountRef.current, savedData.selectedSkinId, {
        onScoreUpdate: (newStats) => {
          setStats({ ...newStats });
        },
        onPowerUpsUpdate: (active) => {
          setPowerUps([...active]);
        },
        onCoinCollected: (_count) => {
          // Handled via stats update
        },
        onGameOver: (finalStats) => {
          setGameState('GAMEOVER');

          setSavedData((prev) => {
            const isRecord = finalStats.score > prev.highScore;
            setIsNewRecord(isRecord);

            const updated: UserSavedData = {
              ...prev,
              highScore: Math.max(prev.highScore, finalStats.score),
              bestDistance: Math.max(prev.bestDistance, finalStats.distance),
              totalCoins: prev.totalCoins + finalStats.coins,
              runsPlayed: prev.runsPlayed + 1,
            };

            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // Ignore
            }

            return updated;
          });
        },
      });

      engineRef.current = engine;

      return () => {
        engine.cleanup();
        engineRef.current = null;
      };
    } catch (err: unknown) {
      console.error('Failed to initialize 3D GameEngine:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setInitError(msg);
    }
  }, []); // Run once on mount

  // Sync skin changes with 3D rig
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSkin(currentSkin);
    }
  }, [currentSkin]);

  // Controls triggers
  const handleMoveLeft = useCallback(() => {
    engineRef.current?.moveLeft();
  }, []);

  const handleMoveRight = useCallback(() => {
    engineRef.current?.moveRight();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.jump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.slide();
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal open or typing
      if (showTutorial || showSkins) {
        if (e.key === 'Escape') {
          setShowTutorial(false);
          setShowSkins(false);
        }
        return;
      }

      if (gameState === 'PLAYING') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          e.preventDefault();
          handleMoveLeft();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          e.preventDefault();
          handleMoveRight();
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
          e.preventDefault();
          handleJump();
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          handleSlide();
        } else if (e.code === 'KeyP' || e.code === 'Escape') {
          e.preventDefault();
          engineRef.current?.pauseGame();
          setGameState('PAUSED');
        }
      } else if (gameState === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        handleStart();
      } else if (gameState === 'GAMEOVER' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showTutorial, showSkins, handleMoveLeft, handleMoveRight, handleJump, handleSlide]);

  // Touch gesture listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || gameState !== 'PLAYING') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const minSwipeDist = 28; // Minimum gesture threshold in pixels

    if (Math.max(absX, absY) > minSwipeDist) {
      if (absX > absY) {
        // Horizontal swipe
        if (dx > 0) {
          handleMoveRight();
        } else {
          handleMoveLeft();
        }
      } else {
        // Vertical swipe
        if (dy < 0) {
          handleJump();
        } else {
          handleSlide();
        }
      }
    }

    touchStartPos.current = null;
  };

  // Game lifecycle methods
  const handleStart = () => {
    soundManager.playClick();
    engineRef.current?.startGame();
    setGameState('PLAYING');
    setIsNewRecord(false);
  };

  const handlePause = () => {
    soundManager.playClick();
    engineRef.current?.pauseGame();
    setGameState('PAUSED');
  };

  const handleResume = () => {
    soundManager.playClick();
    engineRef.current?.resumeGame();
    setGameState('PLAYING');
  };

  const handleRestart = () => {
    soundManager.playClick();
    engineRef.current?.restartGame();
    setGameState('PLAYING');
    setIsNewRecord(false);
  };

  const handleHome = () => {
    soundManager.playClick();
    setGameState('START');
    soundManager.stopBGM();
  };

  const handleToggleSound = () => {
    const nextState = !savedData.soundEnabled;
    soundManager.setSoundEnabled(nextState);
    soundManager.setMusicEnabled(nextState);
    updateSavedData((prev) => ({
      ...prev,
      soundEnabled: nextState,
      musicEnabled: nextState,
    }));
  };

  const handleSelectSkin = (skin: PlayerSkin) => {
    soundManager.playClick();
    updateSavedData((prev) => ({
      ...prev,
      selectedSkinId: skin.id,
    }));
  };

  const handleUnlockSkin = (skin: PlayerSkin) => {
    if (savedData.totalCoins >= skin.price) {
      soundManager.playPowerUp();
      updateSavedData((prev) => ({
        ...prev,
        totalCoins: prev.totalCoins - skin.price,
        unlockedSkins: [...prev.unlockedSkins, skin.id],
        selectedSkinId: skin.id,
      }));
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Host Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Visible Fallback if WebGL fails to mount */}
      {initError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950 text-white text-center">
          <div className="max-w-md bg-slate-900 border border-red-500/50 p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-red-400 mb-2">Graphics Initialization Error</h3>
            <p className="text-sm text-slate-300 mb-4">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 rounded-xl font-bold hover:bg-red-500"
            >
              Reload Game
            </button>
          </div>
        </div>
      )}

      {/* Screen: PLAYING HUD */}
      {gameState === 'PLAYING' && (
        <GameHUD
          stats={stats}
          highScore={savedData.highScore}
          powerUps={powerUps}
          soundEnabled={savedData.soundEnabled}
          onToggleSound={handleToggleSound}
          onPause={handlePause}
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onJump={handleJump}
          onSlide={handleSlide}
          showTouchControls={showTouchControls}
        />
      )}

      {/* Screen: START MENU */}
      {gameState === 'START' && (
        <StartScreen
          savedData={savedData}
          currentSkin={currentSkin}
          onPlay={handleStart}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenSkins={() => setShowSkins(true)}
          onToggleSound={handleToggleSound}
          showTouchControls={showTouchControls}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
        />
      )}

      {/* Screen: PAUSE OVERLAY */}
      {gameState === 'PAUSED' && (
        <PauseScreen
          stats={stats}
          soundEnabled={savedData.soundEnabled}
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Screen: GAME OVER OVERLAY */}
      {gameState === 'GAMEOVER' && (
        <GameOverScreen
          stats={stats}
          savedData={savedData}
          isNewRecord={isNewRecord}
          onRestart={handleRestart}
          onHome={handleHome}
          onOpenSkins={() => setShowSkins(true)}
        />
      )}

      {/* Modal: Tutorial */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {/* Modal: Skins */}
      {showSkins && (
        <SkinsModal
          savedData={savedData}
          onSelectSkin={handleSelectSkin}
          onUnlockSkin={handleUnlockSkin}
          onClose={() => setShowSkins(false)}
        />
      )}
    </div>
  );
}
