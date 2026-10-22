export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type PowerUpType = 'MAGNET' | 'MULTIPLIER' | 'SHIELD' | 'SUPER_JUMP';

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number; // in seconds
  remaining: number;
}

export type LaneIndex = 0 | 1 | 2; // Left (-1), Middle (0), Right (1)

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  speed: number;
  multiplier: number;
}

export interface PlayerSkin {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  price: number;
  unlocked: boolean;
  description: string;
}

export interface UserSavedData {
  highScore: number;
  bestDistance: number;
  totalCoins: number;
  runsPlayed: number;
  selectedSkinId: string;
  unlockedSkins: string[];
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export type ObstacleType = 
  | 'TRAIN' 
  | 'HURDLE' // Jump over
  | 'OVERHEAD_BARRIER' // Slide under
  | 'ROADBLOCK'; // Must switch lane
